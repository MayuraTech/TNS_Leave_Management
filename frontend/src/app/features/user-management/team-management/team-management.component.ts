import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { UserService, Department, Team } from '../../../core/services/user.service';
import { User } from '../../../core/models/user.model';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
  selector: 'app-team-management',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  template: `
    <div class="page-container">
      <div class="page-header">
        <h1>Team Management</h1>
        <button class="btn-primary" (click)="toggleCreateForm()">
          {{ showCreateForm ? 'Cancel' : '+ New Team' }}
        </button>
      </div>

      <!-- Create Form -->
      <div *ngIf="showCreateForm" class="form-card">
        <h2 class="form-title">Create Team</h2>
        <form [formGroup]="createForm" (ngSubmit)="onCreate()" novalidate>
          <div class="form-row">
            <div class="form-group">
              <label for="createName">Name <span class="required">*</span></label>
              <input id="createName" type="text" formControlName="name"
                [class.input-error]="isInvalid(createForm, 'name')" placeholder="Team name" />
              <span *ngIf="isInvalid(createForm, 'name')" class="field-error">Name is required.</span>
            </div>
            <div class="form-group">
              <label for="createDept">Department <span class="required">*</span></label>
              <select id="createDept" formControlName="departmentId" class="form-select"
                [class.input-error]="isInvalid(createForm, 'departmentId')">
                <option value="">— Select Department —</option>
                <option *ngFor="let dept of departments" [value]="dept.id">{{ dept.name }}</option>
              </select>
              <span *ngIf="isInvalid(createForm, 'departmentId')" class="field-error">Department is required.</span>
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label for="createManager">Manager</label>
              <select id="createManager" formControlName="managerId" class="form-select">
                <option value="">— Select Manager —</option>
                <option *ngFor="let mgr of managers" [value]="mgr.id">
                  {{ mgr.firstName }} {{ mgr.lastName }} ({{ mgr.username }})
                </option>
              </select>
            </div>
          </div>
          <div *ngIf="createError" class="alert-error">{{ createError }}</div>
          <div class="form-actions">
            <button type="button" class="btn-secondary" (click)="toggleCreateForm()">Cancel</button>
            <button type="submit" class="btn-primary" [disabled]="isCreating">
              {{ isCreating ? 'Creating...' : 'Create' }}
            </button>
          </div>
        </form>
      </div>

      <!-- Loading -->
      <div *ngIf="isLoading" class="loading-state">Loading teams...</div>

      <!-- Error -->
      <div *ngIf="errorMessage" class="alert-error">{{ errorMessage }}</div>

      <!-- Table -->
      <div *ngIf="!isLoading" class="table-wrapper">
        <table class="data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Department</th>
              <th>Manager</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <ng-container *ngFor="let team of teams">
              <!-- Edit row -->
              <tr *ngIf="editingId === team.id">
                <td colspan="4" class="edit-cell">
                  <form [formGroup]="editForm" (ngSubmit)="onUpdate(team.id)" novalidate class="inline-form">
                    <div class="form-row">
                      <div class="form-group">
                        <input type="text" formControlName="name"
                          [class.input-error]="isInvalid(editForm, 'name')" placeholder="Team name" />
                        <span *ngIf="isInvalid(editForm, 'name')" class="field-error">Name is required.</span>
                      </div>
                      <div class="form-group">
                        <select formControlName="departmentId" class="form-select"
                          [class.input-error]="isInvalid(editForm, 'departmentId')">
                          <option value="">— Select Department —</option>
                          <option *ngFor="let dept of departments" [value]="dept.id">{{ dept.name }}</option>
                        </select>
                        <span *ngIf="isInvalid(editForm, 'departmentId')" class="field-error">Department is required.</span>
                      </div>
                    </div>
                    <div class="form-row">
                      <div class="form-group">
                        <select formControlName="managerId" class="form-select">
                          <option value="">— Select Manager —</option>
                          <option *ngFor="let mgr of managers" [value]="mgr.id">
                            {{ mgr.firstName }} {{ mgr.lastName }} ({{ mgr.username }})
                          </option>
                        </select>
                      </div>
                    </div>
                    <div *ngIf="editError" class="alert-error">{{ editError }}</div>
                    <div class="form-actions">
                      <button type="button" class="btn-secondary" (click)="cancelEdit()">Cancel</button>
                      <button type="submit" class="btn-primary" [disabled]="isSaving">
                        {{ isSaving ? 'Saving...' : 'Save' }}
                      </button>
                    </div>
                  </form>
                </td>
              </tr>
              <!-- Normal row -->
              <tr *ngIf="editingId !== team.id">
                <td>{{ team.name }}</td>
                <td>{{ team.departmentName || getDepartmentName(team.departmentId) }}</td>
                <td>{{ team.managerName || '—' }}</td>
                <td class="actions-cell">
                  <button class="btn-edit" (click)="startEdit(team)">✏ Edit</button>
                  <button class="btn-delete" (click)="onDelete(team)">🗑 Delete</button>
                </td>
              </tr>
            </ng-container>
            <tr *ngIf="teams.length === 0">
              <td colspan="4" class="empty-state">No teams found.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `,
  styles: [`
    .page-container { padding: 1.5rem 2rem; max-width: 1000px; margin: 0 auto; }

    .page-header {
      display: flex; align-items: center; justify-content: space-between;
      margin-bottom: 1.5rem;
    }
    .page-header h1 { font-size: 1.5rem; font-weight: 700; color: #1a1a2e; margin: 0; }

    .btn-primary {
      background: #4f46e5; color: #fff; padding: 0.5rem 1.25rem;
      border: none; border-radius: 6px; font-size: 0.9rem; font-weight: 600;
      cursor: pointer; transition: background 0.15s;
    }
    .btn-primary:hover:not(:disabled) { background: #4338ca; }
    .btn-primary:disabled { background: #a5b4fc; cursor: not-allowed; }

    .btn-secondary {
      background: #fff; color: #374151; padding: 0.5rem 1.25rem;
      border: 1px solid #d1d5db; border-radius: 6px; font-size: 0.9rem;
      font-weight: 600; cursor: pointer; transition: background 0.15s;
    }
    .btn-secondary:hover { background: #f9fafb; }

    .form-card {
      background: #fff; border-radius: 8px;
      box-shadow: 0 1px 4px rgba(0,0,0,0.08); padding: 1.5rem;
      margin-bottom: 1.5rem;
    }
    .form-title { font-size: 1rem; font-weight: 600; color: #374151; margin: 0 0 1rem; }

    .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 0.75rem; }
    @media (max-width: 600px) { .form-row { grid-template-columns: 1fr; } }

    .form-group { display: flex; flex-direction: column; gap: 0.3rem; }
    label { font-size: 0.875rem; font-weight: 500; color: #374151; }
    .required { color: #ef4444; }

    input[type="text"], .form-select {
      padding: 0.55rem 0.75rem; border: 1px solid #d1d5db;
      border-radius: 6px; font-size: 0.9rem; outline: none;
      transition: border-color 0.15s; background: #fff;
    }
    input[type="text"]:focus, .form-select:focus {
      border-color: #4f46e5; box-shadow: 0 0 0 3px rgba(79,70,229,0.1);
    }
    .input-error { border-color: #ef4444 !important; }
    .field-error { font-size: 0.8rem; color: #ef4444; }

    .form-actions { display: flex; justify-content: flex-end; gap: 0.75rem; margin-top: 0.75rem; }

    .alert-error {
      background: #fef2f2; border: 1px solid #fca5a5; color: #b91c1c;
      padding: 0.65rem 1rem; border-radius: 6px; margin-bottom: 0.75rem;
      font-size: 0.875rem;
    }

    .loading-state { text-align: center; padding: 2rem; color: #6b7280; }

    .table-wrapper { overflow-x: auto; border-radius: 8px; box-shadow: 0 1px 4px rgba(0,0,0,0.08); }
    .data-table { width: 100%; border-collapse: collapse; background: #fff; }
    .data-table th {
      background: #f9fafb; padding: 0.75rem 1rem; text-align: left;
      font-size: 0.8rem; font-weight: 600; color: #6b7280; text-transform: uppercase;
      border-bottom: 1px solid #e5e7eb;
    }
    .data-table td {
      padding: 0.875rem 1rem; border-bottom: 1px solid #f3f4f6;
      font-size: 0.9rem; color: #374151;
    }
    .data-table tr:last-child td { border-bottom: none; }
    .data-table tr:hover td { background: #f9fafb; }

    .edit-cell { padding: 1rem !important; background: #f5f3ff; }
    .inline-form .form-row { margin-bottom: 0; }

    .actions-cell { display: flex; gap: 0.5rem; align-items: center; }

    .btn-edit {
      display: inline-flex; align-items: center; gap: 4px;
      padding: 5px 12px; border-radius: 6px; font-size: 0.8rem; font-weight: 600;
      cursor: pointer; transition: all 150ms ease;
      background: var(--color-bg-indigo-light, #d6ddf9);
      color: var(--color-primary-800, #3f476e);
      border: 1px solid var(--color-bg-blue-lighter, #b3c3e6);
      &:hover { background: var(--color-bg-blue-lighter, #b3c3e6); transform: translateY(-1px); }
      &:active { transform: scale(0.97); }
    }

    .btn-delete {
      display: inline-flex; align-items: center; gap: 4px;
      padding: 5px 12px; border-radius: 6px; font-size: 0.8rem; font-weight: 600;
      cursor: pointer; transition: all 150ms ease;
      background: var(--color-bg-red-light, #fee2e2);
      color: var(--color-danger-900, #b70024);
      border: 1px solid rgba(220, 38, 38, 0.25);
      &:hover { background: #fecaca; border-color: rgba(220, 38, 38, 0.5); transform: translateY(-1px); }
      &:active { transform: scale(0.97); }
    }

    .empty-state { text-align: center; color: #9ca3af; padding: 2rem; }
  `]
})
export class TeamManagementComponent implements OnInit, OnDestroy {
  teams: Team[] = [];
  departments: Department[] = [];
  managers: User[] = [];
  isLoading = false;
  errorMessage = '';

  showCreateForm = false;
  isCreating = false;
  createError = '';
  createForm: FormGroup;

  editingId: number | null = null;
  isSaving = false;
  editError = '';
  editForm: FormGroup;

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private userService: UserService,
    private notificationService: NotificationService
  ) {
    this.createForm = this.fb.group({
      name: ['', Validators.required],
      departmentId: ['', Validators.required],
      managerId: ['']
    });
    this.editForm = this.fb.group({
      name: ['', Validators.required],
      departmentId: ['', Validators.required],
      managerId: ['']
    });
  }

  ngOnInit(): void {
    this.loadTeams();
    this.loadDepartments();
    this.loadManagers();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadTeams(): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.userService.getTeams().pipe(takeUntil(this.destroy$)).subscribe({
      next: (teams) => {
        this.teams = teams;
        this.isLoading = false;
      },
      error: () => {
        this.errorMessage = 'Failed to load teams. Please try again.';
        this.isLoading = false;
      }
    });
  }

  loadDepartments(): void {
    this.userService.getDepartments().pipe(takeUntil(this.destroy$)).subscribe({
      next: (depts) => { this.departments = depts; },
      error: () => { /* non-critical */ }
    });
  }

  loadManagers(): void {
    this.userService.getManagers().pipe(takeUntil(this.destroy$)).subscribe({
      next: (users) => { this.managers = users; },
      error: () => { /* non-critical */ }
    });
  }

  getDepartmentName(departmentId: number): string {
    return this.departments.find(d => d.id === departmentId)?.name ?? '—';
  }

  toggleCreateForm(): void {
    this.showCreateForm = !this.showCreateForm;
    if (!this.showCreateForm) {
      this.createForm.reset();
      this.createError = '';
    }
  }

  onCreate(): void {
    this.createForm.markAllAsTouched();
    if (this.createForm.invalid) return;

    this.isCreating = true;
    this.createError = '';
    const { name, departmentId, managerId } = this.createForm.value;

    this.userService.createTeam({
      name,
      departmentId: Number(departmentId),
      managerId: managerId ? Number(managerId) : undefined
    }).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        this.isCreating = false;
        this.showCreateForm = false;
        this.createForm.reset();
        this.notificationService.success(`Team "${name}" created successfully.`);
        this.loadTeams();
      },
      error: (err) => {
        this.isCreating = false;
        this.createError = err?.error?.message ?? 'Failed to create team. Please try again.';
      }
    });
  }

  startEdit(team: Team): void {
    this.editingId = team.id;
    this.editError = '';
    this.editForm.setValue({
      name: team.name,
      departmentId: team.departmentId,
      managerId: team.managerId ?? ''
    });
  }

  cancelEdit(): void {
    this.editingId = null;
    this.editError = '';
    this.editForm.reset();
  }

  onUpdate(id: number): void {
    this.editForm.markAllAsTouched();
    if (this.editForm.invalid) return;

    this.isSaving = true;
    this.editError = '';
    const { name, departmentId, managerId } = this.editForm.value;

    this.userService.updateTeam(id, {
      name,
      departmentId: Number(departmentId),
      managerId: managerId ? Number(managerId) : undefined
    }).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        this.isSaving = false;
        this.editingId = null;
        this.notificationService.success(`Team "${name}" updated successfully.`);
        this.loadTeams();
      },
      error: (err) => {
        this.isSaving = false;
        this.editError = err?.error?.message ?? 'Failed to update team. Please try again.';
      }
    });
  }

  onDelete(team: Team): void {
    if (!window.confirm(`Delete team "${team.name}"? This action cannot be undone.`)) return;

    this.userService.deleteTeam(team.id).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        this.notificationService.success(`Team "${team.name}" deleted.`);
        this.loadTeams();
      },
      error: (err) => {
        this.notificationService.error(err?.error?.message ?? 'Failed to delete team.');
      }
    });
  }

  isInvalid(form: FormGroup, field: string): boolean {
    const ctrl = form.get(field);
    return !!(ctrl && ctrl.invalid && (ctrl.dirty || ctrl.touched));
  }
}
