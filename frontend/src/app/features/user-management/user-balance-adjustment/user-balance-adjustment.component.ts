import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { LeaveBalanceService } from '../../../core/services/leave-balance.service';
import { LeaveBalance } from '../../../core/models/leave-balance.model';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
  selector: 'app-user-balance-adjustment',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="form-card">
      <h2 class="section-title">Leave Balances</h2>
      
      <div *ngIf="isLoadingBalances" class="loading-state">Loading balances...</div>
      <div *ngIf="loadError" class="alert-error">{{ loadError }}</div>

      <ng-container *ngIf="!isLoadingBalances && !loadError">
        <div class="balances-list">
          <div *ngFor="let balance of balances" class="balance-item">
            <div class="balance-info">
              <span class="leave-type-name">{{ balance.leaveTypeName }}</span>
              <span class="balance-value">{{ balance.availableDays }} days available</span>
            </div>
            <button type="button" class="btn-adjust" (click)="openAdjustModal(balance)">
              Adjust
            </button>
          </div>
          
          <div *ngIf="balances.length === 0" class="empty-state-container">
            <div class="empty-state-content">
              <svg class="empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p class="empty-title">No Leave Balances</p>
              <p class="empty-description">This user doesn't have any leave balances yet. Initialize balances based on monthly accrual rates.</p>
              <button 
                type="button" 
                class="btn-initialize" 
                (click)="initializeBalances()"
                [disabled]="isInitializing">
                {{ isInitializing ? 'Initializing...' : 'Add Monthly Accrual' }}
              </button>
            </div>
          </div>
        </div>

        <!-- Adjustment Modal -->
        <div *ngIf="showAdjustModal" class="modal-overlay" (click)="closeAdjustModal()">
          <div class="modal-content" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h3>Adjust Leave Balance</h3>
              <button class="modal-close" (click)="closeAdjustModal()">&times;</button>
            </div>
            
            <form [formGroup]="adjustForm" (ngSubmit)="submitAdjustment()" novalidate>
              <div class="modal-body">
                <div class="form-group">
                  <label>Leave Type</label>
                  <input type="text" [value]="selectedBalance?.leaveTypeName" disabled class="form-input" />
                </div>

                <div class="form-group">
                  <label>Current Balance</label>
                  <input type="text" [value]="selectedBalance?.availableDays + ' days'" disabled class="form-input" />
                </div>

                <div class="form-group">
                  <label for="amount">Adjustment Amount <span class="required">*</span></label>
                  <input 
                    id="amount" 
                    type="number" 
                    step="0.5"
                    formControlName="amount"
                    class="form-input"
                    [class.input-error]="isInvalid(adjustForm, 'amount')"
                    placeholder="Enter positive or negative value" />
                  <span class="field-hint">Use positive values to add, negative to subtract</span>
                  <span *ngIf="isInvalid(adjustForm, 'amount')" class="field-error">Amount is required.</span>
                </div>

                <div class="form-group">
                  <label for="reason">Reason <span class="required">*</span></label>
                  <textarea 
                    id="reason" 
                    formControlName="reason"
                    class="form-textarea"
                    [class.input-error]="isInvalid(adjustForm, 'reason')"
                    rows="3"
                    placeholder="Enter reason for adjustment"></textarea>
                  <span *ngIf="isInvalid(adjustForm, 'reason')" class="field-error">Reason is required.</span>
                </div>

                <div *ngIf="adjustError" class="alert-error">{{ adjustError }}</div>
              </div>

              <div class="modal-footer">
                <button type="button" class="btn-secondary" (click)="closeAdjustModal()">Cancel</button>
                <button type="submit" class="btn-primary" [disabled]="isAdjusting">
                  {{ isAdjusting ? 'Adjusting...' : 'Adjust Balance' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      </ng-container>
    </div>
  `,
  styles: [`
    .form-card {
      background: #fff;
      border-radius: 8px;
      box-shadow: 0 1px 4px rgba(0,0,0,0.08);
      padding: 2rem;
      margin-bottom: 1.5rem;
    }

    .section-title {
      font-size: 1rem;
      font-weight: 700;
      color: #1a1a2e;
      margin: 0 0 1.25rem;
      padding-bottom: 0.75rem;
      border-bottom: 1px solid #e5e7eb;
    }

    .loading-state {
      text-align: center;
      padding: 2rem;
      color: #6b7280;
    }

    .alert-error {
      background: #fef2f2;
      border: 1px solid #fca5a5;
      color: #b91c1c;
      padding: 0.75rem 1rem;
      border-radius: 6px;
      font-size: 0.875rem;
      margin-bottom: 1rem;
    }

    .balances-list {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .balance-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 1rem;
      border: 1px solid #e5e7eb;
      border-radius: 6px;
      transition: border-color 0.15s;
    }

    .balance-item:hover {
      border-color: #d1d5db;
    }

    .balance-info {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .leave-type-name {
      font-size: 0.95rem;
      font-weight: 600;
      color: #1a1a2e;
    }

    .balance-value {
      font-size: 0.875rem;
      color: #6b7280;
    }

    .btn-adjust {
      padding: 0.5rem 1rem;
      background: #3f476e;
      color: white;
      border: none;
      border-radius: 6px;
      font-size: 0.875rem;
      font-weight: 600;
      cursor: pointer;
      transition: background 0.15s;
    }

    .btn-adjust:hover {
      background: #2c3350;
    }

    .empty-state-container {
      padding: 3rem 2rem;
    }

    .empty-state-content {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      max-width: 400px;
      margin: 0 auto;
    }

    .empty-icon {
      width: 64px;
      height: 64px;
      color: #9ca3af;
      margin-bottom: 1rem;
    }

    .empty-title {
      font-size: 1.125rem;
      font-weight: 600;
      color: #1a1a2e;
      margin: 0 0 0.5rem;
    }

    .empty-description {
      font-size: 0.875rem;
      color: #6b7280;
      margin: 0 0 1.5rem;
      line-height: 1.5;
    }

    .btn-initialize {
      padding: 0.75rem 1.5rem;
      background: #10b981;
      color: white;
      border: none;
      border-radius: 6px;
      font-size: 0.9rem;
      font-weight: 600;
      cursor: pointer;
      transition: background 0.15s;
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
    }

    .btn-initialize:hover:not(:disabled) {
      background: #059669;
    }

    .btn-initialize:disabled {
      background: #9ca3af;
      cursor: not-allowed;
    }

    .empty-state {
      text-align: center;
      padding: 2rem;
      color: #6b7280;
      font-size: 0.875rem;
    }

    /* Modal Styles */
    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10000;
      padding: 1rem;
    }

    .modal-content {
      background: white;
      border-radius: 8px;
      max-width: 500px;
      width: 100%;
      max-height: 90vh;
      overflow-y: auto;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
    }

    .modal-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 1.5rem;
      border-bottom: 1px solid #e5e7eb;
    }

    .modal-header h3 {
      font-size: 1.125rem;
      font-weight: 700;
      color: #1a1a2e;
      margin: 0;
    }

    .modal-close {
      background: none;
      border: none;
      font-size: 1.5rem;
      color: #6b7280;
      cursor: pointer;
      padding: 0;
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 4px;
      transition: background 0.15s;
    }

    .modal-close:hover {
      background: #f3f4f6;
    }

    .modal-body {
      padding: 1.5rem;
    }

    .modal-footer {
      display: flex;
      justify-content: flex-end;
      gap: 0.75rem;
      padding: 1.5rem;
      border-top: 1px solid #e5e7eb;
    }

    .form-group {
      margin-bottom: 1rem;
    }

    .form-group label {
      display: block;
      font-size: 0.875rem;
      font-weight: 500;
      color: #374151;
      margin-bottom: 0.375rem;
    }

    .required {
      color: #ef4444;
    }

    .form-input,
    .form-textarea {
      width: 100%;
      padding: 0.6rem 0.75rem;
      border: 1px solid #d1d5db;
      border-radius: 6px;
      font-size: 0.9rem;
      outline: none;
      transition: border-color 0.15s;
    }

    .form-input:focus,
    .form-textarea:focus {
      border-color: #3f476e;
      box-shadow: 0 0 0 3px rgba(63, 71, 110, 0.1);
    }

    .form-input:disabled {
      background: #f3f4f6;
      color: #6b7280;
      cursor: not-allowed;
    }

    .input-error {
      border-color: #ef4444 !important;
    }

    .field-error {
      display: block;
      font-size: 0.8rem;
      color: #ef4444;
      margin-top: 0.25rem;
    }

    .field-hint {
      display: block;
      font-size: 0.8rem;
      color: #6b7280;
      margin-top: 0.25rem;
    }

    .btn-primary,
    .btn-secondary {
      padding: 0.6rem 1.5rem;
      border: none;
      border-radius: 6px;
      font-size: 0.9rem;
      font-weight: 600;
      cursor: pointer;
      transition: background 0.15s;
    }

    .btn-primary {
      background: #3f476e;
      color: white;
    }

    .btn-primary:hover:not(:disabled) {
      background: #2c3350;
    }

    .btn-primary:disabled {
      background: #9ca3af;
      cursor: not-allowed;
    }

    .btn-secondary {
      background: #f3f4f6;
      color: #374151;
    }

    .btn-secondary:hover {
      background: #e5e7eb;
    }
  `]
})
export class UserBalanceAdjustmentComponent implements OnInit, OnDestroy {
  @Input() userId!: number;

  balances: LeaveBalance[] = [];
  isLoadingBalances = false;
  loadError = '';
  isInitializing = false;

  showAdjustModal = false;
  selectedBalance: LeaveBalance | null = null;
  adjustForm: FormGroup;
  isAdjusting = false;
  adjustError = '';

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private leaveBalanceService: LeaveBalanceService,
    private notificationService: NotificationService
  ) {
    this.adjustForm = this.fb.group({
      amount: ['', [Validators.required]],
      reason: ['', [Validators.required]]
    });
  }

  ngOnInit(): void {
    this.loadBalances();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadBalances(): void {
    this.isLoadingBalances = true;
    this.loadError = '';

    this.leaveBalanceService.getUserBalances(this.userId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (balances: LeaveBalance[]) => {
          this.balances = balances;
          this.isLoadingBalances = false;
        },
        error: (err: any) => {
          this.loadError = 'Failed to load leave balances.';
          this.isLoadingBalances = false;
        }
      });
  }

  openAdjustModal(balance: LeaveBalance): void {
    this.selectedBalance = balance;
    this.showAdjustModal = true;
    this.adjustForm.reset();
    this.adjustError = '';
  }

  closeAdjustModal(): void {
    this.showAdjustModal = false;
    this.selectedBalance = null;
    this.adjustForm.reset();
    this.adjustError = '';
  }

  isInvalid(form: FormGroup, field: string): boolean {
    const ctrl = form.get(field);
    return !!(ctrl && ctrl.invalid && (ctrl.dirty || ctrl.touched));
  }

  submitAdjustment(): void {
    this.adjustForm.markAllAsTouched();
    if (this.adjustForm.invalid || !this.selectedBalance) return;

    this.isAdjusting = true;
    this.adjustError = '';

    const { amount, reason } = this.adjustForm.value;

    this.leaveBalanceService.adjustBalance({
      userId: this.userId,
      leaveTypeId: this.selectedBalance.leaveTypeId,
      amount: Number(amount),
      reason
    }).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        this.isAdjusting = false;
        this.notificationService.success('Leave balance adjusted successfully.');
        this.closeAdjustModal();
        this.loadBalances(); // Reload balances
      },
      error: (err) => {
        this.isAdjusting = false;
        this.adjustError = err?.error?.message ?? 'Failed to adjust balance.';
      }
    });
  }

  initializeBalances(): void {
    this.isInitializing = true;
    this.loadError = '';

    this.leaveBalanceService.initializeUserBalances(this.userId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.isInitializing = false;
          this.balances = response.balances;
          this.notificationService.success('Leave balances initialized successfully based on monthly accrual rates.');
        },
        error: (err) => {
          this.isInitializing = false;
          this.loadError = err?.error?.message ?? 'Failed to initialize leave balances.';
          this.notificationService.error('Failed to initialize leave balances.');
        }
      });
  }
}
