export interface LeaveUsageReportItem {
  employeeId: number;
  employeeName: string;
  departmentName: string;
  leaveTypeName: string;
  totalDays: number;
  requestCount: number;
}

export interface LeaveBalanceReportItem {
  employeeId: number;
  employeeName: string;
  departmentName: string;
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
