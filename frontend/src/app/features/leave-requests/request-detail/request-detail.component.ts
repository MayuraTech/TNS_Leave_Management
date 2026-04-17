import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { LeaveService } from '../../../core/services/leave.service';
import { LeaveRequest } from '../../../core/models/leave-request.model';

@Component({
  selector: 'app-request-detail',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="page-wrapper">

      <!-- Loading -->
      <div class="loading-card" *ngIf="loading">
        <div class="skeleton-header"></div>
        <div class="skeleton-body"></div>
      </div>

      <!-- Error -->
      <div class="error-banner" *ngIf="error && !loading">
        {{ error }}
        <button class="retry-btn" (click)="loadRequest()">Retry</button>
      </div>

      <!-- Detail card -->
      <div class="detail-card" *ngIf="request && !loading">
        <!-- Card header -->
        <div class="card-header">
          <div class="header-left">
            <a routerLink="/leave" class="back-link">← Back to requests</a>
            <h1 class="card-title">{{ request.leaveTypeName || 'Leave Request' }}</h1>
            <span class="status-badge" [class]="'status-' + request.status.toLowerCase()">
              {{ request.status }}
            </span>
          </div>
          <button
            *ngIf="isCancellable(request)"
            class="btn-cancel"
            [disabled]="cancelling"
            (click)="cancelRequest()">
            {{ cancelling ? 'Cancelling…' : 'Cancel Request' }}
          </button>
        </div>

        <!-- Divider -->
        <div class="divider"></div>

        <!-- Details grid -->
        <div class="details-grid">

          <div class="detail-section">
            <h3 class="section-title">Leave Details</h3>

            <div class="detail-row">
              <span class="detail-label">Leave Type</span>
              <span class="detail-value">{{ request.leaveTypeName || '—' }}</span>
            </div>

            <div class="detail-row">
              <span class="detail-label">Duration Type</span>
              <span class="detail-value">
                <span class="type-badge">{{ formatDurationType(request.durationType) }}</span>
              </span>
            </div>

            <div class="detail-row" *ngIf="request.durationType === 'FULL_DAY'">
              <span class="detail-label">Start Date</span>
              <span class="detail-value">{{ request.startDate | date:'EEEE, dd MMMM yyyy' }}</span>
            </div>

            <div class="detail-row" *ngIf="request.durationType === 'FULL_DAY'">
              <span class="detail-label">End Date</span>
              <span class="detail-value">{{ request.endDate | date:'EEEE, dd MMMM yyyy' }}</span>
            </div>

            <div class="detail-row" *ngIf="request.durationType !== 'FULL_DAY'">
              <span class="detail-label">Date</span>
              <span class="detail-value">{{ request.startDate | date:'EEEE, dd MMMM yyyy' }}</span>
            </div>

            <div class="detail-row" *ngIf="request.durationType === 'HALF_DAY'">
              <span class="detail-label">Session</span>
              <span class="detail-value">
                <span class="session-badge">{{ request.sessionType || '—' }}</span>
              </span>
            </div>

            <div class="detail-row" *ngIf="request.durationType === 'HOURLY'">
              <span class="detail-label">Duration</span>
              <span class="detail-value">{{ request.durationInHours }} hour{{ request.durationInHours !== 1 ? 's' : '' }}</span>
            </div>

            <div class="detail-row" *ngIf="request.durationType === 'FULL_DAY'">
              <span class="detail-label">Total Days</span>
              <span class="detail-value highlight">{{ request.totalDays }} working day{{ request.totalDays !== 1 ? 's' : '' }}</span>
            </div>

            <div class="detail-row">
              <span class="detail-label">Reason</span>
              <span class="detail-value reason-text">{{ request.reason }}</span>
            </div>
          </div>

          <div class="detail-section">
            <h3 class="section-title">Status & Timeline</h3>

            <div class="detail-row">
              <span class="detail-label">Current Status</span>
              <span class="detail-value">
                <span class="status-badge" [class]="'status-' + request.status.toLowerCase()">
                  {{ request.status }}
                </span>
              </span>
            </div>

            <div class="detail-row">
              <span class="detail-label">Submitted At</span>
              <span class="detail-value">{{ request.submittedAt | date:'dd MMM yyyy, HH:mm' }}</span>
            </div>

            <div class="detail-row" *ngIf="request.processedAt">
              <span class="detail-label">Processed At</span>
              <span class="detail-value">{{ request.processedAt | date:'dd MMM yyyy, HH:mm' }}</span>
            </div>

            <ng-container *ngIf="request.status === 'APPROVED' || request.status === 'DENIED'">
              <div class="divider-light"></div>

              <div class="detail-row" *ngIf="request.approvalComments">
                <span class="detail-label">
                  {{ request.status === 'APPROVED' ? 'Approval Comments' : 'Denial Reason' }}
                </span>
                <span class="detail-value comment-text">{{ request.approvalComments }}</span>
              </div>

              <div class="detail-row" *ngIf="!request.approvalComments">
                <span class="detail-label">
                  {{ request.status === 'APPROVED' ? 'Approval Comments' : 'Denial Reason' }}
                </span>
                <span class="detail-value muted">No comments provided.</span>
              </div>
            </ng-container>
          </div>
        </div>

        <!-- Cancellable notice -->
        <div class="info-notice" *ngIf="isCancellable(request)">
          <span class="notice-icon">ℹ️</span>
          <span>This request can be cancelled since it hasn't started yet. Your leave balance will be restored upon cancellation.</span>
        </div>

        <!-- Started notice -->
        <div class="warning-notice" *ngIf="request.status === 'PENDING' && !isCancellable(request)">
          <span class="notice-icon">⚠️</span>
          <span>This leave period has already started. Contact your manager to cancel the remaining days.</span>
        </div>
      </div>

      <!-- Cancel confirm modal -->
      <div class="modal-overlay" *ngIf="showConfirm" (click)="showConfirm = false">
        <div class="modal-card" (click)="$event.stopPropagation()">
          <h3 class="modal-title">Cancel Leave Request</h3>
          <p class="modal-body" *ngIf="request">
            Are you sure you want to cancel your <strong>{{ request.leaveTypeName }}</strong> request
            from <strong>{{ request.startDate | date:'dd MMM yyyy' }}</strong>
            <ng-container *ngIf="request.startDate !== request.endDate">
              to <strong>{{ request.endDate | date:'dd MMM yyyy' }}</strong>
            </ng-container>?
          </p>
          <p class="modal-note">Your leave balance will be restored.</p>
          <div class="modal-actions">
            <button class="btn-secondary" (click)="showConfirm = false">Keep Request</button>
            <button class="btn-danger" (click)="confirmCancel()">Yes, Cancel It</button>
          </div>
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

    /* Detail card */
    .detail-card {
      background: #fff;
      border-radius: 12px;
      box-shadow: 0 4px 12px rgba(10, 22, 40, 0.08);
      border-left: 3px solid #F59E0B;
      max-width: 900px;
      padding: 32px;
    }

    /* Card header */
    .card-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 16px;
      margin-bottom: 24px;
    }

    .header-left {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .back-link {
      display: inline-flex; align-items: center; gap: 6px;
      padding: 6px 14px; border-radius: 7px; font-size: 0.85rem; font-weight: 600;
      text-decoration: none; transition: all 150ms ease;
      background: var(--color-bg-indigo-light, #d6ddf9);
      color: var(--color-primary-800, #3f476e);
      border: 1px solid var(--color-bg-blue-lighter, #b3c3e6);
    }

    .back-link:hover { background: var(--color-bg-blue-lighter, #b3c3e6); transform: translateY(-1px); text-decoration: none; }

    .card-title {
      font-family: 'Outfit', 'General Sans', sans-serif;
      font-size: 1.5rem;
      font-weight: 700;
      color: #0A1628;
      margin: 0;
    }

    /* Dividers */
    .divider {
      height: 1px;
      background: #E5E7EB;
      margin-bottom: 28px;
    }

    .divider-light {
      height: 1px;
      background: #F3F4F6;
      margin: 12px 0;
    }

    /* Details grid */
    .details-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 32px;
      margin-bottom: 24px;
    }

    .detail-section {}

    .section-title {
      font-family: 'Outfit', sans-serif;
      font-size: 0.875rem;
      font-weight: 700;
      color: #6B7280;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      margin: 0 0 16px;
    }

    .detail-row {
      display: flex;
      flex-direction: column;
      gap: 3px;
      margin-bottom: 16px;
    }

    .detail-label {
      font-size: 0.8125rem;
      font-weight: 600;
      color: #6B7280;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }

    .detail-value {
      font-size: 0.9375rem;
      color: #111827;
      font-weight: 500;
    }

    .detail-value.highlight {
      font-size: 1.0625rem;
      font-weight: 700;
      color: #0A1628;
    }

    .detail-value.muted { color: #9CA3AF; font-style: italic; }

    .reason-text, .comment-text {
      line-height: 1.6;
      color: #374151;
      font-weight: 400;
    }

    /* Status badges */
    .status-badge {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 0.75rem;
      font-weight: 700;
      letter-spacing: 0.03em;
      text-transform: uppercase;
    }

    .status-pending { background: #FEF3C7; color: #B45309; }
    .status-approved { background: #D1FAE5; color: #065F46; }
    .status-denied { background: #FEE2E2; color: #991B1B; }
    .status-cancelled { background: #F3F4F6; color: #4B5563; }

    /* Type badge */
    .type-badge {
      display: inline-block;
      padding: 3px 10px;
      border-radius: 6px;
      font-size: 0.8125rem;
      font-weight: 500;
      background: #EFF6FF;
      color: #1E4D8C;
    }

    /* Session badge */
    .session-badge {
      display: inline-block;
      padding: 3px 10px;
      border-radius: 6px;
      font-size: 0.8125rem;
      font-weight: 500;
      background: #F3F4F6;
      color: #374151;
    }

    /* Cancel button */
    .btn-cancel {
      padding: 10px 20px;
      background: transparent;
      border: 1px solid #DC2626;
      border-radius: 8px;
      color: #DC2626;
      font-size: 0.9375rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.15s;
      white-space: nowrap;
      flex-shrink: 0;
    }

    .btn-cancel:hover:not(:disabled) { background: #FEE2E2; }
    .btn-cancel:disabled { opacity: 0.5; cursor: not-allowed; }

    /* Notices */
    .info-notice, .warning-notice {
      display: flex;
      align-items: flex-start;
      gap: 10px;
      padding: 14px 16px;
      border-radius: 8px;
      font-size: 0.875rem;
      line-height: 1.5;
    }

    .info-notice {
      background: #EFF6FF;
      border: 1px solid #BFDBFE;
      color: #1E4D8C;
    }

    .warning-notice {
      background: #FEF3C7;
      border: 1px solid #FDE68A;
      color: #92400E;
    }

    .notice-icon { flex-shrink: 0; }

    /* Loading skeletons */
    .loading-card {
      background: #fff;
      border-radius: 12px;
      padding: 32px;
      max-width: 900px;
    }

    .skeleton-header {
      height: 32px;
      width: 40%;
      background: linear-gradient(90deg, #E5E7EB 25%, #F3F4F6 50%, #E5E7EB 75%);
      background-size: 200% 100%;
      border-radius: 6px;
      margin-bottom: 16px;
      animation: shimmer 1.4s infinite;
    }

    .skeleton-body {
      height: 200px;
      background: linear-gradient(90deg, #E5E7EB 25%, #F3F4F6 50%, #E5E7EB 75%);
      background-size: 200% 100%;
      border-radius: 6px;
      animation: shimmer 1.4s infinite;
    }

    @keyframes shimmer {
      0% { background-position: 200% 0; }
      100% { background-position: -200% 0; }
    }

    /* Error banner */
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
      max-width: 900px;
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

    /* Buttons */
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

    .btn-danger:hover { opacity: 0.9; }

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
      max-width: 480px;
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
      margin: 0 0 8px;
      line-height: 1.6;
    }

    .modal-note {
      font-size: 0.8125rem;
      color: #6B7280;
      margin: 0 0 24px;
    }

    .modal-actions {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
    }

    @media (max-width: 768px) {
      .page-wrapper { padding: 16px; }
      .details-grid { grid-template-columns: 1fr; gap: 0; }
      .card-header { flex-direction: column; }
      .detail-card { padding: 20px; }
    }
  `]
})
export class RequestDetailComponent implements OnInit {
  request: LeaveRequest | null = null;
  loading = false;
  error = '';
  cancelling = false;
  showConfirm = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private leaveService: LeaveService
  ) {}

  ngOnInit(): void {
    this.loadRequest();
  }

  loadRequest(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!id) {
      this.error = 'Invalid request ID.';
      return;
    }
    this.loading = true;
    this.error = '';
    this.leaveService.getLeaveRequest(id).subscribe({
      next: (req) => {
        this.request = req;
        this.loading = false;
      },
      error: () => {
        this.error = 'Failed to load leave request. Please try again.';
        this.loading = false;
      }
    });
  }

  isCancellable(req: LeaveRequest): boolean {
    if (req.status !== 'PENDING') return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const start = new Date(req.startDate);
    return start > today;
  }

  cancelRequest(): void {
    this.showConfirm = true;
  }

  confirmCancel(): void {
    if (!this.request) return;
    this.showConfirm = false;
    this.cancelling = true;

    this.leaveService.cancelLeaveRequest(this.request.id).subscribe({
      next: () => {
        this.cancelling = false;
        this.router.navigate(['/leave']);
      },
      error: () => {
        this.cancelling = false;
        this.error = 'Failed to cancel the request. Please try again.';
      }
    });
  }

  formatDurationType(type: string): string {
    switch (type) {
      case 'FULL_DAY': return 'Full Day';
      case 'HALF_DAY': return 'Half Day';
      case 'HOURLY': return 'Hourly';
      default: return type;
    }
  }
}
