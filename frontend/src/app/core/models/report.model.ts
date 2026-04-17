export interface LeaveUsageReportItem {
  leaveTypeName: string;
  totalRequests: number;
  totalDays: number;
}

export interface LeaveBalanceReportItem {
  employeeId: number;
  employeeName: string;
  department: string;
  leaveTypeName: string;
  availableDays: number;
  usedDays: number;
  accruedDays: number;
}

export interface Department {
  id: number;
  name: string;
  description?: string;
}

export interface ReportFilters {
  startDate?: string;
  endDate?: string;
  departmentId?: number;
  leaveTypeId?: number;
}

export interface AuditLogEntry {
  id: number;
  entityType: string;
  entityId: number;
  actionType: string;
  oldValue: string | null;
  newValue: string | null;
  performedBy: {
    id: number;
    username: string;
    firstName: string;
    lastName: string;
  } | null;
  performedAt: string;
  ipAddress: string | null;
}

export interface PagedResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
  first: boolean;
  last: boolean;
}

export interface AuditFilters {
  userId?: number;
  actionType?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  size?: number;
}
