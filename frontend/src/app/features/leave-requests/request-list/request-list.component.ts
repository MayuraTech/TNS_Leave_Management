import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { LeaveService } from '../../../core/services/leave.service';
import { LeaveRequest, LeaveRequestStatus } from '../../../core/models/leave-request.model';

@Component({
  selector: 'app-request-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <div class="page-wrapper">
      <div class="page-header">
        <div class="header-left">
          <h1 class="page-title">My Leave Requests</h1>
          <p class="page-subtitle">View and manage your leave history</p>
        </div>
        <a routerLink="/leave/new" class="btn-primary">+ New Request</a>
      </div>

      <!-- Filter bar -->
      <div class="filter-bar">
        <label class="filter-label">Filter by status:</label>
        <div class="filter-pills">
          <button class="pill" [class.active]="activeFilter === null" (click)="setFilter(null)">All</button>
          <button class="pill pending" [class.active]="activeFilter === 'PENDING'" (click)="setFilter('PENDING')">Pending</button>
          <button class="pill approved" [class.active]="activeFilter === 'APPROVED'" (click)="setFilter('APPROVED')">Approved</button>
          <button class="pill denied" [class.active]="activeFilter === 'DENIED'" (click)="setFilter('DENIED')">Denied</button>
          <button class="pill cancelled" [class.active]="activeFilter === 'CANCELLED'" (click)="setFilter('CANCELLED')">Cancelled</button>
        </div>
      </div>

      <!-- Loading -->
      <div class="loading-state" *ngIf="loading">
        <div class="skeleton-row" *ngFor="let i of [1,2,3,4]"></div>
      </div>

      <!-- Error -->
      <div class="error-banner" *ngIf="error && !loading">
        {{ error }}
        <button class="retry-btn" (click)="loadRequests()">Retry</button>
      </div>

      <!-- Empty state -->
      <div class="empty-state" *ngIf="!loading && !error && filteredRequests.length === 0">
        <div class="empty-icon">📋</div>
        <p class="empty-title">No leave requests found</p>
        <p class="empty-sub" *ngIf="activeFilter">Try clearing the filter or submit a new request.</p>
        <p class="empty-sub" *ngIf="!activeFilter">You haven't submitted any leave requests yet.</p>
        <a routerLink="/leave/new" class="btn-primary" style="margin-top:16px">Submit a Request</a>
      </div>

      <!-- Table -->
      <div class="table-card" *ngIf="!loading && !error && filteredRequests.length > 0">
        <table class="data-table">
          <thead>
            <tr>
              <th>Leave Type</th>
              <th>Dates</th>
              <th>Duration</th>
              <th>Type</th>
              <th>Status</th>
              <th>Submitted</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let req of filteredRequests"
                class="table-row"
                (click)="navigateToDetail(req.id)"
                [class.clickable]="true">
              <td class="cell-leave-type">{{ req.leaveTypeName || '—' }}</td>
              <td class="cell-dates">
                <span>{{ req.startDate | date:'dd MMM yyyy' }}</span>
                <span class="date-sep" *ngIf="req.startDate !== req.endDate"> – {{ req.endDate | date:'dd MMM yyyy' }}</span>
              </td>
              <td class="cell-duration">
                <span *ngIf="req.durationType === 'FULL_DAY'">{{ req.totalDays }} day{{ req.totalDays !== 1 ? 's' : '' }}</span>
                <span *ngIf="req.durationType === 'HALF_DAY'">Half day</span>
                <span *ngIf="req.durationType === 'HOURLY'">{{ req.durationInHours }} hr{{ req.durationInHours !== 1 ? 's' : '' }}</span>
              </td>
              <td class="cell-type">
                <span class="type-badge" [class]="'type-' + req.durationType.toLowerCase()">
                  {{ formatDurationType(req.durationType) }}
                </span>
              </td>
              <td class="cell-status">
                <span class="status-badge" [class]="'status-' + req.status.toLowerCase()">
                  {{ req.status }}
                </span>
              </td>
              <td class="cell-submitted">{{ req.submittedAt | date:'dd MMM yyyy' }}</td>
              <td class="cell-actions" (click)="$event.stopPropagation()">
                <button
                  *ngIf="isCancellable(req)"
                  class="btn-cancel"
                  [disabled]="cancellingId === req.id"
                  (click)="cancelRequest(req)">
                  {{ cancellingId === req.id ? 'Cancelling…' : 'Cancel' }}
                </button>
                <span *ngIf="!isCancellable(req)" class="no-action">—</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Cancel confirm modal -->
      <div class="modal-overlay" *ngIf="confirmRequest" (click)="confirmRequest = null">
        <div class="modal-card" (click)="$event.stopPropagation()">
          <h3 class="modal-title">Cancel Leave Request</h3>
          <p class="modal-body">
            Are you sure you want to cancel your <strong>{{ confirmRequest.leaveTypeName }}</strong> request
            from <strong>{{ confirmRequest.startDate | date:'dd MMM yyyy' }}</strong>
            <ng-container *ngIf="confirmRequest.startDate !== confirmRequest.endDate">
              to <strong>{{ confirmRequest.endDate | date:'dd MMM yyyy' }}</strong>
            </ng-container>?
          </p>
          <p class="modal-note">Your leave balance will be restored.</p>
          <div class="modal-actions">
            <button class="btn-secondary" (click)="confirmRequest = null">Keep Request</button>
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

    /* Filter bar */
    .filter-bar {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 20px;
      flex-wrap: wrap;
    }

    .filter-label {
      font-size: 0.875rem;
      font-weight: 600;
      color: #374151;
    }

    .filter-pills {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
    }

    .pill {
      padding: 6px 14px;
      border-radius: 20px;
      border: 1px solid #D1D5DB;
      background: #fff;
      font-size: 0.8125rem;
      font-weight: 500;
      color: #374151;
      cursor: pointer;
      transition: all 0.15s;
    }

    .pill:hover { border-color: #F59E0B; }
    .pill.active { background: #0A1628; color: #fff; border-color: #0A1628; }
    .pill.pending.active { background: #D97706; border-color: #D97706; }
    .pill.approved.active { background: #059669; border-color: #059669; }
    .pill.denied.active { background: #DC2626; border-color: #DC2626; }
    .pill.cancelled.active { background: #6B7280; border-color: #6B7280; }

    /* Table card */
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

    .table-row.clickable { cursor: pointer; }
    .table-row:hover { background: #FEF3C7; }
    .table-row:last-child { border-bottom: none; }

    .data-table td {
      padding: 14px 16px;
      font-size: 0.875rem;
      color: #374151;
      vertical-align: middle;
    }

    .cell-leave-type { font-weight: 600; color: #0A1628; }

    .date-sep { color: #6B7280; }

    /* Status badges */
    .status-badge {
      display: inline-block;
      padding: 4px 10px;
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

    /* Type badges */
    .type-badge {
      display: inline-block;
      padding: 3px 8px;
      border-radius: 6px;
      font-size: 0.75rem;
      font-weight: 500;
      background: #EFF6FF;
      color: #1E4D8C;
    }

    /* Action buttons */
    .btn-cancel {
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

    .btn-cancel:hover:not(:disabled) { background: #FEE2E2; }
    .btn-cancel:disabled { opacity: 0.5; cursor: not-allowed; }

    .no-action { color: #9CA3AF; font-size: 0.875rem; }

    /* Primary button */
    .btn-primary {
      padding: 10px 20px;
      background: #F59E0B;
      color: #0A1628;
      border: none;
      border-radius: 8px;
      font-weight: 700;
      font-size: 0.9375rem;
      cursor: pointer;
      text-decoration: none;
      display: inline-flex;
      align-items: center;
      transition: opacity 0.15s;
      white-space: nowrap;
    }

    .btn-primary:hover { opacity: 0.9; }

    /* Secondary button */
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

    /* Danger button */
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
      .page-header { flex-direction: column; gap: 12px; }
      .data-table { font-size: 0.8125rem; }
      .data-table th, .data-table td { padding: 10px 12px; }
    }
  `]
})
export class RequestListComponent implements OnInit {
  requests: LeaveRequest[] = [];
  filteredRequests: LeaveRequest[] = [];
  activeFilter: LeaveRequestStatus | null = null;
  loading = false;
  error = '';
  cancellingId: number | null = null;
  confirmRequest: LeaveRequest | null = null;

  constructor(
    private leaveService: LeaveService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadRequests();
  }

  loadRequests(): void {
    this.loading = true;
    this.error = '';
    this.leaveService.getLeaveRequests().subscribe({
      next: (reqs) => {
        this.requests = reqs.sort(
          (a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
        );
        this.applyFilter();
        this.loading = false;
      },
      error: () => {
        this.error = 'Failed to load leave requests. Please try again.';
        this.loading = false;
      }
    });
  }

  setFilter(status: LeaveRequestStatus | null): void {
    this.activeFilter = status;
    this.applyFilter();
  }

  private applyFilter(): void {
    this.filteredRequests = this.activeFilter
      ? this.requests.filter(r => r.status === this.activeFilter)
      : [...this.requests];
  }

  isCancellable(req: LeaveRequest): boolean {
    if (req.status !== 'PENDING') return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const start = new Date(req.startDate);
    return start > today;
  }

  cancelRequest(req: LeaveRequest): void {
    this.confirmRequest = req;
  }

  confirmCancel(): void {
    if (!this.confirmRequest) return;
    const req = this.confirmRequest;
    this.confirmRequest = null;
    this.cancellingId = req.id;

    this.leaveService.cancelLeaveRequest(req.id).subscribe({
      next: () => {
        this.cancellingId = null;
        this.loadRequests();
      },
      error: () => {
        this.cancellingId = null;
        this.error = 'Failed to cancel the request. Please try again.';
      }
    });
  }

  navigateToDetail(id: number): void {
    this.router.navigate(['/leave', id]);
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
