import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { LeaveService } from '../../../core/services/leave.service';
import { LeaveType, LeaveBalance } from '../../../core/models/leave-balance.model';
import { LeaveDurationType, SessionType } from '../../../core/models/leave-request.model';

function endDateAfterStartDate(group: AbstractControl): ValidationErrors | null {
  const start = group.get('startDate')?.value;
  const end = group.get('endDate')?.value;
  if (start && end && end < start) {
    return { endBeforeStart: true };
  }
  return null;
}

@Component({
  selector: 'app-request-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  template: `
    <div class="page-wrapper">
      <div class="form-card">
        <div class="card-header">
          <h2 class="card-title">New Leave Request</h2>
          <a routerLink="/leave-requests" class="back-link">← Back to requests</a>
        </div>

        <form [formGroup]="form" (ngSubmit)="onSubmit()" novalidate>

          <!-- Leave Type -->
          <div class="field-group">
            <label class="field-label" for="leaveTypeId">Leave Type <span class="required">*</span></label>
            <select id="leaveTypeId" formControlName="leaveTypeId" class="field-input"
              [class.error]="isInvalid('leaveTypeId')" (change)="onLeaveTypeChange()">
              <option value="">Select leave type</option>
              <option *ngFor="let lt of leaveTypes" [value]="lt.id">{{ lt.name }}</option>
            </select>
            <span class="error-msg" *ngIf="isInvalid('leaveTypeId')">Leave type is required.</span>

            <div class="balance-badge" *ngIf="selectedBalance">
              <span class="balance-label">Available balance:</span>
              <span class="balance-value">{{ selectedBalance.availableDays }} days</span>
              <span class="balance-hours" *ngIf="selectedBalance.availableHours != null">
                / {{ selectedBalance.availableHours }} hrs
              </span>
            </div>
          </div>

          <!-- Duration Type -->
          <div class="field-group">
            <label class="field-label">Duration Type <span class="required">*</span></label>
            <div class="toggle-group">
              <button type="button" class="toggle-btn"
                [class.active]="durationType === 'FULL_DAY'"
                (click)="setDurationType('FULL_DAY')">Full Day</button>
              <button type="button" class="toggle-btn"
                [class.active]="durationType === 'HALF_DAY'"
                (click)="setDurationType('HALF_DAY')">Half Day</button>
              <button type="button" class="toggle-btn"
                [class.active]="durationType === 'HOURLY'"
                (click)="setDurationType('HOURLY')">Hourly</button>
            </div>
          </div>

          <!-- Full Day: start + end date -->
          <ng-container *ngIf="durationType === 'FULL_DAY'">
            <div class="field-row">
              <div class="field-group">
                <label class="field-label" for="startDate">Start Date <span class="required">*</span></label>
                <input id="startDate" type="date" formControlName="startDate" class="field-input"
                  [class.error]="isInvalid('startDate')" />
                <span class="error-msg" *ngIf="isInvalid('startDate')">Start date is required.</span>
              </div>
              <div class="field-group">
                <label class="field-label" for="endDate">End Date <span class="required">*</span></label>
                <input id="endDate" type="date" formControlName="endDate" class="field-input"
                  [class.error]="isInvalid('endDate') || form.hasError('endBeforeStart')" />
                <span class="error-msg" *ngIf="isInvalid('endDate')">End date is required.</span>
                <span class="error-msg" *ngIf="!isInvalid('endDate') && form.hasError('endBeforeStart')">
                  End date must be on or after start date.
                </span>
              </div>
            </div>
          </ng-container>

          <!-- Half Day / Hourly: single date -->
          <ng-container *ngIf="durationType === 'HALF_DAY' || durationType === 'HOURLY'">
            <div class="field-group">
              <label class="field-label" for="singleDate">Date <span class="required">*</span></label>
              <input id="singleDate" type="date" formControlName="startDate" class="field-input"
                [class.error]="isInvalid('startDate')" />
              <span class="error-msg" *ngIf="isInvalid('startDate')">Date is required.</span>
            </div>
          </ng-container>

          <!-- Session Type (Half Day only) -->
          <div class="field-group" *ngIf="durationType === 'HALF_DAY'">
            <label class="field-label">Session <span class="required">*</span></label>
            <div class="toggle-group">
              <button type="button" class="toggle-btn"
                [class.active]="form.get('sessionType')?.value === 'MORNING'"
                (click)="form.get('sessionType')?.setValue('MORNING')">Morning</button>
              <button type="button" class="toggle-btn"
                [class.active]="form.get('sessionType')?.value === 'AFTERNOON'"
                (click)="form.get('sessionType')?.setValue('AFTERNOON')">Afternoon</button>
            </div>
            <span class="error-msg" *ngIf="isInvalid('sessionType')">Session is required.</span>
          </div>

          <!-- Hours (Hourly only) -->
          <div class="field-group" *ngIf="durationType === 'HOURLY'">
            <label class="field-label" for="durationInHours">Duration (hours) <span class="required">*</span></label>
            <input id="durationInHours" type="number" formControlName="durationInHours" class="field-input"
              [class.error]="isInvalid('durationInHours')"
              min="0.5" max="8" step="0.5" placeholder="0.5 – 8" />
            <span class="error-msg" *ngIf="isInvalid('durationInHours')">
              <ng-container *ngIf="form.get('durationInHours')?.errors?.['required']">Duration is required.</ng-container>
              <ng-container *ngIf="form.get('durationInHours')?.errors?.['min'] || form.get('durationInHours')?.errors?.['max']">
                Duration must be between 0.5 and 8 hours.
              </ng-container>
            </span>
          </div>

          <!-- Reason -->
          <div class="field-group">
            <label class="field-label" for="reason">Reason <span class="required">*</span></label>
            <textarea id="reason" formControlName="reason" class="field-input field-textarea"
              [class.error]="isInvalid('reason')"
              rows="4" placeholder="Briefly describe the reason for your leave..."></textarea>
            <span class="error-msg" *ngIf="isInvalid('reason')">Reason is required.</span>
          </div>

          <!-- Error banner -->
          <div class="error-banner" *ngIf="submitError">{{ submitError }}</div>

          <!-- Actions -->
          <div class="form-actions">
            <a routerLink="/leave-requests" class="btn-secondary">Cancel</a>
            <button type="submit" class="btn-primary" [disabled]="submitting">
              {{ submitting ? 'Submitting…' : 'Submit Request' }}
            </button>
          </div>

        </form>
      </div>
    </div>
  `,
  styles: [`
    .page-wrapper {
      min-height: 100vh;
      background: #F3F4F6;
      display: flex;
      align-items: flex-start;
      justify-content: center;
      padding: 40px 16px;
    }

    .form-card {
      background: #fff;
      border-radius: 12px;
      box-shadow: 0 4px 12px rgba(10, 22, 40, 0.08);
      border-left: 3px solid #F59E0B;
      width: 100%;
      max-width: 680px;
      padding: 32px;
    }

    .card-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 28px;
    }

    .card-title {
      font-family: 'Outfit', 'General Sans', sans-serif;
      font-size: 1.5rem;
      font-weight: 700;
      color: #0A1628;
      margin: 0;
    }

    .back-link {
      font-size: 0.875rem;
      color: #1E4D8C;
      text-decoration: none;
      font-weight: 500;
    }

    .back-link:hover { text-decoration: underline; }

    .field-group {
      margin-bottom: 20px;
    }

    .field-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
    }

    .field-label {
      display: block;
      font-family: 'General Sans', 'Outfit', sans-serif;
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

    .toggle-group {
      display: flex;
      gap: 8px;
    }

    .toggle-btn {
      padding: 8px 20px;
      border: 1px solid #D1D5DB;
      border-radius: 8px;
      background: #fff;
      color: #374151;
      font-size: 0.875rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.15s;
    }

    .toggle-btn:hover { border-color: #F59E0B; }

    .toggle-btn.active {
      background: #F59E0B;
      border-color: #F59E0B;
      color: #0A1628;
      font-weight: 700;
    }

    .balance-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      margin-top: 8px;
      padding: 6px 12px;
      background: #EFF6FF;
      border: 1px solid #BFDBFE;
      border-radius: 6px;
      font-size: 0.8125rem;
    }

    .balance-label { color: #374151; }
    .balance-value { font-weight: 700; color: #1E4D8C; }
    .balance-hours { color: #6B7280; }

    .error-banner {
      padding: 12px 16px;
      background: #FEF2F2;
      border: 1px solid #FECACA;
      border-radius: 8px;
      color: #DC2626;
      font-size: 0.875rem;
      margin-bottom: 20px;
    }

    .form-actions {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      margin-top: 8px;
    }

    .btn-primary {
      padding: 12px 24px;
      background: #F59E0B;
      color: #0A1628;
      border: none;
      border-radius: 8px;
      font-weight: 700;
      font-size: 0.9375rem;
      cursor: pointer;
      transition: opacity 0.15s;
    }

    .btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
    .btn-primary:not(:disabled):hover { opacity: 0.9; }

    .btn-secondary {
      padding: 12px 24px;
      background: transparent;
      color: #1E4D8C;
      border: 1px solid #1E4D8C;
      border-radius: 8px;
      font-weight: 600;
      font-size: 0.9375rem;
      cursor: pointer;
      text-decoration: none;
      display: inline-flex;
      align-items: center;
      transition: background 0.15s;
    }

    .btn-secondary:hover { background: #EFF6FF; }

    @media (max-width: 600px) {
      .field-row { grid-template-columns: 1fr; }
      .form-card { padding: 20px; }
    }
  `]
})
export class RequestFormComponent implements OnInit {
  form!: FormGroup;
  durationType: LeaveDurationType = 'FULL_DAY';
  leaveTypes: LeaveType[] = [];
  balances: LeaveBalance[] = [];
  selectedBalance: LeaveBalance | null = null;
  submitting = false;
  submitError = '';

  constructor(
    private fb: FormBuilder,
    private leaveService: LeaveService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.buildForm();
    this.leaveService.getLeaveTypes().subscribe({
      next: types => this.leaveTypes = types.filter(t => t.isActive),
      error: () => {}
    });
    this.leaveService.getLeaveBalances().subscribe({
      next: balances => this.balances = balances,
      error: () => {}
    });
  }

  private buildForm(): void {
    this.form = this.fb.group({
      leaveTypeId: ['', Validators.required],
      startDate: ['', Validators.required],
      endDate: ['', Validators.required],
      sessionType: [null as SessionType | null],
      durationInHours: [null as number | null],
      reason: ['', Validators.required]
    }, { validators: endDateAfterStartDate });
  }

  setDurationType(type: LeaveDurationType): void {
    this.durationType = type;
    const endDate = this.form.get('endDate')!;
    const sessionType = this.form.get('sessionType')!;
    const durationInHours = this.form.get('durationInHours')!;

    // Reset conditional fields
    sessionType.clearValidators();
    sessionType.setValue(null);
    durationInHours.clearValidators();
    durationInHours.setValue(null);

    if (type === 'FULL_DAY') {
      endDate.setValidators(Validators.required);
    } else {
      endDate.clearValidators();
      endDate.setValue('');
    }

    if (type === 'HALF_DAY') {
      sessionType.setValidators(Validators.required);
    }

    if (type === 'HOURLY') {
      durationInHours.setValidators([
        Validators.required,
        Validators.min(0.5),
        Validators.max(8)
      ]);
    }

    endDate.updateValueAndValidity();
    sessionType.updateValueAndValidity();
    durationInHours.updateValueAndValidity();
  }

  onLeaveTypeChange(): void {
    const id = Number(this.form.get('leaveTypeId')?.value);
    this.selectedBalance = this.balances.find(b => b.leaveTypeId === id) ?? null;
  }

  isInvalid(field: string): boolean {
    const ctrl = this.form.get(field);
    return !!(ctrl && ctrl.invalid && (ctrl.dirty || ctrl.touched));
  }

  onSubmit(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;

    const v = this.form.value;
    const dto = {
      leaveTypeId: Number(v.leaveTypeId),
      startDate: v.startDate,
      endDate: this.durationType === 'FULL_DAY' ? v.endDate : v.startDate,
      durationType: this.durationType,
      ...(this.durationType === 'HALF_DAY' && { sessionType: v.sessionType }),
      ...(this.durationType === 'HOURLY' && { durationInHours: Number(v.durationInHours) }),
      reason: v.reason
    };

    this.submitting = true;
    this.submitError = '';

    this.leaveService.submitLeaveRequest(dto).subscribe({
      next: () => this.router.navigate(['/leave-requests']),
      error: (err) => {
        this.submitting = false;
        this.submitError = err?.error?.message ?? 'Failed to submit request. Please try again.';
      }
    });
  }
}
