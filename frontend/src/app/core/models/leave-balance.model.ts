export interface LeaveBalance {
  leaveTypeId: number;
  leaveTypeName: string;
  availableDays: number;
  accruedDays: number;
  usedDays: number;
  accrualRate: number;
  availableHours?: number;
  usedHours?: number;
}

export interface LeaveType {
  id: number;
  name: string;
  description?: string;
  accrualRate: number;
  maxCarryOverDays: number;
  minNoticeDays: number;
  isActive: boolean;
}
