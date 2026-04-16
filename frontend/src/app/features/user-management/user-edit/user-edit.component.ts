import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Subject, forkJoin, takeUntil } from 'rxjs';
import { UserService, Department } from '../../../core/services/user.service';
import { User, UserRole } from '../../../core/models/user.model';
import { NotificationService } from '../../../core/services/notification.service';
import { UserBalanceAdjustmentComponent } from '../user-balance-adjustment/user-balance-adjustment.component';

const ALL_ROLES: UserRole[] = ['EMPLOYEE', 'MANAGER', 'ADMINISTRATOR'];

function passwordMatchValidator(group: AbstractControl): ValidationErrors | null {
  const pw = group.get('newPassword')?.value;
  const confirm = group.get('confirmPassword')?.value;
  return pw && confirm && pw !== confirm ? { passwordMismatch: true } : null;
}

@Component({
  selector: 'app-user-edit',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, UserBalanceAdjustmentComponent],
  template: `
    <div class="page-container">
      <div class="page-header">
        <a routerLink="/admin/users/users" class="back-link">&larr; Back to Users</a>
        <h1>Edit User</h1>
      </div>

      <div *ngIf="isLoadingUser" class="loading-state">Loading user...</div>
      <div *ngIf="loadError" class="alert-error">{{ loadError }}</div>

      <ng-container *ngIf="!isLoadingUser && !loadError && user">

        <!-- Profile Section -->
        <div class="form-card">
          <h2 class="section-title">Profile Information</h2>
          <form [formGroup]="profileForm" (ngSubmit)="saveProfile()" novalidate>

            <div class="form-row">
              <div class="form-group">
                <label for="firstName">First Name <span class="required">*</span></label>
                <input id="firstName" type="text" formControlName="firstName"
                  [class.input-error]="isInvalid(profileForm, 'firstName')" />
                <span *ngIf="isInvalid(profileForm, 'firstName')" class="field-error">First name is required.</span>
              </div>
              <div class="form-group">
                <label for="lastName">Last Name <span class="required">*</span></label>
                <input id="lastName" type="text" formControlName="lastName"
                  [class.input-error]="isInvalid(profileForm, 'lastName')" />
                <span *ngIf="isInvalid(profileForm, 'lastName')" class="field-error">Last name is required.</span>
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label for="email">Email <span class="required">*</span></label>
                <input id="email" type="email" formControlName="email"
                  [class.input-error]="isInvalid(profileForm, 'email')" />
                <span *ngIf="isInvalid(profileForm, 'email')" class="field-error">
                  <ng-container *ngIf="profileForm.get('email')?.errors?.['required']">Email is required.</ng-container>
                  <ng-container *ngIf="profileForm.get('email')?.errors?.['email']">Enter a valid email.</ng-container>
                </span>
              </div>
              <div class="form-group">
                <label for="phone">Phone</label>
                <input id="phone" type="text" formControlName="phone" placeholder="Optional" />
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label for="emergencyContact">Emergency Contact</label>
                <input id="emergencyContact" type="text" formControlName="emergencyContact" placeholder="Optional" />
              </div>
              <div class="form-group">
                <label for="address">Address</label>
                <input id="address" type="text" formControlName="address" placeholder="Optional" />
              </div>
            </div>

            <div *ngIf="profileError" class="alert-error">{{ profileError }}</div>

            <div class="form-actions">
              <button type="submit" class="btn-primary" [disabled]="isSavingProfile">
                {{ isSavingProfile ? 'Saving...' : 'Save Profile' }}
              </button>
            </div>
          </form>
        </div>

        <!-- Roles & Organisation Section -->
        <div class="form-card">
          <h2 class="section-title">Roles &amp; Organisation</h2>
          <form [formGroup]="rolesForm" (ngSubmit)="saveRoles()" novalidate>

            <fieldset class="form-section">
              <legend>Roles <span class="required">*</span></legend>
              <div class="roles-group">
                <label *ngFor="let role of allRoles" class="checkbox-label">
                  <input type="checkbox" [value]="role"
                    (change)="onRoleChange($event)"
                    [checked]="isRoleSelected(role)" />
                  <span class="role-badge role-{{ role.toLowerCase() }}">{{ role }}</span>
                </label>
              </div>
              <span *ngIf="rolesError" class="field-error">At least one role is required.</span>
            </fieldset>

            <div class="form-row">
              <div class="form-group">
                <label for="departmentId">Department</label>
                <select id="departmentId" formControlName="departmentId" class="form-select">
                  <option value="">— Select Department —</option>
                  <option *ngFor="let dept of departments" [value]="dept.id">{{ dept.name }}</option>
                </select>
              </div>
              <div class="form-group">
                <label for="managerId">Manager</label>
                <select id="managerId" formControlName="managerId" class="form-select">
                  <option value="">— No Manager —</option>
                  <option *ngFor="let mgr of managers" [value]="mgr.id">
                    {{ mgr.firstName }} {{ mgr.lastName }} ({{ mgr.username }})
                  </option>
                </select>
              </div>
            </div>

            <div *ngIf="rolesOrgError" class="alert-error">{{ rolesOrgError }}</div>

            <div class="form-actions">
              <button type="submit" class="btn-primary" [disabled]="isSavingRoles">
                {{ isSavingRoles ? 'Saving...' : 'Save Roles & Organisation' }}
              </button>
            </div>
          </form>
        </div>

        <!-- Account Status Section -->
        <div class="form-card">
          <h2 class="section-title">Account Status</h2>
          <div class="status-row">
            <div class="status-info">
              <span class="status-badge" [class.active]="user.isActive" [class.inactive]="!user.isActive">
                {{ user.isActive ? 'Active' : 'Inactive' }}
              </span>
              <span class="status-desc">
                {{ user.isActive
                  ? 'This account is active. The user can log in and use the system.'
                  : 'This account is deactivated. The user cannot log in.' }}
              </span>
            </div>
            <button
              class="btn-status"
              [class.btn-deactivate]="user.isActive"
              [class.btn-activate]="!user.isActive"
              [disabled]="isTogglingStatus"
              (click)="toggleStatus()">
              {{ isTogglingStatus ? 'Updating...' : (user.isActive ? 'Deactivate Account' : 'Activate Account') }}
            </button>
          </div>
          <div *ngIf="statusError" class="alert-error">{{ statusError }}</div>
        </div>

        <!-- Reset Password Section -->
        <div class="form-card">
          <h2 class="section-title">Reset Password</h2>
          <form [formGroup]="passwordForm" (ngSubmit)="resetPassword()" novalidate>

            <div class="form-row">
              <div class="form-group">
                <label for="newPassword">New Password <span class="required">*</span></label>
                <input id="newPassword" type="password" formControlName="newPassword"
                  [class.input-error]="isInvalid(passwordForm, 'newPassword')" />
                <span *ngIf="isInvalid(passwordForm, 'newPassword')" class="field-error">
                  <ng-container *ngIf="passwordForm.get('newPassword')?.errors?.['required']">Password is required.</ng-container>
                  <ng-container *ngIf="passwordForm.get('newPassword')?.errors?.['minlength']">Minimum 8 characters.</ng-container>
                </span>
              </div>
              <div class="form-group">
                <label for="confirmPassword">Confirm Password <span class="required">*</span></label>
                <input id="confirmPassword" type="password" formControlName="confirmPassword"
                  [class.input-error]="isInvalid(passwordForm, 'confirmPassword') || (passwordForm.errors?.['passwordMismatch'] && passwordForm.get('confirmPassword')?.touched)" />
                <span *ngIf="passwordForm.errors?.['passwordMismatch'] && passwordForm.get('confirmPassword')?.touched" class="field-error">
                  Passwords do not match.
                </span>
              </div>
            </div>

            <div *ngIf="passwordError" class="alert-error">{{ passwordError }}</div>

            <div class="form-actions">
              <button type="submit" class="btn-primary" [disabled]="isResettingPassword">
                {{ isResettingPassword ? 'Resetting...' : 'Reset Password' }}
              </button>
            </div>
          </form>
        </div>

        <!-- Leave Balance Adjustment Section -->
        <app-user-balance-adjustment [userId]="userId"></app-user-balance-adjustment>

      </ng-container>
    </div>
  `,
  styles: [`
    .page-container { padding: 1.5rem 2rem; max-width: 800px; margin: 0 auto; }

    .page-header { margin-bottom: 1.5rem; }
    .back-link { color: #4f46e5; text-decoration: none; font-size: 0.875rem; }
    .back-link:hover { text-decoration: underline; }
    .page-header h1 { font-size: 1.5rem; font-weight: 700; color: #1a1a2e; margin: 0.5rem 0 0; }

    .form-card {
      background: #fff; border-radius: 8px;
      box-shadow: 0 1px 4px rgba(0,0,0,0.08); padding: 2rem;
      margin-bottom: 1.5rem;
    }

    .section-title {
      font-size: 1rem; font-weight: 700; color: #1a1a2e;
      margin: 0 0 1.25rem; padding-bottom: 0.75rem;
      border-bottom: 1px solid #e5e7eb;
    }

    .form-section { border: none; padding: 0; margin: 0 0 1.25rem; }
    .form-section legend {
      font-size: 0.875rem; font-weight: 600; color: #374151;
      padding-bottom: 0.5rem; width: 100%; margin-bottom: 0.75rem;
    }

    .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem; }
    @media (max-width: 600px) { .form-row { grid-template-columns: 1fr; } }

    .form-group { display: flex; flex-direction: column; gap: 0.375rem; }
    label { font-size: 0.875rem; font-weight: 500; color: #374151; }
    .required { color: #ef4444; }

    input[type="text"], input[type="email"], input[type="password"], .form-select {
      padding: 0.6rem 0.75rem; border: 1px solid #d1d5db;
      border-radius: 6px; font-size: 0.9rem; outline: none;
      transition: border-color 0.15s;
    }
    input:focus, .form-select:focus {
      border-color: #4f46e5; box-shadow: 0 0 0 3px rgba(79,70,229,0.1);
    }
    .input-error { border-color: #ef4444 !important; }
    .field-error { font-size: 0.8rem; color: #ef4444; }

    .roles-group { display: flex; gap: 1rem; flex-wrap: wrap; margin-bottom: 0.5rem; }
    .checkbox-label { display: flex; align-items: center; gap: 0.5rem; cursor: pointer; }
    .checkbox-label input[type="checkbox"] { width: 16px; height: 16px; cursor: pointer; }

    .role-badge {
      display: inline-block; padding: 0.25rem 0.6rem; border-radius: 4px;
      font-size: 0.8rem; font-weight: 600;
    }
    .role-employee { background: #dbeafe; color: #1d4ed8; }
    .role-manager { background: #d1fae5; color: #065f46; }
    .role-administrator { background: #ede9fe; color: #5b21b6; }

    .status-row {
      display: flex; align-items: center; justify-content: space-between;
      gap: 1rem; flex-wrap: wrap;
    }
    .status-info { display: flex; align-items: center; gap: 0.75rem; }
    .status-badge {
      display: inline-block; padding: 0.25rem 0.75rem; border-radius: 12px;
      font-size: 0.85rem; font-weight: 600;
    }
    .status-badge.active { background: #d1fae5; color: #065f46; }
    .status-badge.inactive { background: #f3f4f6; color: #6b7280; }
    .status-desc { font-size: 0.875rem; color: #6b7280; }

    .btn-status {
      padding: 0.5rem 1.25rem; border-radius: 6px; font-size: 0.875rem;
      font-weight: 600; cursor: pointer; border: none; transition: background 0.15s;
    }
    .btn-deactivate { background: #fef2f2; color: #b91c1c; border: 1px solid #fca5a5; }
    .btn-deactivate:hover:not(:disabled) { background: #fee2e2; }
    .btn-activate { background: #d1fae5; color: #065f46; border: 1px solid #6ee7b7; }
    .btn-activate:hover:not(:disabled) { background: #a7f3d0; }
    .btn-status:disabled { opacity: 0.5; cursor: not-allowed; }

    .alert-error {
      background: #fef2f2; border: 1px solid #fca5a5; color: #b91c1c;
      padding: 0.75rem 1rem; border-radius: 6px; margin-top: 0.75rem;
      font-size: 0.875rem;
    }

    .form-actions { display: flex; justify-content: flex-end; margin-top: 0.5rem; }

    .btn-primary {
      background: #4f46e5; color: #fff; padding: 0.6rem 1.5rem;
      border: none; border-radius: 6px; font-size: 0.9rem; font-weight: 600;
      cursor: pointer; transition: background 0.15s;
    }
    .btn-primary:hover:not(:disabled) { background: #4338ca; }
    .btn-primary:disabled { background: #a5b4fc; cursor: not-allowed; }

    .loading-state { text-align: center; padding: 3rem; color: #6b7280; }
  `]
})
export class UserEditComponent implements OnInit, OnDestroy {
  user: User | null = null;
  departments: Department[] = [];
  managers: User[] = [];
  allRoles = ALL_ROLES;
  selectedRoles: UserRole[] = [];

  profileForm: FormGroup;
  rolesForm: FormGroup;
  passwordForm: FormGroup;

  isLoadingUser = false;
  loadError = '';

  isSavingProfile = false;
  profileError = '';

  isSavingRoles = false;
  rolesError = false;
  rolesOrgError = '';

  isTogglingStatus = false;
  statusError = '';

  isResettingPassword = false;
  passwordError = '';

  userId!: number;
  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private userService: UserService,
    private notificationService: NotificationService
  ) {
    this.profileForm = this.fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phone: [''],
      emergencyContact: [''],
      address: ['']
    });

    this.rolesForm = this.fb.group({
      departmentId: [''],
      managerId: ['']
    });

    this.passwordForm = this.fb.group({
      newPassword: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', Validators.required]
    }, { validators: passwordMatchValidator });
  }

  ngOnInit(): void {
    this.userId = Number(this.route.snapshot.paramMap.get('id'));

    this.isLoadingUser = true;
    forkJoin({
      user: this.userService.getUserById(this.userId),
      departments: this.userService.getDepartments(),
      managers: this.userService.getManagers()
    }).pipe(takeUntil(this.destroy$)).subscribe({
      next: ({ user, departments, managers }) => {
        this.user = user;
        this.departments = departments;
        this.managers = managers.filter(m => m.id !== this.userId);
        this.selectedRoles = [...user.roles];
        this.patchForms(user);
        this.isLoadingUser = false;
      },
      error: () => {
        this.loadError = 'Failed to load user. Please try again.';
        this.isLoadingUser = false;
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private patchForms(user: User): void {
    this.profileForm.patchValue({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone ?? '',
      emergencyContact: user.emergencyContact ?? '',
      address: user.address ?? ''
    });

    this.rolesForm.patchValue({
      departmentId: user.departmentId ?? '',
      managerId: user.managerId ?? ''
    });
  }

  isInvalid(form: FormGroup, field: string): boolean {
    const ctrl = form.get(field);
    return !!(ctrl && ctrl.invalid && (ctrl.dirty || ctrl.touched));
  }

  isRoleSelected(role: UserRole): boolean {
    return this.selectedRoles.includes(role);
  }

  onRoleChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const role = input.value as UserRole;
    if (input.checked) {
      this.selectedRoles = [...this.selectedRoles, role];
    } else {
      this.selectedRoles = this.selectedRoles.filter(r => r !== role);
    }
    this.rolesError = false;
  }

  saveProfile(): void {
    this.profileForm.markAllAsTouched();
    if (this.profileForm.invalid) return;

    this.isSavingProfile = true;
    this.profileError = '';
    const { firstName, lastName, email, phone, emergencyContact, address } = this.profileForm.value;

    this.userService.updateUser(this.userId, { firstName, lastName, email, phone, emergencyContact, address })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (updated) => {
          this.user = { ...this.user!, ...updated };
          this.isSavingProfile = false;
          this.notificationService.success('Profile updated successfully.');
        },
        error: (err) => {
          this.isSavingProfile = false;
          this.profileError = err?.error?.message ?? 'Failed to update profile.';
        }
      });
  }

  saveRoles(): void {
    this.rolesError = this.selectedRoles.length === 0;
    if (this.rolesError) return;

    this.isSavingRoles = true;
    this.rolesOrgError = '';
    const { departmentId, managerId } = this.rolesForm.value;

    this.userService.updateUser(this.userId, {
      roles: this.selectedRoles,
      departmentId: departmentId ? Number(departmentId) : undefined,
      managerId: managerId ? Number(managerId) : undefined
    }).pipe(takeUntil(this.destroy$)).subscribe({
      next: (updated) => {
        this.user = { ...this.user!, ...updated };
        this.isSavingRoles = false;
        this.notificationService.success('Roles and organisation updated successfully.');
      },
      error: (err) => {
        this.isSavingRoles = false;
        this.rolesOrgError = err?.error?.message ?? 'Failed to update roles.';
      }
    });
  }

  toggleStatus(): void {
    if (!this.user) return;
    this.isTogglingStatus = true;
    this.statusError = '';
    const newStatus = !this.user.isActive;

    this.userService.setUserStatus(this.userId, newStatus)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (updated) => {
          this.user = { ...this.user!, isActive: updated.isActive };
          this.isTogglingStatus = false;
          this.notificationService.success(
            `Account ${newStatus ? 'activated' : 'deactivated'} successfully.`
          );
        },
        error: (err) => {
          this.isTogglingStatus = false;
          this.statusError = err?.error?.message ?? 'Failed to update account status.';
        }
      });
  }

  resetPassword(): void {
    this.passwordForm.markAllAsTouched();
    if (this.passwordForm.invalid) return;

    this.isResettingPassword = true;
    this.passwordError = '';

    this.userService.resetPassword(this.userId, { newPassword: this.passwordForm.value.newPassword })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.isResettingPassword = false;
          this.passwordForm.reset();
          this.notificationService.success('Password reset successfully.');
        },
        error: (err) => {
          this.isResettingPassword = false;
          this.passwordError = err?.error?.message ?? 'Failed to reset password.';
        }
      });
  }
}
