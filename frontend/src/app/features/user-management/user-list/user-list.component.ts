import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Subject, debounceTime, distinctUntilChanged, takeUntil } from 'rxjs';
import { UserService, Department, PagedResponse } from '../../../core/services/user.service';
import { User } from '../../../core/models/user.model';

@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  template: `
    <div class="page-container">
      <div class="page-header">
        <h1>User Management</h1>
        <a routerLink="/admin/users/users/create" class="btn-primary">+ New User</a>
      </div>

      <!-- Filters -->
      <div class="filter-bar" [formGroup]="filterForm">
        <input
          type="text"
          formControlName="search"
          placeholder="Search by name, username or email..."
          class="search-input"
        />
        <select formControlName="departmentId" class="filter-select">
          <option value="">All Departments</option>
          <option *ngFor="let dept of departments" [value]="dept.id">{{ dept.name }}</option>
        </select>
        <select formControlName="status" class="filter-select">
          <option value="">All Statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      <!-- Loading -->
      <div *ngIf="isLoading" class="loading-state">Loading users...</div>

      <!-- Error -->
      <div *ngIf="errorMessage" class="alert-error">{{ errorMessage }}</div>

      <!-- Table -->
      <div *ngIf="!isLoading" class="table-wrapper">
        <table class="data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Username</th>
              <th>Email</th>
              <th>Roles</th>
              <th>Department</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let user of users">
              <td>{{ user.firstName }} {{ user.lastName }}</td>
              <td>{{ user.username }}</td>
              <td>{{ user.email }}</td>
              <td>
                <span *ngFor="let role of user.roles" class="role-badge role-{{ role.toLowerCase() }}">
                  {{ role }}
                </span>
              </td>
              <td>{{ getDepartmentName(user.departmentId) }}</td>
              <td>
                <span class="status-badge" [class.active]="user.isActive" [class.inactive]="!user.isActive">
                  {{ user.isActive ? 'Active' : 'Inactive' }}
                </span>
              </td>
              <td>
                <a [routerLink]="['/admin/users/users', user.id, 'edit']" class="btn-link">Edit</a>
              </td>
            </tr>
            <tr *ngIf="users.length === 0">
              <td colspan="7" class="empty-state">No users found.</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div *ngIf="totalPages > 1" class="pagination">
        <button (click)="goToPage(currentPage - 1)" [disabled]="currentPage === 0" class="page-btn">
          &laquo; Prev
        </button>
        <span class="page-info">Page {{ currentPage + 1 }} of {{ totalPages }}</span>
        <button (click)="goToPage(currentPage + 1)" [disabled]="currentPage >= totalPages - 1" class="page-btn">
          Next &raquo;
        </button>
      </div>
    </div>
  `,
  styles: [`
    .page-container { padding: 1.5rem 2rem; max-width: 1200px; margin: 0 auto; }

    .page-header {
      display: flex; align-items: center; justify-content: space-between;
      margin-bottom: 1.5rem;
    }
    .page-header h1 { font-size: 1.5rem; font-weight: 700; color: #1a1a2e; margin: 0; }

    .btn-primary {
      background: #4f46e5; color: #fff; padding: 0.5rem 1.25rem;
      border-radius: 6px; text-decoration: none; font-size: 0.9rem; font-weight: 600;
      transition: background 0.15s;
    }
    .btn-primary:hover { background: #4338ca; }

    .filter-bar {
      display: flex; gap: 0.75rem; margin-bottom: 1.25rem; flex-wrap: wrap;
    }
    .search-input {
      flex: 1; min-width: 200px; padding: 0.5rem 0.75rem;
      border: 1px solid #d1d5db; border-radius: 6px; font-size: 0.9rem;
    }
    .search-input:focus { outline: none; border-color: #4f46e5; box-shadow: 0 0 0 3px rgba(79,70,229,0.1); }
    .filter-select {
      padding: 0.5rem 0.75rem; border: 1px solid #d1d5db;
      border-radius: 6px; font-size: 0.9rem; background: #fff;
    }

    .loading-state { text-align: center; padding: 2rem; color: #6b7280; }
    .alert-error {
      background: #fef2f2; border: 1px solid #fca5a5; color: #b91c1c;
      padding: 0.75rem 1rem; border-radius: 6px; margin-bottom: 1rem;
    }

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

    .role-badge {
      display: inline-block; padding: 0.2rem 0.5rem; border-radius: 4px;
      font-size: 0.75rem; font-weight: 600; margin-right: 0.25rem;
    }
    .role-employee { background: #dbeafe; color: #1d4ed8; }
    .role-manager { background: #d1fae5; color: #065f46; }
    .role-administrator { background: #ede9fe; color: #5b21b6; }

    .status-badge {
      display: inline-block; padding: 0.2rem 0.6rem; border-radius: 12px;
      font-size: 0.8rem; font-weight: 600;
    }
    .status-badge.active { background: #d1fae5; color: #065f46; }
    .status-badge.inactive { background: #f3f4f6; color: #6b7280; }

    .btn-link { color: #4f46e5; text-decoration: none; font-size: 0.875rem; font-weight: 500; }
    .btn-link:hover { text-decoration: underline; }

    .empty-state { text-align: center; color: #9ca3af; padding: 2rem; }

    .pagination {
      display: flex; align-items: center; justify-content: center;
      gap: 1rem; margin-top: 1.25rem;
    }
    .page-btn {
      padding: 0.4rem 0.9rem; border: 1px solid #d1d5db; border-radius: 6px;
      background: #fff; cursor: pointer; font-size: 0.875rem;
    }
    .page-btn:hover:not(:disabled) { background: #f3f4f6; }
    .page-btn:disabled { opacity: 0.4; cursor: not-allowed; }
    .page-info { font-size: 0.875rem; color: #6b7280; }
  `]
})
export class UserListComponent implements OnInit, OnDestroy {
  users: User[] = [];
  departments: Department[] = [];
  isLoading = false;
  errorMessage = '';
  currentPage = 0;
  totalPages = 0;
  pageSize = 10;

  filterForm: FormGroup;
  private destroy$ = new Subject<void>();

  constructor(private userService: UserService, private fb: FormBuilder) {
    this.filterForm = this.fb.group({
      search: [''],
      departmentId: [''],
      status: ['']
    });
  }

  ngOnInit(): void {
    this.loadDepartments();
    this.loadUsers();

    this.filterForm.valueChanges.pipe(
      debounceTime(400),
      distinctUntilChanged((a, b) => JSON.stringify(a) === JSON.stringify(b)),
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.currentPage = 0;
      this.loadUsers();
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadUsers(): void {
    this.isLoading = true;
    this.errorMessage = '';
    const { search, departmentId, status } = this.filterForm.value;

    this.userService.getUsers({
      page: this.currentPage,
      size: this.pageSize,
      search: search || undefined,
      departmentId: departmentId ? Number(departmentId) : undefined,
      status: status || undefined
    }).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res: PagedResponse<User>) => {
        this.users = res.content;
        this.totalPages = res.totalPages;
        this.isLoading = false;
      },
      error: () => {
        this.errorMessage = 'Failed to load users. Please try again.';
        this.isLoading = false;
      }
    });
  }

  loadDepartments(): void {
    this.userService.getDepartments().pipe(takeUntil(this.destroy$)).subscribe({
      next: (depts) => { this.departments = depts; },
      error: () => { /* non-critical, silently fail */ }
    });
  }

  getDepartmentName(departmentId?: number): string {
    if (!departmentId) return '—';
    return this.departments.find(d => d.id === departmentId)?.name ?? '—';
  }

  goToPage(page: number): void {
    this.currentPage = page;
    this.loadUsers();
  }
}
