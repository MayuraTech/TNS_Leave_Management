import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { UserService, Department } from '../../../core/services/user.service';
import { User, UserRole } from '../../../core/models/user.model';
import { NotificationService } from '../../../core/services/notification.service';

const ALL_ROLES: UserRole[] = ['EMPLOYEE', 'MANAGER', 'ADMINISTRATOR'];

@Component({
  selector: 'app-user-create',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  template: `
    <div class="page-container">
      <div class="page-header">
        <a routerLink="/admin/users/users" class="back-link">&larr; Back to Users</a>
        <h1>Create New User</h1>
      </div>

      <div class="form-card">
        <form [formGroup]="createForm" (ngSubmit)="onSubmit()" novalidate>

          <!-- Account Info -->
          <fieldset class="form-section">
            <legend>Account Information</legend>
            <div class="form-row">
              <div class="form-group">
                <label for="username">Username <span class="required">*</span></label>
                <input id="username" type="text" formControlName="username"
                  [class.input-error]="isInvalid('username')" placeholder="e.g. jdoe" />
                <span *ngIf="isInvalid('username')" class="field-error">
                  <ng-container *ngIf="createForm.get('username')?.errors?.['required']">Username is required.</ng-container>
                  <ng-container *ngIf="createForm.get('username')?.errors?.['minlength']">Minimum 3 characters.</ng-container>
                </span>
              </div>
              <div class="form-group">
                <label for="email">Email <span class="required">*</span></label>
                <input id="email" type="email" formControlName="email"
                  [class.input-error]="isInvalid('email')" placeholder="e.g. jdoe@company.com" />
                <span *ngIf="isInvalid('email')" class="field-error">
                  <ng-container *ngIf="createForm.get('email')?.errors?.['required']">Email is required.</ng-container>
                  <ng-container *ngIf="createForm.get('email')?.errors?.['email']">Enter a valid email address.</ng-container>
                </span>
              </div>
            </div>
          </fieldset>

          <!-- Personal Info -->
          <fieldset class="form-section">
            <legend>Personal Information</legend>
            <div class="form-row">
              <div class="form-group">
                <label for="firstName">First Name <span class="required">*</span></label>
                <input id="firstName" type="text" formControlName="firstName"
                  [class.input-error]="isInvalid('firstName')" placeholder="First name" />
                <span *ngIf="isInvalid('firstName')" class="field-error">First name is required.</span>
              </div>
              <div class="form-group">
                <label for="lastName">Last Name <span class="required">*</span></label>
                <input id="lastName" type="text" formControlName="lastName"
                  [class.input-error]="isInvalid('lastName')" placeholder="Last name" />
                <span *ngIf="isInvalid('lastName')" class="field-error">Last name is required.</span>
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label for="phone">Phone</label>
                <input id="phone" type="text" formControlName="phone" placeholder="Optional" />
              </div>
              <div class="form-group">
                <label for="emergencyContact">Emergency Contact</label>
                <input id="emergencyContact" type="text" formControlName="emergencyContact" placeholder="Optional" />
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label for="address">Address</label>
                <input id="address" type="text" formControlName="address" placeholder="Optional" />
              </div>
            </div>
          </fieldset>

          <!-- Roles -->
          <fieldset class="form-section">
            <legend>Roles <span class="required">*</span></legend>
            <div class="roles-group">
              <label *ngFor="let role of allRoles" class="checkbox-label">
                <input type="checkbox" [value]="role" (change)="onRoleChange($event)" [checked]="isRoleSelected(role)" />
                <span class="role-badge role-{{ role.toLowerCase() }}">{{ role }}</span>
              </label>
            </div>
            <span *ngIf="rolesError" class="field-error">At least one role is required.</span>
          </fieldset>

          <!-- Org Info -->
          <fieldset class="form-section">
            <legend>Organisation</legend>
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
                  <option value="">— Select Manager —</option>
                  <option *ngFor="let mgr of managers" [value]="mgr.id">
                    {{ mgr.firstName }} {{ mgr.lastName }} ({{ mgr.username }})
                  </option>
                </select>
              </div>
            </div>
          </fieldset>

          <!-- Error banner -->
          <div *ngIf="errorMessage" class="alert-error">{{ errorMessage }}</div>

          <!-- Actions -->
          <div class="form-actions">
            <a routerLink="/admin/users/users" class="btn-secondary">Cancel</a>
            <button type="submit" class="btn-primary" [disabled]="isLoading">
              {{ isLoading ? 'Creating...' : 'Create User' }}
            </button>
          </div>

        </form>
      </div>
    </div>
  `,
  styles: [`
    .page-container { padding: 1.5rem 2rem; max-width: 800px; margin: 0 auto; }

    .page-header { margin-bottom: 1.5rem; }
    .back-link {
      display: inline-flex; align-items: center; gap: 6px;
      padding: 6px 14px; border-radius: 7px; font-size: 0.85rem; font-weight: 600;
      text-decoration: none; transition: all 150ms ease;
      background: var(--color-bg-indigo-light, #d6ddf9);
      color: var(--color-primary-800, #3f476e);
      border: 1px solid var(--color-bg-blue-lighter, #b3c3e6);
    }
    .back-link:hover { background: var(--color-bg-blue-lighter, #b3c3e6); transform: translateY(-1px); text-decoration: none; }
    .page-header h1 { font-size: 1.5rem; font-weight: 700; color: #1a1a2e; margin: 0.5rem 0 0; }

    .form-card {
      background: #fff; border-radius: 8px;
      box-shadow: 0 1px 4px rgba(0,0,0,0.08); padding: 2rem;
    }

    .form-section {
      border: none; padding: 0; margin: 0 0 1.75rem;
    }
    .form-section legend {
      font-size: 0.95rem; font-weight: 600; color: #374151;
      padding-bottom: 0.5rem; border-bottom: 1px solid #e5e7eb;
      width: 100%; margin-bottom: 1rem;
    }

    .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
    @media (max-width: 600px) { .form-row { grid-template-columns: 1fr; } }

    .form-group { display: flex; flex-direction: column; gap: 0.375rem; }
    label { font-size: 0.875rem; font-weight: 500; color: #374151; }
    .required { color: #ef4444; }

    input[type="text"], input[type="email"], .form-select {
      padding: 0.6rem 0.75rem; border: 1px solid #d1d5db;
      border-radius: 6px; font-size: 0.9rem; outline: none;
      transition: border-color 0.15s;
    }
    input:focus, .form-select:focus {
      border-color: #4f46e5; box-shadow: 0 0 0 3px rgba(79,70,229,0.1);
    }
    .input-error { border-color: #ef4444 !important; }
    .field-error { font-size: 0.8rem; color: #ef4444; }

    .roles-group { display: flex; gap: 1rem; flex-wrap: wrap; }
    .checkbox-label {
      display: flex; align-items: center; gap: 0.5rem; cursor: pointer;
    }
    .checkbox-label input[type="checkbox"] { width: 16px; height: 16px; cursor: pointer; }

    .role-badge {
      display: inline-block; padding: 0.25rem 0.6rem; border-radius: 4px;
      font-size: 0.8rem; font-weight: 600;
    }
    .role-employee { background: #dbeafe; color: #1d4ed8; }
    .role-manager { background: #d1fae5; color: #065f46; }
    .role-administrator { background: #ede9fe; color: #5b21b6; }

    .alert-error {
      background: #fef2f2; border: 1px solid #fca5a5; color: #b91c1c;
      padding: 0.75rem 1rem; border-radius: 6px; margin-bottom: 1rem;
      font-size: 0.875rem;
    }

    .form-actions { display: flex; justify-content: flex-end; gap: 0.75rem; margin-top: 0.5rem; }

    .btn-primary {
      background: #4f46e5; color: #fff; padding: 0.6rem 1.5rem;
      border: none; border-radius: 6px; font-size: 0.9rem; font-weight: 600;
      cursor: pointer; transition: background 0.15s;
    }
    .btn-primary:hover:not(:disabled) { background: #4338ca; }
    .btn-primary:disabled { background: #a5b4fc; cursor: not-allowed; }

    .btn-secondary {
      background: #fff; color: #374151; padding: 0.6rem 1.5rem;
      border: 1px solid #d1d5db; border-radius: 6px; font-size: 0.9rem;
      font-weight: 600; text-decoration: none; cursor: pointer;
      transition: background 0.15s;
    }
    .btn-secondary:hover { background: #f9fafb; }
  `]
})
export class UserCreateComponent implements OnInit, OnDestroy {
  createForm: FormGroup;
  departments: Department[] = [];
  managers: User[] = [];
  selectedRoles: UserRole[] = [];
  allRoles = ALL_ROLES;
  isLoading = false;
  errorMessage = '';
  rolesError = false;

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private userService: UserService,
    private notificationService: NotificationService,
    private router: Router
  ) {
    this.createForm = this.fb.group({
      username: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      phone: [''],
      emergencyContact: [''],
      address: [''],
      departmentId: [''],
      managerId: ['']
    });
  }

  ngOnInit(): void {
    this.userService.getDepartments().pipe(takeUntil(this.destroy$)).subscribe({
      next: (depts) => { this.departments = depts; },
      error: () => { /* non-critical */ }
    });

    this.userService.getManagers().pipe(takeUntil(this.destroy$)).subscribe({
      next: (users) => { this.managers = users; },
      error: () => { /* non-critical */ }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  isInvalid(field: string): boolean {
    const ctrl = this.createForm.get(field);
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

  onSubmit(): void {
    this.createForm.markAllAsTouched();
    this.rolesError = this.selectedRoles.length === 0;

    if (this.createForm.invalid || this.rolesError) return;

    this.isLoading = true;
    this.errorMessage = '';

    const { username, email, firstName, lastName, phone, emergencyContact, address, departmentId, managerId } = this.createForm.value;

    this.userService.createUser({
      username,
      email,
      firstName,
      lastName,
      phone: phone || undefined,
      emergencyContact: emergencyContact || undefined,
      address: address || undefined,
      roles: this.selectedRoles,
      departmentId: departmentId ? Number(departmentId) : undefined,
      managerId: managerId ? Number(managerId) : undefined
    }).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        this.isLoading = false;
        this.notificationService.success(`User "${username}" created successfully.`);
        this.router.navigate(['/admin/users/users']);
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err?.error?.message ?? 'Failed to create user. Please try again.';
      }
    });
  }
}
