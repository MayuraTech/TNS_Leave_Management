import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { LeaveUsageReportItem, LeaveBalanceReportItem, Department, ReportFilters } from '../models/report.model';

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
    return this.http.get<LeaveUsageReportItem[]>(`${this.baseUrl}/admin/reports/leave-usage`, { params });
  }

  getLeaveBalanceReport(departmentId?: number): Observable<LeaveBalanceReportItem[]> {
    let params = new HttpParams();
    if (departmentId) params = params.set('departmentId', String(departmentId));
    return this.http.get<LeaveBalanceReportItem[]>(`${this.baseUrl}/admin/reports/leave-balances`, { params });
  }

  getDepartments(): Observable<Department[]> {
    return this.http.get<Department[]>(`${this.baseUrl}/admin/departments`);
  }

  exportReport(reportType: string, filters: ReportFilters): Observable<Blob> {
    let params = new HttpParams().set('reportType', reportType).set('format', 'csv');
    if (filters.startDate) params = params.set('startDate', filters.startDate);
    if (filters.endDate) params = params.set('endDate', filters.endDate);
    if (filters.departmentId) params = params.set('departmentId', String(filters.departmentId));
    if (filters.leaveTypeId) params = params.set('leaveTypeId', String(filters.leaveTypeId));
    return this.http.get(`${this.baseUrl}/admin/reports/export`, {
      params,
      responseType: 'blob'
    });
  }
}
