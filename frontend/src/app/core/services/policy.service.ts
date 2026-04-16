import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiService } from './api.service';
import { LeaveType } from '../models/leave-balance.model';
import { environment } from '../../../environments/environment';

export interface LeaveTypePayload {
  name: string;
  description: string;
  accrualRate: number;
  maxCarryOverDays: number;
  minNoticeDays: number;
}

export interface PublicHoliday {
  id: number;
  holidayDate: string;
  name: string;
}

export interface PublicHolidayPayload {
  date: string;
  name: string;
}

@Injectable({ providedIn: 'root' })
export class PolicyService {
  private readonly baseUrl = environment.apiUrl;

  constructor(private api: ApiService, private http: HttpClient) {}

  getLeaveTypes(): Observable<LeaveType[]> {
    return this.api.get<{leaveTypes: LeaveType[]}>('/leave-types')
      .pipe(map(res => res.leaveTypes));
  }

  createLeaveType(payload: LeaveTypePayload): Observable<LeaveType> {
    return this.api.post<LeaveType>('/admin/leave-types', payload);
  }

  updateLeaveType(typeId: number, payload: LeaveTypePayload): Observable<LeaveType> {
    return this.api.put<LeaveType>(`/admin/leave-types/${typeId}`, payload);
  }

  getPublicHolidays(year: number): Observable<PublicHoliday[]> {
    return this.api.get<{holidays: PublicHoliday[]}>('/public-holidays', { year })
      .pipe(map(res => res.holidays));
  }

  createPublicHoliday(payload: PublicHolidayPayload): Observable<PublicHoliday> {
    return this.api.post<PublicHoliday>('/admin/public-holidays', payload);
  }

  deletePublicHoliday(id: number): Observable<void> {
    return this.api.delete<void>(`/admin/public-holidays/${id}`);
  }

  importPublicHolidays(file: File): Observable<{ importedCount: number }> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<{ importedCount: number }>(
      `${this.baseUrl}/api/admin/public-holidays/import`,
      formData
    );
  }
}
