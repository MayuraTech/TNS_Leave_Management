import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { LeaveService } from '../../../core/services/leave.service';
import { LeaveRequest } from '../../../core/models/leave-request.model';

@Component({
  selector: 'app-pending-requests',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="page-wrapper">
      <div class="page-header">
        <div>
          <h1 class="page-title">Pending Leave Requests</h1>
          <p class="page-subtitle">Review and action leave requests from your direct reports</p>
        </div>
      </div>

      <!-- Success banner -->
      <div class="success-banner" *ngIf="successMessage">
        <span class="banner-icon">✓</span> {{ successMessage }}
      </div>

      <!-- Error banner -->
      <div class="error-banner" *ngIf="errorMessage && !loading">
        {{ errorMessage }}
        <button class="retry-btn" (click)="loadRequests()">Retry</button>
      </div>

      <!-- Loading -->
      <div class="loading-state" *ngIf="loading">
        <div class="skeleton-row" *ngFor="let i of [1,2,3,4]"></div>
      </div>

      <!-- Empty state -->
      <div class="empty-state" *ngIf="!loading && !errorMessage && requests.length === 0">
        <div class="empty-icon">✅</div>
        <p class="empty-title">No pending requests</p>
        <p class="empty-sub">All leave requests from your team have been actioned.</p>
      </div>

      <!-- Table -->
      <div class="table-card" *ngIf="!loading && requests.length > 0">
        <table class="data-table">
          <thead>
            <tr>
              <th>Employee</th>
              <th>Leave Type</th>
              <th>Start Date</th>
              <th>End Date</th>
              <th>Duration</th>
              <th>Reason</th>
              <th>Submitted</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr class="table-row" *ngFor="let req of requests">
              <td class="cell-employee">{{ req.employeeName || '—' }}</td>
              <td class="cell-leave-type">{{ req.leaveTypeName || '—' }}</td>
              <td>{{ req.startDate | date:'dd MMM yyyy' }}</td>
              <td>{{ req.endDate | date:'dd MMM yyyy' }}</td>
              <td class="cell-duration">
                <span *ngIf="req.durationType === 'FULL_DAY'">
                  {{ req.totalDays }} day{{ req.totalDays !== 1 ? 's' : '' }}
                </span>
                <span *ngIf="req.durationType === 'HALF_DAY'">Half day</span>
                <span *ngIf="req.durationType === 'HOURLY'">{{ req.durationInHours }} hr{{ req.durationInHours !== 1 ? 's' : '' }}</span>
              </td>
              <td class="cell-reason" [title]="req.reason">{{ req.reason | slice:0:60 }}{{ req.reason.length > 60 ? '…' : '' }}</td>
              <td class="cell-submitted">{{ req.submittedAt | date:'dd MMM yyyy' }}</td>
              <td class="cell-actions">
                <button
                  class="btn-approve"
                  [disabled]="processingId === req.id"
                  (click)="approve(req)">
                  {{ processingId === req.id && actionType === 'approve' ? 'Approving…' : 'Approve' }}
                </button>
                <button
                  class="btn-deny"
                  [disabled]="processingId === req.id"
                  (click)="openDenyModal(req)">
                  Deny
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Deny reason modal -->
      <div class="modal-overlay" *ngIf="denyTarget" (click)="closeDenyModal()">
        <div class="modal-card" (click)="$event.stopPropagation()">
          <h3 class="modal-title">Deny Leave Request</h3>
          <p class="modal-body">
            You are denying the <strong>{{ denyTarget.leaveTypeName }}</strong> request from
            <strong>{{ denyTarget.employeeName }}</strong>
            ({{ denyTarget.startDate | date:'dd MMM yyyy' }}
            <ng-container *ngIf="denyTarget.startDate !== denyTarget.endDate">
              – {{ denyTarget.endDate | date:'dd MMM yyyy' }}
            </ng-container>).
          </p>

          <form [formGroup]="denyForm" (ngSubmit)="confirmDeny()" novalidate>
            <div class="field-group">
              <label class="field-label" for="denialReason">
                Reason for Denial <span class="required">*</span>
              </label>
              <textarea
                id="denialReason"
                formControlName="reason"
                class="field-input field-textarea"
                [class.error]="isDenyReasonInvalid()"
                rows="4"
                placeholder="Provide a clear reason for denying this request…">
              </textarea>
              <span class="error-msg" *ngIf="isDenyReasonInvalid()">A denial reason is required.</span>
            </div>

            <div class="modal-error" *ngIf="denyError">{{ denyError }}</div>

            <div class="modal-actions">
              <button type="button" class="btn-secondary" (click)="closeDenyModal()">Cancel</button>
              <button type="submit" class="btn-danger" [disabled]="denying">
                {{ denying ? 'Denying…' : 'Confirm Deny' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .page-wrapper {
      padding: 32px;
      background: #F3F4F6;
      min-height: 100vh;
    }

    .page-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      margin-bottom: 24px;
    }

    .page-title {
      font-family: 'Outfit', 'General Sans', sans-serif;
      font-size: 1.75rem;
      font-weight: 700;
      color: #0A1628;
      margin: 0 0 4px;
    }

    .page-subtitle {
      font-size: 0.875rem;
      color: #6B7280;
      margin: 0;
    }

    /* Banners */
    .success-banner {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px 16px;
      background: #D1FAE5;
      border: 1px solid #6EE7B7;
      border-radius: 8px;
      color: #065F46;
      font-size: 0.875rem;
      font-weight: 500;
      margin-bottom: 20px;
    }

    .banner-icon { font-size: 1rem; }

    .error-banner {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 14px 16px;
      background: #FEE2E2;
      border: 1px solid #FECACA;
      border-radius: 8px;
      color: #DC2626;
      font-size: 0.875rem;
      margin-bottom: 20px;
    }

    .retry-btn {
      padding: 4px 12px;
      background: #DC2626;
      color: #fff;
      border: none;
      border-radius: 6px;
      font-size: 0.8125rem;
      cursor: pointer;
    }

    /* Loading skeletons */
    .loading-state { display: flex; flex-direction: column; gap: 8px; }

    .skeleton-row {
      height: 56px;
      background: linear-gradient(90deg, #E5E7EB 25%, #F3F4F6 50%, #E5E7EB 75%);
      background-size: 200% 100%;
      border-radius: 8px;
      animation: shimmer 1.4s infinite;
    }

    @keyframes shimmer {
      0% { background-position: 200% 0; }
      100% { background-position: -200% 0; }
    }

    /* Empty state */
    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 64px 24px;
      background: #fff;
      border-radius: 12px;
      box-shadow: 0 4px 12px rgba(10, 22, 40, 0.08);
    }

    .empty-icon { font-size: 3rem; margin-bottom: 16px; }
    .empty-title { font-size: 1.125rem; font-weight: 700; color: #0A1628; margin: 0 0 8px; }
    .empty-sub { font-size: 0.875rem; color: #6B7280; margin: 0; text-align: center; }

    /* Table */
    .table-card {
      background: #fff;
      border-radius: 12px;
      box-shadow: 0 4px 12px rgba(10, 22, 40, 0.08);
      overflow: hidden;
    }

    .data-table {
      width: 100%;
      border-collapse: collapse;
    }

    .data-table thead tr {
      background: #0F2240;
    }

    .data-table th {
      padding: 14px 16px;
      text-align: left;
      font-size: 0.75rem;
      font-weight: 600;
      color: #fff;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      white-space: nowrap;
    }

    .table-row {
      border-bottom: 1px solid #F3F4F6;
      transition: background 0.15s;
    }

    .table-row:hover { background: #FEF3C7; }
    .table-row:last-child { border-bottom: none; }

    .data-table td {
      padding: 14px 16px;
      font-size: 0.875rem;
      color: #374151;
      vertical-align: middle;
    }

    .cell-employee { font-weight: 600; color: #0A1628; }
    .cell-leave-type { font-weight: 500; }
    .cell-reason { max-width: 200px; color: #6B7280; font-size: 0.8125rem; }
    .cell-duration { white-space: nowrap; }

    /* Action buttons */
    .cell-actions {
      display: flex;
      gap: 8px;
      white-space: nowrap;
    }

    .btn-approve {
      padding: 6px 14px;
      background: #059669;
      color: #fff;
      border: none;
      border-radius: 6px;
      font-size: 0.8125rem;
      font-weight: 600;
      cursor: pointer;
      transition: opacity 0.15s;
      white-space: nowrap;
    }

    .btn-approve:hover:not(:disabled) { opacity: 0.85; }
    .btn-approve:disabled { opacity: 0.5; cursor: not-allowed; }

    .btn-deny {
      padding: 6px 14px;
      background: transparent;
      border: 1px solid #DC2626;
      border-radius: 6px;
      color: #DC2626;
      font-size: 0.8125rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.15s;
      white-space: nowrap;
    }

    .btn-deny:hover:not(:disabled) { background: #FEE2E2; }
    .btn-deny:disabled { opacity: 0.5; cursor: not-allowed; }

    /* Modal */
    .modal-overlay {
      position: fixed;
      inset: 0;
      background: rgba(10, 22, 40, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      padding: 16px;
    }

    .modal-card {
      background: #fff;
      border-radius: 12px;
      padding: 32px;
      max-width: 520px;
      width: 100%;
      box-shadow: 0 20px 48px rgba(10, 22, 40, 0.16);
    }

    .modal-title {
      font-family: 'Outfit', sans-serif;
      font-size: 1.25rem;
      font-weight: 700;
      color: #0A1628;
      margin: 0 0 12px;
    }

    .modal-body {
      font-size: 0.9375rem;
      color: #374151;
      margin: 0 0 20px;
      line-height: 1.6;
    }

    .field-group { margin-bottom: 16px; }

    .field-label {
      display: block;
      font-weight: 600;
      font-size: 0.875rem;
      color: #374151;
      margin-bottom: 6px;
    }

    .required { color: #DC2626; }

    .field-input {
      width: 100%;
      padding: 10px 12px;
      border: 1px solid #D1D5DB;
      border-radius: 8px;
      font-size: 0.9375rem;
      color: #111827;
      background: #fff;
      box-sizing: border-box;
      transition: border-color 0.15s;
      font-family: inherit;
    }

    .field-input:focus {
      outline: none;
      border: 2px solid #F59E0B;
    }

    .field-input.error {
      border-color: #DC2626;
      background: #FEF2F2;
    }

    .field-textarea {
      resize: vertical;
      min-height: 96px;
    }

    .error-msg {
      display: block;
      margin-top: 4px;
      font-size: 0.8125rem;
      color: #DC2626;
    }

    .modal-error {
      padding: 10px 14px;
      background: #FEF2F2;
      border: 1px solid #FECACA;
      border-radius: 8px;
      color: #DC2626;
      font-size: 0.875rem;
      margin-bottom: 16px;
    }

    .modal-actions {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
    }

    .btn-secondary {
      padding: 10px 20px;
      background: transparent;
      color: #1E4D8C;
      border: 1px solid #1E4D8C;
      border-radius: 8px;
      font-weight: 600;
      font-size: 0.9375rem;
      cursor: pointer;
      transition: background 0.15s;
    }

    .btn-secondary:hover { background: #EFF6FF; }

    .btn-danger {
      padding: 10px 20px;
      background: #DC2626;
      color: #fff;
      border: none;
      border-radius: 8px;
      font-weight: 700;
      font-size: 0.9375rem;
      cursor: pointer;
      transition: opacity 0.15s;
    }

    .btn-danger:hover:not(:disabled) { opacity: 0.9; }
    .btn-danger:disabled { opacity: 0.6; cursor: not-allowed; }

    @media (max-width: 768px) {
      .page-wrapper { padding: 16px; }
      .data-table { font-size: 0.8125rem; }
      .data-table th, .data-table td { padding: 10px 12px; }
      .cell-actions { flex-direction: column; gap: 4px; }
    }
  `]
})
export class PendingRequestsComponent implements OnInit {
  requests: LeaveRequest[] = [];
  loading = false;
  errorMessage = '';
  successMessage = '';

  // Approve state
  processingId: number | null = null;
  actionType: 'approve' | 'deny' | null = null;

  // Deny modal state
  denyTarget: LeaveRequest | null = null;
  denyForm!: FormGroup;
  denying = false;
  denyError = '';

  constructor(
    private leaveService: LeaveService,
    private fb: FormBuilder
  ) {}

  ngOnInit(): void {
    this.denyForm = this.fb.group({
      reason: ['', [Validators.required, Validators.minLength(1)]]
    });
    this.loadRequests();
  }

  loadRequests(): void {
    this.loading = true;
    this.errorMessage = '';
    this.leaveService.getPendingRequests().subscribe({
      next: (reqs) => {
        this.requests = reqs;
        this.loading = false;
      },
      error: () => {
        this.errorMessage = 'Failed to load pending requests. Please try again.';
        this.loading = false;
      }
    });
  }

  approve(req: LeaveRequest): void {
    this.processingId = req.id;
    this.actionType = 'approve';
    this.successMessage = '';
    this.errorMessage = '';

    this.leaveService.approveLeaveRequest(req.id, '').subscribe({
      next: () => {
        this.processingId = null;
        this.actionType = null;
        this.successMessage = `Leave request for ${req.employeeName} has been approved.`;
        this.requests = this.requests.filter(r => r.id !== req.id);
        this.clearSuccessAfterDelay();
      },
      error: (err) => {
        this.processingId = null;
        this.actionType = null;
        this.errorMessage = err?.error?.message ?? 'Failed to approve the request. Please try again.';
      }
    });
  }

  openDenyModal(req: LeaveRequest): void {
    this.denyTarget = req;
    this.denyError = '';
    this.denyForm.reset();
  }

  closeDenyModal(): void {
    if (this.denying) return;
    this.denyTarget = null;
    this.denyError = '';
    this.denyForm.reset();
  }

  confirmDeny(): void {
    this.denyForm.markAllAsTouched();
    if (this.denyForm.invalid || !this.denyTarget) return;

    const reason: string = this.denyForm.get('reason')!.value.trim();
    if (!reason) {
      this.denyForm.get('reason')!.setErrors({ required: true });
      return;
    }

    this.denying = true;
    this.denyError = '';

    this.leaveService.denyLeaveRequest(this.denyTarget.id, reason).subscribe({
      next: () => {
        const name = this.denyTarget!.employeeName;
        this.requests = this.requests.filter(r => r.id !== this.denyTarget!.id);
        this.denyTarget = null;
        this.denying = false;
        this.denyForm.reset();
        this.successMessage = `Leave request for ${name} has been denied.`;
        this.clearSuccessAfterDelay();
      },
      error: (err) => {
        this.denying = false;
        this.denyError = err?.error?.message ?? 'Failed to deny the request. Please try again.';
      }
    });
  }

  isDenyReasonInvalid(): boolean {
    const ctrl = this.denyForm.get('reason');
    return !!(ctrl && ctrl.invalid && (ctrl.dirty || ctrl.touched));
  }

  private clearSuccessAfterDelay(): void {
    setTimeout(() => { this.successMessage = ''; }, 5000);
  }
}
