import { LeaveDurationType, SessionType } from './leave-request.model';

export type CalendarEntryType = 'LEAVE' | 'PUBLIC_HOLIDAY';

export interface CalendarEntry {
  entryType: CalendarEntryType;

  // Leave fields
  leaveRequestId?: number;
  employeeId?: number;
  employeeName?: string;
  leaveTypeId?: number;
  leaveTypeName?: string;
  startDate?: string;
  endDate?: string;
  durationType?: LeaveDurationType;
  sessionType?: SessionType;
  durationInHours?: number;
  totalDays?: number;

  // Public holiday fields
  holidayId?: number;
  holidayDate?: string;
  holidayName?: string;
}

export interface PublicHoliday {
  id: number;
  holidayDate: string;
  name: string;
}

export interface CalendarDay {
  date: Date;
  dateStr: string;
  isCurrentMonth: boolean;
  isToday: boolean;
  isWeekend: boolean;
  leaveEntries: CalendarEntry[];
  holidays: CalendarEntry[];
  /** Number of distinct employees on leave this day */
  employeeCount: number;
}
