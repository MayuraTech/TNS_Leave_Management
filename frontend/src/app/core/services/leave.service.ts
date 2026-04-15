import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { LeaveBalance, LeaveType } from '../models/leave-balance.model';
import { LeaveRequest, LeaveRequestDTO, LeaveRequestStatus } from '../models/leave-request.model';
import { CalendarEntry, PublicHoliday } from '../models/calendar.model';

@Injectable({ providedIn: 'root' })
export class LeaveService {
  constructor(private api: ApiService) {}

  getLeaveTypes(): Observable<LeaveType[]> {
    return this.api.get<LeaveType[]>('/api/leave-types');
  }

  getLeaveBalances(): Observable<LeaveBalance[]> {
    return this.api.get<LeaveBalance[]>('/api/leave/balance');
  }

  submitLeaveRequest(dto: LeaveRequestDTO): Observable<LeaveRequest> {
    return this.api.post<LeaveRequest>('/api/leave/requests', dto);
  }

  getLeaveRequests(filters?: { status?: LeaveRequestStatus }): Observable<LeaveRequest[]> {
    const params: Record<string, string> = {};
    if (filters?.status) params['status'] = filters.status;
    return this.api.get<LeaveRequest[]>('/api/leave/requests', params);
  }

  getLeaveRequest(id: number): Observable<LeaveRequest> {
    return this.api.get<LeaveRequest>(`/api/leave/requests/${id}`);
  }

  cancelLeaveRequest(id: number): Observable<void> {
    return this.api.delete<void>(`/api/leave/requests/${id}`);
  }

  // Manager endpoints
  getPendingRequests(): Observable<LeaveRequest[]> {
    return this.api.get<LeaveRequest[]>('/api/manager/pending-requests');
  }

  approveLeaveRequest(id: number, comments: string): Observable<LeaveRequest> {
    return this.api.put<LeaveRequest>(`/api/leave/requests/${id}/approve`, { comments });
  }

  denyLeaveRequest(id: number, reason: string): Observable<LeaveRequest> {
    return this.api.put<LeaveRequest>(`/api/leave/requests/${id}/deny`, { reason });
  }

  // Calendar endpoints
  getCalendarEntries(params: {
    startDate: string;
    endDate: string;
    teamId?: number;
    leaveTypeId?: number;
  }): Observable<CalendarEntry[]> {
    const p: Record<string, string> = {
      startDate: params.startDate,
      endDate: params.endDate
    };
    if (params.teamId != null) p['teamId'] = String(params.teamId);
    if (params.leaveTypeId != null) p['leaveTypeId'] = String(params.leaveTypeId);
    return this.api.get<CalendarEntry[]>('/api/leave/calendar', p);
  }

  getPublicHolidays(year: number): Observable<PublicHoliday[]> {
    return this.api.get<PublicHoliday[]>('/api/public-holidays', { year });
  }
}
