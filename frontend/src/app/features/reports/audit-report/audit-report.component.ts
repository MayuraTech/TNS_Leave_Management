import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { ReportService } from '../../../core/services/report.service';
import { AuditLogEntry, AuditFilters, PagedResponse } from '../../../core/models/report.model';

interface UserOption {
  id: number;
  username: string;
  firstName: string;
  lastName: string;
}

const ACTION_TYPES = [
  'LEAVE_SUBMITTED',
  'LEAVE_APPROVED',
  'LEAVE_DENIED',
  'LEAVE_CANCELLED',
  'BALANCE_ADJUSTED',
  'USER_CREATED',
  'USER_UPDATED',
  'USER_DEACTIVATED',
  'USER_REACTIVATED',
  'PASSWORD_RESET',
  'ROLE_ASSIGNED',
  'ROLE_REVOKED'
];

@Component({
  selector: 'app-audit-report',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="report-page">
      <!-- Page Header -->
      <div class="page-header">
        <div class="page-header__text">
          <h1 class="page-title">Audit Trail</h1>
          <p class="page-subtitle">Search and review all system activity by employee, date range, and action type</p>
        </div>
      </div>

      <!-- Filter Card -->
      <div class="card filters-card">
        <h2 class="card__title">Filters</h2>
        <form [formGroup]="filterForm" (ngSubmit)="applyFilters()" class="filters-grid">

          <div class="form-group">
            <label for="userId" class="form-label">Employee</label>
            <select id="userId" formControlName="userId" class="form-input">
              <option value="">All Employees</option>
              <option *ngFor="let user of users" [value]="user.id">
                {{ user.firstName }} {{ user.lastName }} ({{ user.username }})
              </option>
            </select>
          </div>

          <div class="form-group">
            <label for="actionType" class="form-label">Action Type</label>
            <select id="actionType" formControlName="actionType" class="form-input">
              <option value="">All Actions</option>
              <option *ngFor="let action of actionTypes" [value]="action">{{ formatActionType(action) }}</option>
            </select>
          </div>

          <div class="form-group">
            <label for="startDate" class="form-label">From Date</label>
            <input
              id="startDate"
              type="date"
              formControlName="startDate"
              class="form-input"
            />
          </div>

          <div class="form-group">
            <label for="endDate" class="form-label">To Date</label>
            <input
              id="endDate"
              type="date"
              formControlName="endDate"
              class="form-input"
            />
          </div>

          <div class="filters-actions">
            <button type="submit" class="btn btn--accent" [disabled]="isLoading">
              {{ isLoading ? 'Loading…' : 'Apply Filters' }}
            </button>
            <button type="button" class="btn btn--secondary" (click)="resetFilters()">
              Reset
            </button>
          </div>
        </form>
      </div>

      <!-- Error Banner -->
      <div *ngIf="errorMessage" class="alert alert--error" role="alert">
        <svg class="alert__icon" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
          <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/>
        </svg>
        {{ errorMessage }}
      </div>

      <!-- Results Card -->
      <div class="card table-card">
        <div class="table-header">
          <span class="table-count" *ngIf="!isLoading">
            {{ totalElements }} record{{ totalElements !== 1 ? 's' : '' }} found
          </span>
          <span class="table-count" *ngIf="isLoading">Loading…</span>
        </div>

        <!-- Loading Skeleton -->
        <div *ngIf="isLoading" class="skeleton-wrapper" aria-busy="true" aria-label="Loading audit data">
          <div class="skeleton-row" *ngFor="let i of [1,2,3,4,5]"></div>
        </div>

        <!-- Empty State -->
        <div *ngIf="!isLoading && auditLogs.length === 0 && !errorMessage" class="empty-state">
          <svg class="empty-state__icon" viewBox="0 0 48 48" fill="none" aria-hidden="true">
            <rect width="48" height="48" rx="12" fill="#E8F2FC"/>
            <path d="M14 12h20v24H14z" stroke="#1E4D8C" stroke-width="2" stroke-linejoin="round"/>
            <path d="M18 18h12M18 23h12M18 28h8" stroke="#F59E0B" stroke-width="2" stroke-linecap="round"/>
          </svg>
          <p class="empty-state__title">No audit records found</p>
          <p class="empty-state__subtitle">Adjust the filters above and apply to see results.</p>
        </div>

        <!-- Data Table -->
        <div *ngIf="!isLoading && auditLogs.length > 0" class="table-wrapper">
          <table class="data-table" aria-label="Audit trail results">
            <thead>
              <tr>
                <th scope="col">Timestamp</th>
                <th scope="col">Performed By</th>
                <th scope="col">Action</th>
                <th scope="col">Entity Type</th>
                <th scope="col" class="text-right">Entity ID</th>
                <th scope="col">Details</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let log of auditLogs; let odd = odd" [class.row--odd]="odd">
                <td class="cell--timestamp">{{ formatDate(log.performedAt) }}</td>
                <td class="cell--name">
                  <span *ngIf="log.performedBy">
                    {{ log.performedBy.firstName }} {{ log.performedBy.lastName }}
                    <span class="cell--username">({{ log.performedBy.username }})</span>
                  </span>
                  <span *ngIf="!log.performedBy" class="cell--system">System</span>
                </td>
                <td>
                  <span class="badge" [ngClass]="getActionBadgeClass(log.actionType)">
                    {{ formatActionType(log.actionType) }}
                  </span>
                </td>
                <td>
                  <span class="badge badge--entity">{{ log.entityType }}</span>
                </td>
                <td class="text-right cell--id">{{ log.entityId }}</td>
                <td class="cell--details">
                  <button
                    *ngIf="log.oldValue || log.newValue"
                    class="btn-link"
                    (click)="toggleDetails(log.id)"
                    [attr.aria-expanded]="expandedRows.has(log.id)"
                    [attr.aria-label]="'Toggle details for audit entry ' + log.id"
                  >
                    {{ expandedRows.has(log.id) ? 'Hide' : 'View' }}
                  </button>
                  <span *ngIf="!log.oldValue && !log.newValue" class="cell--no-details">—</span>
                </td>
              </tr>
              <!-- Expanded detail row -->
              <ng-container *ngFor="let log of auditLogs">
                <tr *ngIf="expandedRows.has(log.id)" class="detail-row">
                  <td colspan="6">
                    <div class="detail-panel">
                      <div *ngIf="log.oldValue" class="detail-section">
                        <span class="detail-label">Before:</span>
                        <pre class="detail-value">{{ formatJson(log.oldValue) }}</pre>
                      </div>
                      <div *ngIf="log.newValue" class="detail-section">
                        <span class="detail-label">After:</span>
                        <pre class="detail-value">{{ formatJson(log.newValue) }}</pre>
                      </div>
                    </div>
                  </td>
                </tr>
              </ng-container>
            </tbody>
          </table>
        </div>

        <!-- Pagination -->
        <div *ngIf="!isLoading && totalPages > 1" class="pagination" role="navigation" aria-label="Audit log pagination">
          <button
            class="btn btn--secondary btn--sm"
            (click)="goToPage(currentPage - 1)"
            [disabled]="currentPage === 0"
            aria-label="Previous page"
          >
            ← Prev
          </button>

          <span class="pagination__info">
            Page {{ currentPage + 1 }} of {{ totalPages }}
          </span>

          <button
            class="btn btn--secondary btn--sm"
            (click)="goToPage(currentPage + 1)"
            [disabled]="currentPage >= totalPages - 1"
            aria-label="Next page"
          >
            Next →
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .report-page {
      padding: 1.5rem 2rem;
      max-width: 1400px;
      margin: 0 auto;
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    /* Page Header */
    .page-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 1rem;
      flex-wrap: wrap;
    }

    .page-title {
      font-size: 1.5rem;
      font-weight: 700;
      color: #0F2240;
      margin: 0 0 0.25rem;
      letter-spacing: -0.02em;
    }

    .page-subtitle {
      font-size: 0.875rem;
      color: #6B7280;
      margin: 0;
    }

    /* Cards */
    .card {
      background: #fff;
      border-radius: 12px;
      box-shadow: 0 4px 12px rgba(10, 22, 40, 0.08);
      overflow: hidden;
    }

    .card__title {
      font-size: 0.875rem;
      font-weight: 600;
      color: #374151;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin: 0 0 1rem;
    }

    .filters-card {
      padding: 1.5rem;
      border-left: 3px solid #F59E0B;
    }

    /* Filters */
    .filters-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 1rem;
      align-items: end;
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 0.375rem;
    }

    .form-label {
      font-size: 0.8125rem;
      font-weight: 500;
      color: #374151;
    }

    .form-input {
      padding: 0.5rem 0.75rem;
      border: 1px solid #D1D5DB;
      border-radius: 8px;
      font-size: 0.875rem;
      color: #111827;
      background: #fff;
      outline: none;
      transition: border-color 150ms ease, box-shadow 150ms ease;
    }

    .form-input:focus {
      border-color: #F59E0B;
      box-shadow: 0 0 0 3px rgba(245, 158, 11, 0.15);
    }

    .filters-actions {
      display: flex;
      gap: 0.5rem;
      align-items: flex-end;
    }

    /* Buttons */
    .btn {
      display: inline-flex;
      align-items: center;
      gap: 0.375rem;
      padding: 0.5rem 1.25rem;
      border-radius: 8px;
      font-size: 0.875rem;
      font-weight: 600;
      cursor: pointer;
      border: none;
      transition: background 200ms ease, transform 150ms ease, box-shadow 200ms ease;
      white-space: nowrap;
    }

    .btn:disabled {
      opacity: 0.55;
      cursor: not-allowed;
    }

    .btn:not(:disabled):active {
      transform: scale(0.97);
    }

    .btn--accent {
      background: #F59E0B;
      color: #0A1628;
    }

    .btn--accent:not(:disabled):hover {
      background: #D97706;
    }

    .btn--secondary {
      background: transparent;
      color: #374151;
      border: 1px solid #D1D5DB;
    }

    .btn--secondary:not(:disabled):hover {
      background: #F3F4F6;
    }

    .btn--sm {
      padding: 0.375rem 0.875rem;
      font-size: 0.8125rem;
    }

    .btn-link {
      background: none;
      border: none;
      color: #1E4D8C;
      font-size: 0.8125rem;
      font-weight: 500;
      cursor: pointer;
      padding: 0;
      text-decoration: underline;
      text-underline-offset: 2px;
    }

    .btn-link:hover {
      color: #152E54;
    }

    /* Alert */
    .alert {
      display: flex;
      align-items: center;
      gap: 0.625rem;
      padding: 0.875rem 1rem;
      border-radius: 8px;
      font-size: 0.875rem;
    }

    .alert--error {
      background: #FEE2E2;
      color: #DC2626;
      border: 1px solid #FECACA;
    }

    .alert__icon {
      width: 1.125rem;
      height: 1.125rem;
      flex-shrink: 0;
    }

    /* Table Card */
    .table-card {
      border-left: 3px solid #1E4D8C;
    }

    .table-header {
      padding: 1rem 1.5rem;
      border-bottom: 1px solid #E5E7EB;
    }

    .table-count {
      font-size: 0.8125rem;
      color: #6B7280;
      font-weight: 500;
    }

    /* Skeleton */
    .skeleton-wrapper {
      padding: 1rem 1.5rem;
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .skeleton-row {
      height: 2.5rem;
      border-radius: 6px;
      background: linear-gradient(90deg, #E5E7EB 25%, #F3F4F6 50%, #E5E7EB 75%);
      background-size: 200% 100%;
      animation: shimmer 1.4s infinite;
    }

    @keyframes shimmer {
      0% { background-position: 200% 0; }
      100% { background-position: -200% 0; }
    }

    /* Empty State */
    .empty-state {
      padding: 3rem 1.5rem;
      text-align: center;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.5rem;
    }

    .empty-state__icon {
      width: 3rem;
      height: 3rem;
      margin-bottom: 0.5rem;
    }

    .empty-state__title {
      font-size: 1rem;
      font-weight: 600;
      color: #374151;
      margin: 0;
    }

    .empty-state__subtitle {
      font-size: 0.875rem;
      color: #9CA3AF;
      margin: 0;
    }

    /* Data Table */
    .table-wrapper {
      overflow-x: auto;
    }

    .data-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.875rem;
    }

    .data-table thead tr {
      background: #0F2240;
    }

    .data-table thead th {
      padding: 0.875rem 1.25rem;
      text-align: left;
      font-size: 0.75rem;
      font-weight: 600;
      color: #fff;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      white-space: nowrap;
    }

    .data-table thead th.text-right {
      text-align: right;
    }

    .data-table tbody tr {
      border-bottom: 1px solid #E5E7EB;
      transition: background 150ms ease;
    }

    .data-table tbody tr:hover {
      background: #FEF3C7;
    }

    .data-table tbody tr.row--odd {
      background: #F9FAFB;
    }

    .data-table tbody tr.row--odd:hover {
      background: #FEF3C7;
    }

    .data-table tbody td {
      padding: 0.875rem 1.25rem;
      color: #374151;
      vertical-align: middle;
    }

    .data-table .text-right {
      text-align: right;
    }

    .cell--timestamp {
      font-size: 0.8125rem;
      color: #6B7280;
      white-space: nowrap;
    }

    .cell--name {
      font-weight: 500;
      color: #111827;
    }

    .cell--username {
      font-weight: 400;
      color: #6B7280;
      font-size: 0.8125rem;
    }

    .cell--system {
      color: #9CA3AF;
      font-style: italic;
    }

    .cell--id {
      font-family: monospace;
      color: #6B7280;
    }

    .cell--details {
      white-space: nowrap;
    }

    .cell--no-details {
      color: #D1D5DB;
    }

    /* Badges */
    .badge {
      display: inline-block;
      padding: 0.2rem 0.625rem;
      border-radius: 9999px;
      font-size: 0.75rem;
      font-weight: 500;
      white-space: nowrap;
    }

    .badge--entity {
      background: #E8F2FC;
      color: #1E4D8C;
    }

    .badge--action-leave {
      background: #D1FAE5;
      color: #065F46;
    }

    .badge--action-balance {
      background: #FEF3C7;
      color: #92400E;
    }

    .badge--action-user {
      background: #EDE9FE;
      color: #5B21B6;
    }

    .badge--action-auth {
      background: #FEE2E2;
      color: #991B1B;
    }

    .badge--action-default {
      background: #F3F4F6;
      color: #374151;
    }

    /* Detail Row */
    .detail-row td {
      padding: 0 !important;
      background: #F8FAFC !important;
    }

    .detail-panel {
      padding: 1rem 1.5rem;
      display: flex;
      gap: 2rem;
      flex-wrap: wrap;
      border-top: 1px dashed #D1D5DB;
    }

    .detail-section {
      flex: 1;
      min-width: 200px;
    }

    .detail-label {
      font-size: 0.75rem;
      font-weight: 600;
      color: #6B7280;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      display: block;
      margin-bottom: 0.375rem;
    }

    .detail-value {
      font-size: 0.8125rem;
      color: #374151;
      background: #fff;
      border: 1px solid #E5E7EB;
      border-radius: 6px;
      padding: 0.625rem 0.75rem;
      margin: 0;
      white-space: pre-wrap;
      word-break: break-word;
      max-height: 200px;
      overflow-y: auto;
    }

    /* Pagination */
    .pagination {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 1rem;
      padding: 1rem 1.5rem;
      border-top: 1px solid #E5E7EB;
    }

    .pagination__info {
      font-size: 0.875rem;
      color: #6B7280;
      font-weight: 500;
    }

    @media (max-width: 768px) {
      .report-page {
        padding: 1rem;
      }

      .filters-grid {
        grid-template-columns: 1fr;
      }

      .filters-actions {
        flex-direction: column;
      }

      .btn {
        width: 100%;
        justify-content: center;
      }

      .detail-panel {
        flex-direction: column;
        gap: 1rem;
      }
    }
  `]
})
export class AuditReportComponent implements OnInit {
  filterForm: FormGroup;
  auditLogs: AuditLogEntry[] = [];
  users: UserOption[] = [];
  actionTypes = ACTION_TYPES;

  isLoading = false;
  errorMessage = '';

  currentPage = 0;
  totalPages = 0;
  totalElements = 0;
  pageSize = 20;

  expandedRows = new Set<number>();

  constructor(
    private fb: FormBuilder,
    private reportService: ReportService
  ) {
    this.filterForm = this.fb.group({
      userId: [''],
      actionType: [''],
      startDate: [''],
      endDate: ['']
    });
  }

  ngOnInit(): void {
    this.loadUsers();
    this.loadAuditLogs();
  }

  loadUsers(): void {
    this.reportService.getUsers().subscribe({
      next: (users) => (this.users = users),
      error: () => { /* non-critical */ }
    });
  }

  loadAuditLogs(): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.expandedRows.clear();

    const { userId, actionType, startDate, endDate } = this.filterForm.value;
    const filters: AuditFilters = {
      userId: userId ? Number(userId) : undefined,
      actionType: actionType || undefined,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      page: this.currentPage,
      size: this.pageSize
    };

    this.reportService.getAuditLogs(filters).subscribe({
      next: (page: PagedResponse<AuditLogEntry>) => {
        this.auditLogs = page.content;
        this.totalElements = page.totalElements;
        this.totalPages = page.totalPages;
        this.isLoading = false;
      },
      error: () => {
        this.errorMessage = 'Failed to load audit data. Please try again.';
        this.isLoading = false;
      }
    });
  }

  applyFilters(): void {
    this.currentPage = 0;
    this.loadAuditLogs();
  }

  resetFilters(): void {
    this.filterForm.reset({ userId: '', actionType: '', startDate: '', endDate: '' });
    this.currentPage = 0;
    this.loadAuditLogs();
  }

  goToPage(page: number): void {
    if (page < 0 || page >= this.totalPages) return;
    this.currentPage = page;
    this.loadAuditLogs();
  }

  toggleDetails(id: number): void {
    if (this.expandedRows.has(id)) {
      this.expandedRows.delete(id);
    } else {
      this.expandedRows.add(id);
    }
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    return d.toLocaleString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  formatActionType(action: string): string {
    return action
      .split('_')
      .map(w => w.charAt(0) + w.slice(1).toLowerCase())
      .join(' ');
  }

  formatJson(value: string): string {
    try {
      return JSON.stringify(JSON.parse(value), null, 2);
    } catch {
      return value;
    }
  }

  getActionBadgeClass(actionType: string): string {
    const upper = actionType.toUpperCase();
    if (upper.startsWith('LEAVE')) return 'badge--action-leave';
    if (upper.startsWith('BALANCE')) return 'badge--action-balance';
    if (upper.startsWith('USER') || upper.startsWith('ROLE') || upper.startsWith('PASSWORD')) {
      return 'badge--action-user';
    }
    return 'badge--action-default';
  }
}
