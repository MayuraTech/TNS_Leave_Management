import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  LeaveUsageReportItem,
  LeaveBalanceReportItem,
  Department,
  ReportFilters,
  AuditLogEntry,
  AuditFilters,
  PagedResponse
} from '../models/report.model';

@Injectable({ providedIn: 'root' })
export class ReportService {
  private readonly baseUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getLeaveUsageReport(filters: ReportFilters): Observable<LeaveUsageReportItem[]> {
    let params = new HttpParams();
    if (filters.startDate) params = params.set('startDate', filters.startDate);
    if (filters.endDate) params = params.set('endDate', filters.endDate);
    if (filters.departmentId) params = params.set('departmentId', String(filters.departmentId));
    if (filters.leaveTypeId) params = params.set('leaveTypeId', String(filters.leaveTypeId));
    return this.http.get<LeaveUsageReportItem[]>(`${this.baseUrl}/api/admin/reports/leave-usage`, { params });
  }

  getLeaveBalanceReport(departmentId?: number): Observable<LeaveBalanceReportItem[]> {
    let params = new HttpParams();
    if (departmentId) params = params.set('departmentId', String(departmentId));
    return this.http.get<LeaveBalanceReportItem[]>(`${this.baseUrl}/api/admin/reports/leave-balances`, { params });
  }

  getDepartments(): Observable<Department[]> {
    return this.http.get<Department[]>(`${this.baseUrl}/api/admin/departments`);
  }

  exportReport(reportType: string, filters: ReportFilters): Observable<Blob> {
    let params = new HttpParams().set('reportType', reportType).set('format', 'csv');
    if (filters.startDate) params = params.set('startDate', filters.startDate);
    if (filters.endDate) params = params.set('endDate', filters.endDate);
    if (filters.departmentId) params = params.set('departmentId', String(filters.departmentId));
    if (filters.leaveTypeId) params = params.set('leaveTypeId', String(filters.leaveTypeId));
    return this.http.get(`${this.baseUrl}/api/admin/reports/export`, {
      params,
      responseType: 'blob'
    });
  }

  getAuditLogs(filters: AuditFilters): Observable<PagedResponse<AuditLogEntry>> {
    let params = new HttpParams();
    if (filters.userId) params = params.set('userId', String(filters.userId));
    if (filters.actionType) params = params.set('actionType', filters.actionType);
    if (filters.startDate) params = params.set('startDate', filters.startDate + 'T00:00:00');
    if (filters.endDate) params = params.set('endDate', filters.endDate + 'T23:59:59');
    params = params.set('page', String(filters.page ?? 0));
    params = params.set('size', String(filters.size ?? 20));
    return this.http.get<PagedResponse<AuditLogEntry>>(`${this.baseUrl}/api/admin/audit`, { params });
  }

  getUsers(): Observable<{ id: number; username: string; firstName: string; lastName: string }[]> {
    return this.http.get<{ id: number; username: string; firstName: string; lastName: string }[]>(
      `${this.baseUrl}/api/admin/users`
    );
  }
}
