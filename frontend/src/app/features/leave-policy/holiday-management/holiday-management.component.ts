import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { PolicyService, PublicHoliday, PublicHolidayPayload } from '../../../core/services/policy.service';

@Component({
  selector: 'app-holiday-management',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="page-wrapper">
      <div class="page-header">
        <div class="header-left">
          <h1 class="page-title">Public Holidays</h1>
          <p class="page-subtitle">Define public holidays to exclude them from leave calculations</p>
        </div>
        <div class="header-actions">
          <button class="btn-secondary" (click)="toggleImport()" *ngIf="!showImport">
            ↑ Import CSV
          </button>
          <button class="btn-primary" (click)="openCreate()" *ngIf="!showForm">
            + Add Holiday
          </button>
        </div>
      </div>

      <!-- Year selector -->
      <div class="year-bar">
        <button class="year-nav" (click)="changeYear(-1)" [disabled]="loading">‹</button>
        <span class="year-label">{{ selectedYear }}</span>
        <button class="year-nav" (click)="changeYear(1)" [disabled]="loading">›</button>
      </div>

      <!-- CSV Import panel -->
      <div class="form-card import-card" *ngIf="showImport">
        <div class="card-header">
          <h2 class="card-title">Import from CSV</h2>
          <button class="btn-ghost" (click)="cancelImport()">✕ Cancel</button>
        </div>
        <p class="import-hint">
          CSV must have two columns: <code>date</code> (YYYY-MM-DD) and <code>name</code>.
          The first row is treated as a header and skipped.
        </p>
        <div class="field-group">
          <label class="field-label" for="csvFile">Select CSV file <span class="required">*</span></label>
          <input id="csvFile" type="file" accept=".csv" class="file-input"
            (change)="onFileSelected($event)" />
        </div>
        <div class="error-banner" *ngIf="importError">{{ importError }}</div>
        <div class="success-banner" *ngIf="importSuccess">{{ importSuccess }}</div>
        <div class="form-actions">
          <button type="button" class="btn-secondary" (click)="cancelImport()" [disabled]="importing">
            Cancel
          </button>
          <button type="button" class="btn-primary" (click)="onImport()"
            [disabled]="importing || !selectedFile">
            {{ importing ? 'Importing…' : 'Import' }}
          </button>
        </div>
      </div>

      <!-- Add Holiday form -->
      <div class="form-card" *ngIf="showForm">
        <div class="card-header">
          <h2 class="card-title">Add Public Holiday</h2>
          <button class="btn-ghost" (click)="cancelForm()">✕ Cancel</button>
        </div>
        <form [formGroup]="form" (ngSubmit)="onSubmit()" novalidate>
          <div class="field-row">
            <div class="field-group">
              <label class="field-label" for="holidayDate">Date <span class="required">*</span></label>
              <input id="holidayDate" type="date" formControlName="date" class="field-input"
                [class.error]="isInvalid('date')" />
              <span class="error-msg" *ngIf="isInvalid('date')">A valid date is required.</span>
            </div>
            <div class="field-group">
              <label class="field-label" for="holidayName">Name <span class="required">*</span></label>
              <input id="holidayName" type="text" formControlName="name" class="field-input"
                [class.error]="isInvalid('name')" placeholder="e.g. New Year's Day" />
              <span class="error-msg" *ngIf="isInvalid('name')">Name is required.</span>
            </div>
          </div>
          <div class="error-banner" *ngIf="formError">{{ formError }}</div>
          <div class="form-actions">
            <button type="button" class="btn-secondary" (click)="cancelForm()" [disabled]="saving">
              Cancel
            </button>
            <button type="submit" class="btn-primary" [disabled]="saving || form.invalid">
              {{ saving ? 'Saving…' : 'Add Holiday' }}
            </button>
          </div>
        </form>
      </div>

      <!-- Loading -->
      <div class="loading-state" *ngIf="loading">
        <div class="skeleton-row" *ngFor="let i of [1,2,3,4]"></div>
      </div>

      <!-- Load error -->
      <div class="error-banner" *ngIf="loadError && !loading">
        {{ loadError }}
        <button class="retry-btn" (click)="loadHolidays()">Retry</button>
      </div>

      <!-- Empty state -->
      <div class="empty-state" *ngIf="!loading && !loadError && holidays.length === 0 && !showForm">
        <div class="empty-icon">🗓️</div>
        <p class="empty-title">No public holidays for {{ selectedYear }}</p>
        <p class="empty-sub">Add holidays manually or import them from a CSV file.</p>
        <button class="btn-primary" style="margin-top:16px" (click)="openCreate()">
          + Add Holiday
        </button>
      </div>

      <!-- Holidays table -->
      <div class="table-card" *ngIf="!loading && !loadError && holidays.length > 0">
        <table class="data-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Day</th>
              <th>Name</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let h of holidays" class="table-row">
              <td class="cell-date">{{ h.date | date:'mediumDate' }}</td>
              <td class="cell-day">{{ h.date | date:'EEEE' }}</td>
              <td class="cell-name">{{ h.name }}</td>
              <td class="cell-actions">
                <button class="btn-delete" (click)="onDelete(h)"
                  [disabled]="deletingId === h.id">
                  {{ deletingId === h.id ? '…' : 'Delete' }}
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Delete error -->
      <div class="error-banner" style="margin-top:1rem" *ngIf="deleteError">
        {{ deleteError }}
      </div>
    </div>
  `,
  styles: [`
    .page-wrapper {
      padding: var(--space-8, 2rem);
      max-width: 900px;
      margin: 0 auto;
    }

    .page-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      margin-bottom: var(--space-6, 1.5rem);
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

    .header-actions {
      display: flex;
      gap: var(--space-3, 0.75rem);
      align-items: center;
    }

    /* Year bar */
    .year-bar {
      display: flex;
      align-items: center;
      gap: var(--space-4, 1rem);
      margin-bottom: var(--space-6, 1.5rem);
    }

    .year-label {
      font-size: var(--text-xl, 1.25rem);
      font-weight: var(--font-semibold, 600);
      color: var(--color-primary-800, #0F2240);
      min-width: 60px;
      text-align: center;
    }

    .year-nav {
      background: var(--surface-primary, #fff);
      border: 1px solid var(--color-neutral-300, #D1D5DB);
      border-radius: 6px;
      width: 32px;
      height: 32px;
      font-size: 1.1rem;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: background 150ms ease;
    }

    .year-nav:hover:not(:disabled) { background: var(--color-primary-50, #E8F2FC); }
    .year-nav:disabled { opacity: 0.5; cursor: not-allowed; }

    /* Form card */
    .form-card {
      background: var(--surface-primary, #fff);
      border-radius: 12px;
      box-shadow: var(--shadow-md, 0 4px 12px rgba(10,22,40,0.08));
      border-left: 3px solid var(--color-accent-500, #F59E0B);
      padding: var(--space-6, 1.5rem);
      margin-bottom: var(--space-6, 1.5rem);
    }

    .import-card { border-left-color: var(--color-primary-500, #1E4D8C); }

    .card-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: var(--space-5, 1.25rem);
    }

    .card-title {
      font-size: var(--text-xl, 1.25rem);
      font-weight: var(--font-semibold, 600);
      color: var(--color-primary-800, #0F2240);
      margin: 0;
    }

    .import-hint {
      font-size: var(--text-sm, 0.875rem);
      color: var(--color-neutral-600, #4B5563);
      margin: 0 0 var(--space-4, 1rem);
    }

    .import-hint code {
      background: var(--color-neutral-100, #F3F4F6);
      padding: 1px 5px;
      border-radius: 4px;
      font-family: monospace;
    }

    .file-input {
      display: block;
      font-size: var(--text-sm, 0.875rem);
      color: var(--color-neutral-700, #374151);
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

    .error-msg {
      font-size: var(--text-xs, 0.75rem);
      color: var(--color-danger, #DC2626);
    }

    .form-actions {
      display: flex;
      justify-content: flex-end;
      gap: var(--space-3, 0.75rem);
      margin-top: var(--space-2, 0.5rem);
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

    .btn-secondary:hover:not(:disabled) { background: var(--color-primary-50, #E8F2FC); }
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

    .btn-delete {
      background: transparent;
      border: 1px solid var(--color-danger, #DC2626);
      color: var(--color-danger, #DC2626);
      border-radius: 6px;
      padding: 4px 14px;
      font-size: var(--text-sm, 0.875rem);
      font-weight: var(--font-medium, 500);
      cursor: pointer;
      transition: background 150ms ease;
    }

    .btn-delete:hover:not(:disabled) { background: var(--color-danger-light, #FEE2E2); }
    .btn-delete:disabled { opacity: 0.5; cursor: not-allowed; }

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

    .data-table thead tr { background: var(--color-primary-800, #0F2240); }

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

    .data-table tbody tr:nth-child(even) { background: var(--surface-secondary, #F8FAFD); }
    .data-table tbody tr:hover { background: var(--color-accent-100, #FEF3C7); }

    .data-table td {
      padding: 12px 16px;
      font-size: var(--text-sm, 0.875rem);
      color: var(--color-neutral-800, #1F2937);
    }

    .cell-day { color: var(--color-neutral-500, #6B7280); }

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

    /* Banners */
    .error-banner {
      background: var(--color-danger-light, #FEE2E2);
      color: var(--color-danger, #DC2626);
      border: 1px solid var(--color-danger, #DC2626);
      border-radius: 8px;
      padding: 12px 16px;
      font-size: var(--text-sm, 0.875rem);
      margin-bottom: var(--space-4, 1rem);
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .success-banner {
      background: var(--color-success-light, #D1FAE5);
      color: var(--color-success, #059669);
      border: 1px solid var(--color-success, #059669);
      border-radius: 8px;
      padding: 12px 16px;
      font-size: var(--text-sm, 0.875rem);
      margin-bottom: var(--space-4, 1rem);
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
      .header-actions { width: 100%; }
    }
  `]
})
export class HolidayManagementComponent implements OnInit {
  holidays: PublicHoliday[] = [];
  selectedYear = new Date().getFullYear();
  loading = true;
  loadError: string | null = null;

  showForm = false;
  saving = false;
  formError: string | null = null;
  form!: FormGroup;

  showImport = false;
  selectedFile: File | null = null;
  importing = false;
  importError: string | null = null;
  importSuccess: string | null = null;

  deletingId: number | null = null;
  deleteError: string | null = null;

  constructor(
    private policyService: PolicyService,
    private fb: FormBuilder
  ) {}

  ngOnInit(): void {
    this.buildForm();
    this.loadHolidays();
  }

  private buildForm(): void {
    this.form = this.fb.group({
      date: ['', Validators.required],
      name: ['', [Validators.required, Validators.maxLength(200)]]
    });
  }

  loadHolidays(): void {
    this.loading = true;
    this.loadError = null;
    this.policyService.getPublicHolidays(this.selectedYear).subscribe({
      next: (data) => {
        this.holidays = data.sort((a, b) => a.date.localeCompare(b.date));
        this.loading = false;
      },
      error: () => {
        this.loadError = 'Failed to load public holidays. Please try again.';
        this.loading = false;
      }
    });
  }

  changeYear(delta: number): void {
    this.selectedYear += delta;
    this.loadHolidays();
  }

  openCreate(): void {
    this.formError = null;
    this.form.reset();
    this.showForm = true;
  }

  cancelForm(): void {
    this.showForm = false;
    this.formError = null;
    this.form.reset();
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const payload: PublicHolidayPayload = {
      date: this.form.value.date,
      name: this.form.value.name.trim()
    };

    this.saving = true;
    this.formError = null;

    this.policyService.createPublicHoliday(payload).subscribe({
      next: () => {
        this.saving = false;
        this.cancelForm();
        this.loadHolidays();
      },
      error: (err) => {
        this.saving = false;
        this.formError = err?.error?.message ?? 'Failed to add holiday. Please try again.';
      }
    });
  }

  onDelete(holiday: PublicHoliday): void {
    if (!confirm(`Delete "${holiday.name}"?`)) return;
    this.deletingId = holiday.id;
    this.deleteError = null;

    this.policyService.deletePublicHoliday(holiday.id).subscribe({
      next: () => {
        this.deletingId = null;
        this.holidays = this.holidays.filter(h => h.id !== holiday.id);
      },
      error: (err) => {
        this.deletingId = null;
        this.deleteError = err?.error?.message ?? 'Failed to delete holiday. Please try again.';
      }
    });
  }

  toggleImport(): void {
    this.showImport = true;
    this.selectedFile = null;
    this.importError = null;
    this.importSuccess = null;
  }

  cancelImport(): void {
    this.showImport = false;
    this.selectedFile = null;
    this.importError = null;
    this.importSuccess = null;
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.selectedFile = input.files?.[0] ?? null;
    this.importError = null;
    this.importSuccess = null;
  }

  onImport(): void {
    if (!this.selectedFile) return;
    this.importing = true;
    this.importError = null;
    this.importSuccess = null;

    this.policyService.importPublicHolidays(this.selectedFile).subscribe({
      next: (res) => {
        this.importing = false;
        this.importSuccess = `Successfully imported ${res.importedCount} holiday${res.importedCount !== 1 ? 's' : ''}.`;
        this.selectedFile = null;
        this.loadHolidays();
      },
      error: (err) => {
        this.importing = false;
        this.importError = err?.error?.message ?? 'Import failed. Please check the file format and try again.';
      }
    });
  }

  isInvalid(field: string): boolean {
    const ctrl = this.form.get(field);
    return !!(ctrl && ctrl.invalid && (ctrl.dirty || ctrl.touched));
  }
}
