import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { PolicyService, LeaveTypePayload } from '../../../core/services/policy.service';
import { LeaveType } from '../../../core/models/leave-balance.model';

@Component({
  selector: 'app-leave-type-management',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="page-wrapper">
      <div class="page-header">
        <div class="header-left">
          <h1 class="page-title">Leave Types</h1>
          <p class="page-subtitle">Define and manage leave types, accrual rates, and policy rules</p>
        </div>
        <button class="btn-primary" (click)="openCreate()" *ngIf="!showForm">
          + New Leave Type
        </button>
      </div>

      <!-- Inline form panel -->
      <div class="form-card" *ngIf="showForm">
        <div class="card-header">
          <h2 class="card-title">{{ editingId ? 'Edit Leave Type' : 'New Leave Type' }}</h2>
          <button class="btn-ghost" (click)="cancelForm()">✕ Cancel</button>
        </div>

        <form [formGroup]="form" (ngSubmit)="onSubmit()" novalidate>
          <div class="field-row">
            <!-- Name -->
            <div class="field-group">
              <label class="field-label" for="name">Name <span class="required">*</span></label>
              <input id="name" type="text" formControlName="name" class="field-input"
                [class.error]="isInvalid('name')" placeholder="e.g. Annual Leave" />
              <span class="error-msg" *ngIf="isInvalid('name')">Name is required.</span>
            </div>

            <!-- Accrual Rate -->
            <div class="field-group">
              <label class="field-label" for="accrualRate">
                Accrual Rate (days/month) <span class="required">*</span>
              </label>
              <input id="accrualRate" type="number" formControlName="accrualRate" class="field-input"
                [class.error]="isInvalid('accrualRate')" min="0" step="0.5" placeholder="e.g. 1.5" />
              <span class="error-msg" *ngIf="isInvalid('accrualRate')">
                Accrual rate must be 0 or greater.
              </span>
            </div>
          </div>

          <div class="field-row">
            <!-- Max Carry-Over -->
            <div class="field-group">
              <label class="field-label" for="maxCarryOverDays">
                Max Carry-Over (days) <span class="required">*</span>
              </label>
              <input id="maxCarryOverDays" type="number" formControlName="maxCarryOverDays" class="field-input"
                [class.error]="isInvalid('maxCarryOverDays')" min="0" placeholder="e.g. 10" />
              <span class="error-msg" *ngIf="isInvalid('maxCarryOverDays')">
                Max carry-over must be 0 or greater.
              </span>
            </div>

            <!-- Min Notice Days -->
            <div class="field-group">
              <label class="field-label" for="minNoticeDays">
                Min Notice Period (days) <span class="required">*</span>
              </label>
              <input id="minNoticeDays" type="number" formControlName="minNoticeDays" class="field-input"
                [class.error]="isInvalid('minNoticeDays')" min="0" placeholder="e.g. 3" />
              <span class="error-msg" *ngIf="isInvalid('minNoticeDays')">
                Min notice days must be 0 or greater.
              </span>
            </div>
          </div>

          <!-- Description -->
          <div class="field-group">
            <label class="field-label" for="description">Description</label>
            <textarea id="description" formControlName="description" class="field-input field-textarea"
              rows="3" placeholder="Optional description of this leave type"></textarea>
          </div>

          <!-- Form error -->
          <div class="error-banner" *ngIf="formError">{{ formError }}</div>

          <div class="form-actions">
            <button type="button" class="btn-secondary" (click)="cancelForm()" [disabled]="saving">
              Cancel
            </button>
            <button type="submit" class="btn-primary" [disabled]="saving || form.invalid">
              {{ saving ? 'Saving…' : (editingId ? 'Update Leave Type' : 'Create Leave Type') }}
            </button>
          </div>
        </form>
      </div>

      <!-- Loading -->
      <div class="loading-state" *ngIf="loading">
        <div class="skeleton-row" *ngFor="let i of [1,2,3]"></div>
      </div>

      <!-- Error -->
      <div class="error-banner" *ngIf="loadError && !loading">
        {{ loadError }}
        <button class="retry-btn" (click)="loadLeaveTypes()">Retry</button>
      </div>

      <!-- Empty state -->
      <div class="empty-state" *ngIf="!loading && !loadError && leaveTypes.length === 0 && !showForm">
        <div class="empty-icon">📋</div>
        <p class="empty-title">No leave types defined</p>
        <p class="empty-sub">Create your first leave type to get started.</p>
        <button class="btn-primary" style="margin-top:16px" (click)="openCreate()">
          + New Leave Type
        </button>
      </div>

      <!-- Table -->
      <div class="table-card" *ngIf="!loading && !loadError && leaveTypes.length > 0">
        <table class="data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Description</th>
              <th>Accrual Rate</th>
              <th>Max Carry-Over</th>
              <th>Min Notice</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let lt of leaveTypes" class="table-row">
              <td class="cell-name">{{ lt.name }}</td>
              <td class="cell-desc">{{ lt.description || '—' }}</td>
              <td class="cell-num">{{ lt.accrualRate }} days/mo</td>
              <td class="cell-num">{{ lt.maxCarryOverDays }} days</td>
              <td class="cell-num">{{ lt.minNoticeDays }} days</td>
              <td class="cell-status">
                <span class="status-badge" [class]="lt.isActive ? 'status-active' : 'status-inactive'">
                  {{ lt.isActive ? 'Active' : 'Inactive' }}
                </span>
              </td>
              <td class="cell-actions">
                <button class="btn-edit" (click)="openEdit(lt)">Edit</button>
                <button class="btn-toggle"
                  [class.btn-deactivate]="lt.isActive"
                  [class.btn-activate]="!lt.isActive"
                  (click)="toggleStatus(lt)">
                  {{ lt.isActive ? 'Deactivate' : 'Activate' }}
                </button>
                <button class="btn-delete" (click)="confirmDelete(lt)">Delete</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `,
  styles: [`
    .page-wrapper {
      padding: var(--space-8, 2rem);
      max-width: 1100px;
      margin: 0 auto;
    }

    .page-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      margin-bottom: var(--space-8, 2rem);
    }

    .page-title {
      font-size: var(--text-2xl, 1.5rem);
      font-weight: var(--font-bold, 700);
      color: var(--color-primary-900, #0A1628);
      margin: 0 0 4px;
    }

    .page-subtitle {
      font-size: var(--text-sm, 0.875rem);
      color: var(--color-neutral-500, #6B7280);
      margin: 0;
    }

    /* Form card */
    .form-card {
      background: var(--surface-primary, #fff);
      border-radius: 12px;
      box-shadow: var(--shadow-md, 0 4px 12px rgba(10,22,40,0.08));
      border-left: 3px solid var(--color-accent-500, #F59E0B);
      padding: var(--space-6, 1.5rem);
      margin-bottom: var(--space-8, 2rem);
    }

    .card-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: var(--space-6, 1.5rem);
    }

    .card-title {
      font-size: var(--text-xl, 1.25rem);
      font-weight: var(--font-semibold, 600);
      color: var(--color-primary-800, #0F2240);
      margin: 0;
    }

    .field-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: var(--space-6, 1.5rem);
    }

    .field-group {
      display: flex;
      flex-direction: column;
      gap: var(--space-1, 0.25rem);
      margin-bottom: var(--space-5, 1.25rem);
    }

    .field-label {
      font-size: var(--text-sm, 0.875rem);
      font-weight: var(--font-semibold, 600);
      color: var(--color-neutral-700, #374151);
    }

    .required { color: var(--color-danger, #DC2626); }

    .field-input {
      padding: 10px 12px;
      border: 1px solid var(--color-neutral-300, #D1D5DB);
      border-radius: 8px;
      font-size: var(--text-base, 1rem);
      color: var(--color-neutral-900, #111827);
      background: var(--surface-primary, #fff);
      transition: border-color 200ms ease;
      outline: none;
    }

    .field-input:focus {
      border-color: var(--color-accent-500, #F59E0B);
      box-shadow: 0 0 0 3px rgba(245,158,11,0.15);
    }

    .field-input.error {
      border-color: var(--color-danger, #DC2626);
      background: var(--color-danger-light, #FEE2E2);
    }

    .field-textarea { resize: vertical; min-height: 80px; }

    .error-msg {
      font-size: var(--text-xs, 0.75rem);
      color: var(--color-danger, #DC2626);
    }

    .form-actions {
      display: flex;
      justify-content: flex-end;
      gap: var(--space-3, 0.75rem);
      margin-top: var(--space-4, 1rem);
    }

    /* Buttons */
    .btn-primary {
      background: var(--color-accent-500, #F59E0B);
      color: #0A1628;
      border: none;
      border-radius: 8px;
      padding: 10px 24px;
      font-size: var(--text-sm, 0.875rem);
      font-weight: var(--font-bold, 700);
      letter-spacing: 0.025em;
      text-transform: uppercase;
      cursor: pointer;
      transition: transform 200ms ease, box-shadow 200ms ease;
    }

    .btn-primary:hover:not(:disabled) {
      transform: translateY(-1px);
      box-shadow: var(--shadow-md, 0 4px 12px rgba(10,22,40,0.08));
    }

    .btn-primary:active:not(:disabled) { transform: scale(0.97); }
    .btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }

    .btn-secondary {
      background: transparent;
      color: var(--color-primary-500, #1E4D8C);
      border: 1px solid var(--color-primary-500, #1E4D8C);
      border-radius: 8px;
      padding: 10px 24px;
      font-size: var(--text-sm, 0.875rem);
      font-weight: var(--font-semibold, 600);
      cursor: pointer;
      transition: background 200ms ease;
    }

    .btn-secondary:hover:not(:disabled) {
      background: var(--color-primary-50, #E8F2FC);
    }

    .btn-secondary:disabled { opacity: 0.6; cursor: not-allowed; }

    .btn-ghost {
      background: transparent;
      border: none;
      color: var(--color-neutral-500, #6B7280);
      font-size: var(--text-sm, 0.875rem);
      cursor: pointer;
      padding: 4px 8px;
      border-radius: 4px;
    }

    .btn-ghost:hover { background: var(--color-neutral-100, #F3F4F6); }

    .btn-edit {
      background: transparent;
      border: 1px solid #3f476e;
      color: #3f476e;
      border-radius: 6px;
      padding: 4px 14px;
      font-size: var(--text-sm, 0.875rem);
      font-weight: var(--font-medium, 500);
      cursor: pointer;
      transition: background 150ms ease;
    }

    .btn-edit:hover { background: rgba(63,71,110,0.08); }

    .btn-toggle {
      border-radius: 6px;
      padding: 4px 14px;
      font-size: var(--text-sm, 0.875rem);
      font-weight: var(--font-medium, 500);
      cursor: pointer;
      transition: background 150ms ease;
      border: 1px solid;
    }

    .btn-deactivate {
      background: transparent;
      border-color: #ff4d00;
      color: #ff4d00;
    }

    .btn-deactivate:hover { background: rgba(255,77,0,0.08); }

    .btn-activate {
      background: transparent;
      border-color: #A9D08E;
      color: #2c3e50;
    }

    .btn-activate:hover { background: rgba(169,208,142,0.15); }

    .btn-delete {
      background: transparent;
      border: 1px solid #ef4444;
      color: #ef4444;
      border-radius: 6px;
      padding: 4px 14px;
      font-size: var(--text-sm, 0.875rem);
      font-weight: var(--font-medium, 500);
      cursor: pointer;
      transition: background 150ms ease;
    }

    .btn-delete:hover { background: rgba(239,68,68,0.08); }

    /* Table */
    .table-card {
      background: var(--surface-primary, #fff);
      border-radius: 12px;
      box-shadow: var(--shadow-md, 0 4px 12px rgba(10,22,40,0.08));
      overflow: hidden;
    }

    .data-table {
      width: 100%;
      border-collapse: collapse;
    }

    .data-table thead tr {
      background: var(--color-primary-800, #0F2240);
    }

    .data-table th {
      padding: 12px 16px;
      text-align: left;
      font-size: var(--text-xs, 0.75rem);
      font-weight: var(--font-semibold, 600);
      color: #fff;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .data-table tbody tr {
      border-bottom: 1px solid var(--color-neutral-200, #E5E7EB);
      transition: background 150ms ease;
    }

    .data-table tbody tr:nth-child(even) {
      background: var(--surface-secondary, #F8FAFD);
    }

    .data-table tbody tr:hover {
      background: var(--color-accent-100, #FEF3C7);
    }

    .data-table td {
      padding: 12px 16px;
      font-size: var(--text-sm, 0.875rem);
      color: var(--color-neutral-800, #1F2937);
    }

    .cell-desc {
      max-width: 220px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      color: var(--color-neutral-500, #6B7280);
    }

    .cell-num { font-variant-numeric: tabular-nums; }

    .cell-actions {
      display: flex;
      gap: 8px;
      align-items: center;
    }

    /* Status badges */
    .status-badge {
      display: inline-block;
      padding: 3px 10px;
      border-radius: 999px;
      font-size: var(--text-xs, 0.75rem);
      font-weight: var(--font-semibold, 600);
    }

    .status-active {
      background: var(--color-success-light, #D1FAE5);
      color: var(--color-success, #059669);
    }

    .status-inactive {
      background: var(--color-neutral-200, #E5E7EB);
      color: var(--color-neutral-600, #4B5563);
    }

    /* Loading skeleton */
    .loading-state { padding: var(--space-4, 1rem) 0; }

    .skeleton-row {
      height: 48px;
      background: linear-gradient(90deg, var(--color-neutral-200, #E5E7EB) 25%, var(--color-neutral-100, #F3F4F6) 50%, var(--color-neutral-200, #E5E7EB) 75%);
      background-size: 200% 100%;
      animation: shimmer 1.4s infinite;
      border-radius: 8px;
      margin-bottom: var(--space-3, 0.75rem);
    }

    @keyframes shimmer {
      0% { background-position: 200% 0; }
      100% { background-position: -200% 0; }
    }

    /* Error banner */
    .error-banner {
      background: var(--color-danger-light, #FEE2E2);
      color: var(--color-danger, #DC2626);
      border: 1px solid var(--color-danger, #DC2626);
      border-radius: 8px;
      padding: 12px 16px;
      font-size: var(--text-sm, 0.875rem);
      margin-bottom: var(--space-6, 1.5rem);
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .retry-btn {
      background: transparent;
      border: 1px solid var(--color-danger, #DC2626);
      color: var(--color-danger, #DC2626);
      border-radius: 6px;
      padding: 4px 12px;
      font-size: var(--text-xs, 0.75rem);
      cursor: pointer;
    }

    /* Empty state */
    .empty-state {
      text-align: center;
      padding: var(--space-16, 4rem) var(--space-8, 2rem);
      background: var(--surface-primary, #fff);
      border-radius: 12px;
      box-shadow: var(--shadow-md, 0 4px 12px rgba(10,22,40,0.08));
    }

    .empty-icon { font-size: 3rem; margin-bottom: var(--space-4, 1rem); }

    .empty-title {
      font-size: var(--text-lg, 1.125rem);
      font-weight: var(--font-semibold, 600);
      color: var(--color-neutral-700, #374151);
      margin: 0 0 8px;
    }

    .empty-sub {
      font-size: var(--text-sm, 0.875rem);
      color: var(--color-neutral-500, #6B7280);
      margin: 0;
    }

    @media (max-width: 640px) {
      .field-row { grid-template-columns: 1fr; }
      .page-header { flex-direction: column; gap: var(--space-4, 1rem); }
    }
  `]
})
export class LeaveTypeManagementComponent implements OnInit {
  leaveTypes: LeaveType[] = [];
  loading = true;
  loadError: string | null = null;

  showForm = false;
  editingId: number | null = null;
  saving = false;
  formError: string | null = null;

  form!: FormGroup;

  constructor(
    private policyService: PolicyService,
    private fb: FormBuilder
  ) {}

  ngOnInit(): void {
    this.buildForm();
    this.loadLeaveTypes();
  }

  private buildForm(): void {
    this.form = this.fb.group({
      name: ['', [Validators.required, Validators.maxLength(100)]],
      description: [''],
      accrualRate: [null, [Validators.required, Validators.min(0)]],
      maxCarryOverDays: [null, [Validators.required, Validators.min(0)]],
      minNoticeDays: [null, [Validators.required, Validators.min(0)]]
    });
  }

  loadLeaveTypes(): void {
    this.loading = true;
    this.loadError = null;
    this.policyService.getLeaveTypes().subscribe({
      next: (data) => {
        this.leaveTypes = data;
        this.loading = false;
      },
      error: () => {
        this.loadError = 'Failed to load leave types. Please try again.';
        this.loading = false;
      }
    });
  }

  openCreate(): void {
    this.editingId = null;
    this.formError = null;
    this.form.reset();
    this.showForm = true;
  }

  openEdit(lt: LeaveType): void {
    this.editingId = lt.id;
    this.formError = null;
    this.form.setValue({
      name: lt.name,
      description: lt.description ?? '',
      accrualRate: lt.accrualRate,
      maxCarryOverDays: lt.maxCarryOverDays,
      minNoticeDays: lt.minNoticeDays
    });
    this.showForm = true;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  cancelForm(): void {
    this.showForm = false;
    this.editingId = null;
    this.formError = null;
    this.form.reset();
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const payload: LeaveTypePayload = {
      name: this.form.value.name.trim(),
      description: this.form.value.description?.trim() ?? '',
      accrualRate: Number(this.form.value.accrualRate),
      maxCarryOverDays: Number(this.form.value.maxCarryOverDays),
      minNoticeDays: Number(this.form.value.minNoticeDays)
    };

    this.saving = true;
    this.formError = null;

    const request$ = this.editingId
      ? this.policyService.updateLeaveType(this.editingId, payload)
      : this.policyService.createLeaveType(payload);

    request$.subscribe({
      next: () => {
        this.saving = false;
        this.cancelForm();
        this.loadLeaveTypes();
      },
      error: (err) => {
        this.saving = false;
        this.formError = err?.error?.message ?? 'Failed to save leave type. Please try again.';
      }
    });
  }

  isInvalid(field: string): boolean {
    const ctrl = this.form.get(field);
    return !!(ctrl && ctrl.invalid && (ctrl.dirty || ctrl.touched));
  }

  toggleStatus(lt: LeaveType): void {
    const newStatus = !lt.isActive;
    this.policyService.toggleLeaveTypeStatus(lt.id, newStatus).subscribe({
      next: () => this.loadLeaveTypes(),
      error: (err) => alert(err?.error?.message ?? 'Failed to update status.')
    });
  }

  confirmDelete(lt: LeaveType): void {
    if (!confirm(`Delete leave type "${lt.name}"? This will mark it as inactive and it will no longer be accrued for new users.`)) return;
    this.policyService.deleteLeaveType(lt.id).subscribe({
      next: () => this.loadLeaveTypes(),
      error: (err) => alert(err?.error?.message ?? 'Failed to delete leave type.')
    });
  }
}
