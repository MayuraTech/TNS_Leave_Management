import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';

export interface AuditLogEntry {
  id: number;
  entityType: string;
  entityId: number;
  actionType: string;
  oldValue?: string;
  newValue?: string;
  performedBy?: {
    id: number;
    username: string;
    firstName: string;
    lastName: string;
  };
  performedAt: string;
  ipAddress?: string;
}

export interface AuditFilters {
  userId?: number;
  actionType?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  size?: number;
}

export interface PagedResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

@Injectable({ providedIn: 'root' })
export class AuditService {
  constructor(private api: ApiService) {}

  getAuditLogs(filters: AuditFilters = {}): Observable<PagedResponse<AuditLogEntry>> {
    const params: Record<string, string | number> = {};
    if (filters.userId !== undefined) params['userId'] = filters.userId;
    if (filters.actionType) params['actionType'] = filters.actionType;
    if (filters.startDate) params['startDate'] = filters.startDate + 'T00:00:00';
    if (filters.endDate) params['endDate'] = filters.endDate + 'T23:59:59';
    params['page'] = filters.page ?? 0;
    params['size'] = filters.size ?? 20;
    return this.api.get<PagedResponse<AuditLogEntry>>('/admin/audit', params);
  }
}
