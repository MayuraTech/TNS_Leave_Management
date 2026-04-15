export type LeaveRequestStatus = 'PENDING' | 'APPROVED' | 'DENIED' | 'CANCELLED';
export type LeaveDurationType = 'FULL_DAY' | 'HALF_DAY' | 'HOURLY';
export type SessionType = 'MORNING' | 'AFTERNOON';

export interface LeaveRequest {
  id: number;
  employeeId: number;
  employeeName?: string;
  leaveTypeId: number;
  leaveTypeName?: string;
  startDate: string;
  endDate: string;
  durationType: LeaveDurationType;
  sessionType?: SessionType;
  durationInHours?: number;
  totalDays: number;
  reason: string;
  status: LeaveRequestStatus;
  approvedBy?: number;
  approvalComments?: string;
  submittedAt: string;
  processedAt?: string;
}

export interface LeaveRequestDTO {
  leaveTypeId: number;
  startDate: string;
  endDate: string;
  durationType: LeaveDurationType;
  sessionType?: SessionType;
  durationInHours?: number;
  reason: string;
}
