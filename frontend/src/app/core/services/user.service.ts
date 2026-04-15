import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiService } from './api.service';
import { User, UserRole } from '../models/user.model';

export interface Department {
  id: number;
  name: string;
  description?: string;
}

export interface Team {
  id: number;
  name: string;
  departmentId: number;
  departmentName?: string;
  managerId?: number;
  managerName?: string;
}

export interface CreateDepartmentRequest {
  name: string;
  description?: string;
}

export interface UpdateDepartmentRequest {
  name: string;
  description?: string;
}

export interface CreateTeamRequest {
  name: string;
  departmentId: number;
  managerId?: number;
}

export interface UpdateTeamRequest {
  name: string;
  departmentId: number;
  managerId?: number;
}

export interface CreateUserRequest {
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  roles: UserRole[];
  departmentId?: number;
  managerId?: number;
}

export interface UpdateUserRequest {
  email?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  emergencyContact?: string;
  address?: string;
  roles?: UserRole[];
  departmentId?: number;
  managerId?: number;
}

export interface ResetPasswordRequest {
  newPassword: string;
}

export interface UserListParams {
  page?: number;
  size?: number;
  departmentId?: number;
  status?: 'active' | 'inactive';
  search?: string;
}

export interface PagedResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

@Injectable({ providedIn: 'root' })
export class UserService {
  constructor(private api: ApiService) {}

  getUsers(params: UserListParams = {}): Observable<PagedResponse<User>> {
    const queryParams: Record<string, string | number> = {};
    if (params.page !== undefined) queryParams['page'] = params.page;
    if (params.size !== undefined) queryParams['size'] = params.size;
    if (params.departmentId !== undefined) queryParams['departmentId'] = params.departmentId;
    if (params.status) queryParams['status'] = params.status;
    if (params.search) queryParams['search'] = params.search;
    return this.api.get<PagedResponse<User>>('/admin/users', queryParams);
  }

  createUser(request: CreateUserRequest): Observable<User> {
    return this.api.post<User>('/admin/users', request);
  }

  getDepartments(): Observable<Department[]> {
    return this.api.get<Department[]>('/admin/departments');
  }

  getManagers(): Observable<User[]> {
    return this.api.get<PagedResponse<User>>('/admin/users', { status: 'active', role: 'MANAGER' }).pipe(
      map((res: PagedResponse<User>) => res.content)
    );
  }

  getUserById(id: number): Observable<User> {
    return this.api.get<User>(`/admin/users/${id}`);
  }

  updateUser(id: number, request: UpdateUserRequest): Observable<User> {
    return this.api.put<User>(`/admin/users/${id}`, request);
  }

  resetPassword(id: number, request: ResetPasswordRequest): Observable<void> {
    return this.api.post<void>(`/admin/users/${id}/reset-password`, request);
  }

  setUserStatus(id: number, active: boolean): Observable<User> {
    return this.api.put<User>(`/admin/users/${id}/status`, { active });
  }

  createDepartment(request: CreateDepartmentRequest): Observable<Department> {
    return this.api.post<Department>('/admin/departments', request);
  }

  updateDepartment(id: number, request: UpdateDepartmentRequest): Observable<Department> {
    return this.api.put<Department>(`/admin/departments/${id}`, request);
  }

  deleteDepartment(id: number): Observable<void> {
    return this.api.delete<void>(`/admin/departments/${id}`);
  }

  getTeams(): Observable<Team[]> {
    return this.api.get<Team[]>('/admin/teams');
  }

  createTeam(request: CreateTeamRequest): Observable<Team> {
    return this.api.post<Team>('/admin/teams', request);
  }

  updateTeam(id: number, request: UpdateTeamRequest): Observable<Team> {
    return this.api.put<Team>(`/admin/teams/${id}`, request);
  }

  deleteTeam(id: number): Observable<void> {
    return this.api.delete<void>(`/admin/teams/${id}`);
  }
}
