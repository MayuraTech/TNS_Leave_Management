import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { ReportService } from '../../../core/services/report.service';
import { LeaveBalanceReportItem, Department } from '../../../core/models/report.model';

@Component({
  selector: 'app-balance-report',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="report-page">
      <!-- Page Header -->
      <div class="page-header">
        <div class="page-header__text">
          <h1 class="page-title">Leave Balance Report</h1>
          <p class="page-subtitle">View current leave balances for all employees, filterable by department</p>
        </div>
        <button
          class="btn btn--primary"
          (click)="exportCsv()"
          [disabled]="isExporting || reportData.length === 0"
          aria-label="Export balance report as CSV"
        >
          <svg class="btn__icon" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path fill-rule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clip-rule="evenodd"/>
          </svg>
          {{ isExporting ? 'Exporting…' : 'Export CSV' }}
        </button>
      </div>

      <!-- Filter Card -->
      <div class="card filters-card">
        <h2 class="card__title">Filters</h2>
        <form [formGroup]="filterForm" (ngSubmit)="loadReport()" class="filters-grid">
          <div class="form-group">
            <label for="departmentId" class="form-label">Department</label>
            <select id="departmentId" formControlName="departmentId" class="form-input">
              <option value="">All Departments</option>
              <option *ngFor="let dept of departments" [value]="dept.id">{{ dept.name }}</option>
            </select>
          </div>

          <div class="filters-actions">
            <button type="submit" class="btn btn--accent" [disabled]="isLoading">
              {{ isLoading ? 'Loading…' : 'Apply Filter' }}
            </button>
            <button type="button" class="btn btn--secondary" (click)="resetFilter()">
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

      <!-- Summary Stats -->
      <div *ngIf="!isLoading && reportData.length > 0" class="stats-grid">
        <div class="stat-card">
          <span class="stat-card__label">Total Employees</span>
          <span class="stat-card__value">{{ uniqueEmployeeCount }}</span>
        </div>
        <div class="stat-card">
          <span class="stat-card__label">Total Available Days</span>
          <span class="stat-card__value">{{ totalAvailableDays | number:'1.1-1' }}</span>
        </div>
        <div class="stat-card">
          <span class="stat-card__label">Total Used Days</span>
          <span class="stat-card__value">{{ totalUsedDays | number:'1.1-1' }}</span>
        </div>
        <div class="stat-card stat-card--accent">
          <span class="stat-card__label">Total Accrued Days</span>
          <span class="stat-card__value">{{ totalAccruedDays | number:'1.1-1' }}</span>
        </div>
      </div>

      <!-- Results Card -->
      <div class="card table-card">
        <div class="table-header">
          <span class="table-count" *ngIf="!isLoading">
            {{ reportData.length }} record{{ reportData.length !== 1 ? 's' : '' }} found
          </span>
          <span class="table-count" *ngIf="isLoading">Loading…</span>
        </div>

        <!-- Loading Skeleton -->
        <div *ngIf="isLoading" class="skeleton-wrapper" aria-busy="true" aria-label="Loading balance data">
          <div class="skeleton-row" *ngFor="let i of [1,2,3,4,5]"></div>
        </div>

        <!-- Empty State -->
        <div *ngIf="!isLoading && reportData.length === 0 && !errorMessage" class="empty-state">
          <svg class="empty-state__icon" viewBox="0 0 48 48" fill="none" aria-hidden="true">
            <rect width="48" height="48" rx="12" fill="#E8F2FC"/>
            <path d="M12 36V20l12-8 12 8v16H12z" stroke="#1E4D8C" stroke-width="2" stroke-linejoin="round"/>
            <circle cx="24" cy="26" r="4" stroke="#F59E0B" stroke-width="2"/>
          </svg>
          <p class="empty-state__title">No balance data found</p>
          <p class="empty-state__subtitle">Select a department or load all employees to see balances.</p>
        </div>

        <!-- Data Table -->
        <div *ngIf="!isLoading && reportData.length > 0" class="table-wrapper">
          <table class="data-table" aria-label="Leave balance report results">
            <thead>
              <tr>
                <th scope="col">Employee</th>
                <th scope="col">Department</th>
                <th scope="col">Leave Type</th>
                <th scope="col" class="text-right">Available</th>
                <th scope="col" class="text-right">Used</th>
                <th scope="col" class="text-right">Accrued</th>
                <th scope="col" class="text-center">Status</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let row of reportData; let odd = odd" [class.row--odd]="odd">
                <td class="cell--name">{{ row.employeeName }}</td>
                <td>{{ row.department }}</td>
                <td>
                  <span class="badge badge--type">{{ row.leaveTypeName }}</span>
                </td>
                <td class="text-right cell--available">{{ row.availableDays | number:'1.1-1' }}</td>
                <td class="text-right cell--used">{{ row.usedDays | number:'1.1-1' }}</td>
                <td class="text-right">{{ row.accruedDays | number:'1.1-1' }}</td>
                <td class="text-center">
                  <span class="badge" [ngClass]="getBalanceBadgeClass(row.availableDays)">
                    {{ getBalanceLabel(row.availableDays) }}
                  </span>
                </td>
              </tr>
            </tbody>
            <tfoot>
              <tr class="totals-row">
                <td colspan="3" class="totals-label">Totals</td>
                <td class="text-right">{{ totalAvailableDays | number:'1.1-1' }}</td>
                <td class="text-right">{{ totalUsedDays | number:'1.1-1' }}</td>
                <td class="text-right">{{ totalAccruedDays | number:'1.1-1' }}</td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .report-page {
      padding: 1.5rem 2rem;
      max-width: 1200px;
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
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
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

    .btn--primary {
      background: #1E4D8C;
      color: #fff;
    }

    .btn--primary:not(:disabled):hover {
      background: #152E54;
      box-shadow: 0 4px 12px rgba(10, 22, 40, 0.2);
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

    .btn__icon {
      width: 1rem;
      height: 1rem;
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

    /* Stats Grid */
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
      gap: 1rem;
    }

    .stat-card {
      background: #fff;
      border-radius: 12px;
      padding: 1.25rem 1.5rem;
      box-shadow: 0 4px 12px rgba(10, 22, 40, 0.08);
      border-left: 3px solid #1E4D8C;
      display: flex;
      flex-direction: column;
      gap: 0.375rem;
    }

    .stat-card--accent {
      border-left-color: #F59E0B;
    }

    .stat-card__label {
      font-size: 0.75rem;
      font-weight: 500;
      color: #6B7280;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .stat-card__value {
      font-size: 1.75rem;
      font-weight: 700;
      color: #0F2240;
      line-height: 1.2;
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

    .data-table thead th.text-center {
      text-align: center;
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
    }

    .data-table .text-right {
      text-align: right;
    }

    .data-table .text-center {
      text-align: center;
    }

    .cell--name {
      font-weight: 500;
      color: #111827;
    }

    .cell--available {
      font-weight: 600;
      color: #059669;
    }

    .cell--used {
      font-weight: 600;
      color: #DC2626;
    }

    /* Badges */
    .badge {
      display: inline-block;
      padding: 0.2rem 0.625rem;
      border-radius: 9999px;
      font-size: 0.75rem;
      font-weight: 500;
    }

    .badge--type {
      background: #DBEAFE;
      color: #1D4ED8;
    }

    .badge--healthy {
      background: #D1FAE5;
      color: #065F46;
    }

    .badge--low {
      background: #FEF3C7;
      color: #92400E;
    }

    .badge--critical {
      background: #FEE2E2;
      color: #991B1B;
    }

    /* Totals Row */
    .totals-row {
      background: #E8F2FC !important;
      border-top: 2px solid #1E4D8C;
    }

    .totals-row td {
      padding: 0.875rem 1.25rem;
      font-weight: 700;
      color: #0F2240;
    }

    .totals-label {
      font-size: 0.875rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    @media (max-width: 640px) {
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

      .stats-grid {
        grid-template-columns: 1fr 1fr;
      }
    }
  `]
})
export class BalanceReportComponent implements OnInit {
  filterForm: FormGroup;
  reportData: LeaveBalanceReportItem[] = [];
  departments: Department[] = [];
  isLoading = false;
  isExporting = false;
  errorMessage = '';

  constructor(
    private fb: FormBuilder,
    private reportService: ReportService
  ) {
    this.filterForm = this.fb.group({
      departmentId: ['']
    });
  }

  ngOnInit(): void {
    this.loadDepartments();
    this.loadReport();
  }

  get uniqueEmployeeCount(): number {
    return new Set(this.reportData.map(r => r.employeeId)).size;
  }

  get totalAvailableDays(): number {
    return this.reportData.reduce((sum, r) => sum + r.availableDays, 0);
  }

  get totalUsedDays(): number {
    return this.reportData.reduce((sum, r) => sum + r.usedDays, 0);
  }

  get totalAccruedDays(): number {
    return this.reportData.reduce((sum, r) => sum + r.accruedDays, 0);
  }

  loadDepartments(): void {
    this.reportService.getDepartments().subscribe({
      next: (depts) => (this.departments = depts),
      error: () => { /* non-critical */ }
    });
  }

  loadReport(): void {
    this.isLoading = true;
    this.errorMessage = '';

    const { departmentId } = this.filterForm.value;
    const deptId = departmentId ? Number(departmentId) : undefined;

    this.reportService.getLeaveBalanceReport(deptId).subscribe({
      next: (data) => {
        this.reportData = data;
        this.isLoading = false;
      },
      error: () => {
        this.errorMessage = 'Failed to load balance data. Please try again.';
        this.isLoading = false;
      }
    });
  }

  resetFilter(): void {
    this.filterForm.reset({ departmentId: '' });
    this.loadReport();
  }

  getBalanceBadgeClass(availableDays: number): string {
    if (availableDays <= 0) return 'badge--critical';
    if (availableDays < 3) return 'badge--low';
    return 'badge--healthy';
  }

  getBalanceLabel(availableDays: number): string {
    if (availableDays <= 0) return 'Depleted';
    if (availableDays < 3) return 'Low';
    return 'Healthy';
  }

  exportCsv(): void {
    this.isExporting = true;
    const { departmentId } = this.filterForm.value;
    const filters = { departmentId: departmentId ? Number(departmentId) : undefined };

    this.reportService.exportReport('leave-balances', filters).subscribe({
      next: (blob) => {
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = `leave-balance-report-${new Date().toISOString().slice(0, 10)}.csv`;
        anchor.click();
        URL.revokeObjectURL(url);
        this.isExporting = false;
      },
      error: () => {
        this.errorMessage = 'Failed to export report. Please try again.';
        this.isExporting = false;
      }
    });
  }
}
