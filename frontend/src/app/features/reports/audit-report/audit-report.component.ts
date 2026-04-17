import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { AuditService, AuditFilters, PagedResponse, AuditLogEntry } from '../../../core/services/audit.service';
import { UserService } from '../../../core/services/user.service';
import { SidebarService } from '../../../core/services/sidebar.service';

interface UserOption {
  id: number;
  username: string;
  firstName: string;
  lastName: string;
}

const ACTION_TYPES = [
  'SUBMITTED', 'APPROVED', 'DENIED', 'CANCELLED', 'ADJUSTED',
  'CREATED', 'UPDATED', 'DEACTIVATED', 'REACTIVATED',
  'PASSWORD_RESET', 'ROLE_ASSIGNED', 'ROLE_REVOKED'
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
            <input id="startDate" type="date" formControlName="startDate" class="form-input" />
          </div>
          <div class="form-group">
            <label for="endDate" class="form-label">To Date</label>
            <input id="endDate" type="date" formControlName="endDate" class="form-input" />
          </div>
          <div class="filters-actions">
            <button type="submit" class="btn btn--accent" [disabled]="isLoading">
              {{ isLoading ? 'Loading…' : 'Apply Filters' }}
            </button>
            <button type="button" class="btn btn--secondary" (click)="resetFilters()">Reset</button>
          </div>
        </form>
      </div>

      <!-- Error Banner -->
      <div *ngIf="errorMessage" class="alert alert--error" role="alert">
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
        <div *ngIf="isLoading" class="skeleton-wrapper">
          <div class="skeleton-row" *ngFor="let i of [1,2,3,4,5]"></div>
        </div>

        <!-- Empty State -->
        <div *ngIf="!isLoading && auditLogs.length === 0 && !errorMessage" class="empty-state">
          <p class="empty-state__title">No audit records found</p>
          <p class="empty-state__subtitle">Adjust the filters above and apply to see results.</p>
        </div>

        <!-- Data Table -->
        <div *ngIf="!isLoading && auditLogs.length > 0" class="table-wrapper">
          <table class="data-table" aria-label="Audit trail results">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Performed By</th>
                <th>Action</th>
                <th>Entity Type</th>
                <th class="text-right">Entity ID</th>
                <th>Details</th>
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
                <td><span class="badge badge--entity">{{ log.entityType }}</span></td>
                <td class="text-right cell--id">{{ log.entityId }}</td>
                <td class="cell--details">
                  <button
                    *ngIf="log.oldValue || log.newValue"
                    class="btn-view"
                    (click)="openModal(log)"
                  >
                    👁 View
                  </button>
                  <span *ngIf="!log.oldValue && !log.newValue" class="cell--no-details">—</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Pagination -->
        <div *ngIf="!isLoading && totalPages > 1" class="pagination">
          <button class="btn btn--secondary btn--sm" (click)="goToPage(currentPage - 1)" [disabled]="currentPage === 0">← Prev</button>
          <span class="pagination__info">Page {{ currentPage + 1 }} of {{ totalPages }}</span>
          <button class="btn btn--secondary btn--sm" (click)="goToPage(currentPage + 1)" [disabled]="currentPage >= totalPages - 1">Next →</button>
        </div>
      </div>
    </div>

    <!-- JSON Modal -->
    <div class="modal-backdrop" *ngIf="modalLog" (click)="closeModal()" role="dialog" aria-modal="true">
      <div class="modal" (click)="$event.stopPropagation()">

        <!-- Modal Header -->
        <div class="modal-header">
          <div class="modal-meta">
            <span class="modal-title">Audit Log #{{ modalLog.id }}</span>
            <span class="badge" [ngClass]="getActionBadgeClass(modalLog.actionType)">
              {{ formatActionType(modalLog.actionType) }}
            </span>
            <span class="badge badge--entity">{{ modalLog.entityType }}</span>
          </div>
          <button class="modal-close" (click)="closeModal()" aria-label="Close">✕</button>
        </div>

        <!-- Code Box -->
        <div class="code-box">
          <div class="code-box-header">
            <span class="code-box-label">JSON</span>
            <button class="copy-btn" (click)="copyJson()" [class.copied]="copied">
              {{ copied ? '✓ Copied!' : '⎘ Copy' }}
            </button>
          </div>
          <pre class="code-content"><code [innerHTML]="highlightedJson"></code></pre>
        </div>

      </div>
    </div>
  `,
  styles: [`
    .report-page { padding: 1.5rem 2rem; max-width: 1400px; margin: 0 auto; display: flex; flex-direction: column; gap: 1.5rem; }

    .page-title { font-size: 1.5rem; font-weight: 700; color: #0F2240; margin: 0 0 0.25rem; letter-spacing: -0.02em; }
    .page-subtitle { font-size: 0.875rem; color: #6B7280; margin: 0; }

    .card { background: #fff; border-radius: 12px; box-shadow: 0 4px 12px rgba(10,22,40,0.08); overflow: hidden; }
    .card__title { font-size: 0.875rem; font-weight: 600; color: #374151; text-transform: uppercase; letter-spacing: 0.05em; margin: 0 0 1rem; }
    .filters-card { padding: 1.5rem; border-left: 3px solid #F59E0B; }
    .table-card { border-left: 3px solid #1E4D8C; }

    .filters-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 1rem; align-items: end; }
    .form-group { display: flex; flex-direction: column; gap: 0.375rem; }
    .form-label { font-size: 0.8125rem; font-weight: 500; color: #374151; }
    .form-input { padding: 0.5rem 0.75rem; border: 1px solid #D1D5DB; border-radius: 8px; font-size: 0.875rem; color: #111827; background: #fff; outline: none; transition: border-color 150ms, box-shadow 150ms; }
    .form-input:focus { border-color: #F59E0B; box-shadow: 0 0 0 3px rgba(245,158,11,0.15); }
    .filters-actions { display: flex; gap: 0.5rem; align-items: flex-end; }

    .btn { display: inline-flex; align-items: center; gap: 0.375rem; padding: 0.5rem 1.25rem; border-radius: 8px; font-size: 0.875rem; font-weight: 600; cursor: pointer; border: none; transition: all 200ms ease; white-space: nowrap; }
    .btn:disabled { opacity: 0.55; cursor: not-allowed; }
    .btn:not(:disabled):active { transform: scale(0.97); }
    .btn--accent { background: #F59E0B; color: #0A1628; }
    .btn--accent:not(:disabled):hover { background: #D97706; }
    .btn--secondary { background: transparent; color: #374151; border: 1px solid #D1D5DB; }
    .btn--secondary:not(:disabled):hover { background: #F3F4F6; }
    .btn--sm { padding: 0.375rem 0.875rem; font-size: 0.8125rem; }

    .btn-view { display: inline-flex; align-items: center; gap: 4px; padding: 4px 10px; border-radius: 6px; font-size: 0.78rem; font-weight: 600; cursor: pointer; border: 1px solid rgba(30,77,140,0.3); background: #E8F2FC; color: #1E4D8C; transition: all 150ms ease; white-space: nowrap; }
    .btn-view:hover { background: #b3d9ff; border-color: rgba(30,77,140,0.5); transform: translateY(-1px); }
    .btn-view:active { transform: scale(0.97); }

    .alert { padding: 0.875rem 1rem; border-radius: 8px; font-size: 0.875rem; background: #FEE2E2; color: #DC2626; border: 1px solid #FECACA; }

    .table-header { padding: 1rem 1.5rem; border-bottom: 1px solid #E5E7EB; }
    .table-count { font-size: 0.8125rem; color: #6B7280; font-weight: 500; }

    .skeleton-wrapper { padding: 1rem 1.5rem; display: flex; flex-direction: column; gap: 0.75rem; }
    .skeleton-row { height: 2.5rem; border-radius: 6px; background: linear-gradient(90deg, #E5E7EB 25%, #F3F4F6 50%, #E5E7EB 75%); background-size: 200% 100%; animation: shimmer 1.4s infinite; }
    @keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }

    .empty-state { padding: 3rem 1.5rem; text-align: center; }
    .empty-state__title { font-size: 1rem; font-weight: 600; color: #374151; margin: 0 0 0.25rem; }
    .empty-state__subtitle { font-size: 0.875rem; color: #9CA3AF; margin: 0; }

    .table-wrapper { overflow-x: auto; }
    .data-table { width: 100%; border-collapse: collapse; font-size: 0.875rem; }
    .data-table thead tr { background: #0F2240; }
    .data-table thead th { padding: 0.875rem 1.25rem; text-align: left; font-size: 0.75rem; font-weight: 600; color: #fff; text-transform: uppercase; letter-spacing: 0.05em; white-space: nowrap; }
    .data-table thead th.text-right { text-align: right; }
    .data-table tbody tr { border-bottom: 1px solid #E5E7EB; transition: background 150ms; }
    .data-table tbody tr:hover { background: #FEF3C7; }
    .data-table tbody tr.row--odd { background: #F9FAFB; }
    .data-table tbody tr.row--odd:hover { background: #FEF3C7; }
    .data-table tbody td { padding: 0.875rem 1.25rem; color: #374151; vertical-align: middle; }
    .data-table .text-right { text-align: right; }

    .cell--timestamp { font-size: 0.8125rem; color: #6B7280; white-space: nowrap; }
    .cell--name { font-weight: 500; color: #111827; }
    .cell--username { font-weight: 400; color: #6B7280; font-size: 0.8125rem; }
    .cell--system { color: #9CA3AF; font-style: italic; }
    .cell--id { font-family: monospace; color: #6B7280; }
    .cell--details { white-space: nowrap; }
    .cell--no-details { color: #D1D5DB; }

    .badge { display: inline-block; padding: 0.2rem 0.625rem; border-radius: 9999px; font-size: 0.75rem; font-weight: 500; white-space: nowrap; }
    .badge--entity { background: #E8F2FC; color: #1E4D8C; }
    .badge--action-leave { background: #D1FAE5; color: #065F46; }
    .badge--action-balance { background: #FEF3C7; color: #92400E; }
    .badge--action-user { background: #EDE9FE; color: #5B21B6; }
    .badge--action-auth { background: #FEE2E2; color: #991B1B; }
    .badge--action-default { background: #F3F4F6; color: #374151; }

    .pagination { display: flex; align-items: center; justify-content: center; gap: 1rem; padding: 1rem 1.5rem; border-top: 1px solid #E5E7EB; }
    .pagination__info { font-size: 0.875rem; color: #6B7280; font-weight: 500; }

    /* ---- Modal ---- */
    .modal-backdrop {
      position: fixed;
      top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(10, 18, 40, 0.75);
      backdrop-filter: blur(4px);
      z-index: 9999;
      display: flex;
      align-items: center;
      justify-content: center;
      animation: fadeIn 150ms ease;
    }

    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

    .modal {
      background: #1a1a2e; border-radius: 14px;
      width: calc(100vw - 3rem);
      max-width: 780px;
      max-height: 85vh;
      display: flex; flex-direction: column;
      box-shadow: 0 24px 64px rgba(0,0,0,0.6);
      border: 1px solid rgba(78,146,248,0.15);
      animation: slideUp 200ms cubic-bezier(0.34,1.56,0.64,1);
      overflow: hidden;
      position: relative;
    }

    @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }

    .modal-header {
      display: flex; align-items: center; justify-content: space-between;
      padding: 1rem 1.25rem;
      border-bottom: 1px solid rgba(255,255,255,0.08);
      background: rgba(255,255,255,0.03);
      flex-shrink: 0;
    }

    .modal-meta { display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap; }
    .modal-title { font-size: 0.9rem; font-weight: 600; color: #e2e8f0; }

    .modal-close {
      background: rgba(255,255,255,0.08); border: none; color: #94a3b8;
      width: 28px; height: 28px; border-radius: 6px; cursor: pointer;
      font-size: 0.8rem; display: flex; align-items: center; justify-content: center;
      transition: all 150ms ease; flex-shrink: 0;
    }
    .modal-close:hover { background: rgba(255,255,255,0.15); color: #fff; }

    /* ---- Code Box ---- */
    .code-box { display: flex; flex-direction: column; flex: 1; overflow: hidden; margin: 0; }

    .code-box-header {
      display: flex; align-items: center; justify-content: space-between;
      padding: 0.5rem 1rem;
      background: #111827;
      border-bottom: 1px solid rgba(255,255,255,0.06);
      flex-shrink: 0;
    }

    .code-box-label { font-size: 0.75rem; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; }

    .copy-btn {
      display: inline-flex; align-items: center; gap: 5px;
      padding: 4px 12px; border-radius: 6px; font-size: 0.75rem; font-weight: 600;
      cursor: pointer; border: 1px solid rgba(78,146,248,0.3);
      background: rgba(78,146,248,0.1); color: #4E92F8;
      transition: all 150ms ease;
    }
    .copy-btn:hover { background: rgba(78,146,248,0.2); border-color: rgba(78,146,248,0.5); }
    .copy-btn.copied { background: rgba(169,208,142,0.15); border-color: rgba(169,208,142,0.4); color: #A9D08E; }

    .code-content {
      flex: 1; overflow-y: auto; margin: 0;
      padding: 1.25rem 1.5rem;
      background: #0d1117;
      font-family: 'JetBrains Mono', 'Fira Code', monospace;
      font-size: 0.8rem; line-height: 1.7;
      color: #e2e8f0;
      white-space: pre;
      overflow-x: auto;
      max-height: calc(85vh - 160px);
    }

    /* JSON syntax highlighting */
    .code-content :global(.json-key)    { color: #79c0ff; }
    .code-content :global(.json-string) { color: #a5d6ff; }
    .code-content :global(.json-number) { color: #f2cc60; }
    .code-content :global(.json-bool)   { color: #ff7b72; }
    .code-content :global(.json-null)   { color: #8b949e; }

    @media (max-width: 768px) {
      .report-page { padding: 1rem; }
      .filters-grid { grid-template-columns: 1fr; }
      .modal { max-height: 95vh; }
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

  modalLog: AuditLogEntry | null = null;
  activeTab: 'before' | 'after' | 'full' = 'full';
  copied = false;
  highlightedJson = '';

  constructor(
    private fb: FormBuilder,
    private auditService: AuditService,
    private userService: UserService,
    private sidebarService: SidebarService
  ) {
    this.filterForm = this.fb.group({
      userId: [''], actionType: [''], startDate: [''], endDate: ['']
    });
  }

  ngOnInit(): void {
    this.loadUsers();
    this.loadAuditLogs();
  }

  @HostListener('document:keydown.escape')
  closeModal(): void {
    this.modalLog = null;
    this.copied = false;
  }

  openModal(log: AuditLogEntry): void {
    this.sidebarService.setOpen(false);
    this.modalLog = log;
    this.copied = false;
    this.activeTab = 'full';
    this.updateHighlightedJson();
  }

  get activeTabJson(): string {
    if (!this.modalLog) return '';
    if (this.activeTab === 'before') return this.formatJson(this.modalLog.oldValue ?? '');
    if (this.activeTab === 'after') return this.formatJson(this.modalLog.newValue ?? '');
    // Full record
    const full: Record<string, unknown> = {
      id: this.modalLog.id,
      entityType: this.modalLog.entityType,
      entityId: this.modalLog.entityId,
      actionType: this.modalLog.actionType,
      performedAt: this.modalLog.performedAt,
      performedBy: this.modalLog.performedBy,
    };
    if (this.modalLog.oldValue) {
      try { full['before'] = JSON.parse(this.modalLog.oldValue); } catch { full['before'] = this.modalLog.oldValue; }
    }
    if (this.modalLog.newValue) {
      try { full['after'] = JSON.parse(this.modalLog.newValue); } catch { full['after'] = this.modalLog.newValue; }
    }
    return JSON.stringify(full, null, 2);
  }

  updateHighlightedJson(): void {
    this.highlightedJson = this.syntaxHighlight(this.activeTabJson);
  }

  // Called when tab changes
  setTab(tab: 'before' | 'after' | 'full'): void {
    this.activeTab = tab;
    this.updateHighlightedJson();
    this.copied = false;
  }

  copyJson(): void {
    navigator.clipboard.writeText(this.activeTabJson).then(() => {
      this.copied = true;
      setTimeout(() => { this.copied = false; }, 2000);
    });
  }

  syntaxHighlight(json: string): string {
    return json
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(
        /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g,
        (match) => {
          let cls = 'json-number';
          if (/^"/.test(match)) {
            cls = /:$/.test(match) ? 'json-key' : 'json-string';
          } else if (/true|false/.test(match)) {
            cls = 'json-bool';
          } else if (/null/.test(match)) {
            cls = 'json-null';
          }
          return `<span class="${cls}">${match}</span>`;
        }
      );
  }

  loadUsers(): void {
    this.userService.getUsers({ size: 1000 }).subscribe({
      next: (response) => {
        this.users = response.content.map(u => ({
          id: u.id, username: u.username,
          firstName: u.firstName, lastName: u.lastName
        }));
      },
      error: () => {}
    });
  }

  loadAuditLogs(): void {
    this.isLoading = true;
    this.errorMessage = '';
    const { userId, actionType, startDate, endDate } = this.filterForm.value;
    const filters: AuditFilters = {
      userId: userId ? Number(userId) : undefined,
      actionType: actionType || undefined,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      page: this.currentPage,
      size: this.pageSize
    };
    this.auditService.getAuditLogs(filters).subscribe({
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

  applyFilters(): void { this.currentPage = 0; this.loadAuditLogs(); }
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

  formatDate(dateStr: string): string {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleString('en-GB', {
      day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  }

  formatActionType(action: string): string {
    return action.split('_').map(w => w.charAt(0) + w.slice(1).toLowerCase()).join(' ');
  }

  formatJson(value: string): string {
    try { return JSON.stringify(JSON.parse(value), null, 2); } catch { return value; }
  }

  getActionBadgeClass(actionType: string): string {
    const u = actionType.toUpperCase();
    if (u.startsWith('LEAVE')) return 'badge--action-leave';
    if (u.startsWith('BALANCE')) return 'badge--action-balance';
    if (u.startsWith('USER') || u.startsWith('ROLE') || u.startsWith('PASSWORD')) return 'badge--action-user';
    return 'badge--action-default';
  }
}
