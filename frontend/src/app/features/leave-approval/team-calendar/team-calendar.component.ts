import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { LeaveService } from '../../../core/services/leave.service';
import { LeaveType } from '../../../core/models/leave-balance.model';
import { CalendarEntry, CalendarDay } from '../../../core/models/calendar.model';

interface PopoverData {
  entries: CalendarEntry[];
  holidays: CalendarEntry[];
  dateLabel: string;
}

@Component({
  selector: 'app-team-calendar',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="page-wrapper" (click)="closePopover()">

      <!-- Header -->
      <div class="page-header">
        <div>
          <h1 class="page-title">Team Leave Calendar</h1>
          <p class="page-subtitle">View approved leave and public holidays for your team</p>
        </div>
        <div class="nav-controls">
          <button class="nav-btn" (click)="prevMonth(); $event.stopPropagation()">&#8249;</button>
          <span class="month-label">{{ monthLabel }}</span>
          <button class="nav-btn" (click)="nextMonth(); $event.stopPropagation()">&#8250;</button>
          <button class="today-btn" (click)="goToToday(); $event.stopPropagation()">Today</button>
        </div>
      </div>

      <!-- Filters -->
      <div class="filters-card" [formGroup]="filterForm" (click)="$event.stopPropagation()">
        <div class="filter-group">
          <label class="filter-label">Leave Type</label>
          <select class="filter-select" formControlName="leaveTypeId" (change)="applyFilters()">
            <option value="">All Types</option>
            <option *ngFor="let lt of leaveTypes" [value]="lt.id">{{ lt.name }}</option>
          </select>
        </div>
        <div class="filter-group">
          <label class="filter-label">From</label>
          <input type="date" class="filter-input" formControlName="startDate" (change)="applyFilters()" />
        </div>
        <div class="filter-group">
          <label class="filter-label">To</label>
          <input type="date" class="filter-input" formControlName="endDate" (change)="applyFilters()" />
        </div>
        <button class="btn-reset" (click)="resetFilters()">Reset</button>
      </div>

      <!-- Legend -->
      <div class="legend">
        <span class="legend-item"><span class="dot dot-leave"></span> Approved Leave</span>
        <span class="legend-item"><span class="dot dot-multi"></span> Multiple on Leave</span>
        <span class="legend-item"><span class="dot dot-holiday"></span> Public Holiday</span>
        <span class="legend-item"><span class="dot dot-today"></span> Today</span>
      </div>

      <!-- Error -->
      <div class="error-banner" *ngIf="errorMessage && !loading">
        {{ errorMessage }}
        <button class="retry-btn" (click)="loadCalendar()">Retry</button>
      </div>

      <!-- Loading -->
      <div class="loading-overlay" *ngIf="loading">
        <div class="spinner"></div>
        <span>Loading calendar…</span>
      </div>

      <!-- Calendar grid -->
      <div class="calendar-card" *ngIf="!loading" (click)="$event.stopPropagation()">
        <!-- Day-of-week headers -->
        <div class="dow-header">
          <div class="dow-cell" *ngFor="let d of dayNames">{{ d }}</div>
        </div>

        <!-- Weeks -->
        <div class="weeks-grid">
          <div class="day-cell"
               *ngFor="let day of calendarDays"
               [class.other-month]="!day.isCurrentMonth"
               [class.today]="day.isToday"
               [class.weekend]="day.isWeekend"
               [class.has-holiday]="day.holidays.length > 0"
               [class.has-leave]="day.leaveEntries.length > 0"
               [class.multi-leave]="day.employeeCount > 1"
               (click)="onDayClick(day, $event)">

            <span class="day-number">{{ day.date.getDate() }}</span>

            <!-- Holiday badge -->
            <div class="holiday-badge" *ngFor="let h of day.holidays" [title]="h.holidayName!">
              <span class="holiday-icon">🏖</span>
              <span class="holiday-name">{{ h.holidayName }}</span>
            </div>

            <!-- Leave pills (show up to 2, then +N more) -->
            <ng-container *ngIf="day.leaveEntries.length > 0">
              <div class="leave-pill"
                   *ngFor="let e of day.leaveEntries.slice(0, 2)"
                   [style.background]="leaveTypeColor(e.leaveTypeId)"
                   [title]="e.employeeName + ' — ' + e.leaveTypeName">
                {{ e.employeeName | slice:0:14 }}
              </div>
              <div class="more-pill" *ngIf="day.leaveEntries.length > 2">
                +{{ day.leaveEntries.length - 2 }} more
              </div>
            </ng-container>

            <!-- Multi-leave indicator -->
            <div class="multi-badge" *ngIf="day.employeeCount > 1">
              {{ day.employeeCount }} on leave
            </div>
          </div>
        </div>
      </div>

      <!-- Popover -->
      <div class="popover-overlay" *ngIf="popover" (click)="closePopover()">
        <div class="popover-card" (click)="$event.stopPropagation()">
          <div class="popover-header">
            <span class="popover-date">{{ popover.dateLabel }}</span>
            <button class="popover-close" (click)="closePopover()">✕</button>
          </div>

          <!-- Holidays section -->
          <div *ngIf="popover.holidays.length > 0" class="popover-section">
            <h4 class="popover-section-title">Public Holidays</h4>
            <div class="popover-holiday" *ngFor="let h of popover.holidays">
              <span class="holiday-icon-lg">🏖</span>
              <span>{{ h.holidayName }}</span>
            </div>
          </div>

          <!-- Leave entries section -->
          <div *ngIf="popover.entries.length > 0" class="popover-section">
            <h4 class="popover-section-title">Team on Leave</h4>
            <div class="popover-entry" *ngFor="let e of popover.entries">
              <div class="entry-color-bar" [style.background]="leaveTypeColor(e.leaveTypeId)"></div>
              <div class="entry-info">
                <span class="entry-name">{{ e.employeeName }}</span>
                <span class="entry-type">{{ e.leaveTypeName }}</span>
                <span class="entry-duration" *ngIf="e.durationType === 'HALF_DAY'">
                  Half day ({{ e.sessionType === 'MORNING' ? 'Morning' : 'Afternoon' }})
                </span>
                <span class="entry-duration" *ngIf="e.durationType === 'HOURLY'">
                  {{ e.durationInHours }} hour(s)
                </span>
                <span class="entry-duration" *ngIf="e.durationType === 'FULL_DAY'">
                  {{ e.startDate | date:'dd MMM' }} – {{ e.endDate | date:'dd MMM yyyy' }}
                </span>
              </div>
            </div>
          </div>

          <div class="popover-empty" *ngIf="popover.entries.length === 0 && popover.holidays.length === 0">
            No events on this day.
          </div>
        </div>
      </div>

    </div>
  `,
  styles: [`
    .page-wrapper {
      padding: 32px;
      background: #F3F4F6;
      min-height: 100vh;
      position: relative;
    }

    /* Header */
    .page-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 16px;
      margin-bottom: 24px;
    }

    .page-title {
      font-family: 'Outfit', 'General Sans', sans-serif;
      font-size: 1.75rem;
      font-weight: 700;
      color: #0A1628;
      margin: 0 0 4px;
    }

    .page-subtitle {
      font-size: 0.875rem;
      color: #6B7280;
      margin: 0;
    }

    /* Navigation controls */
    .nav-controls {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .nav-btn {
      width: 36px;
      height: 36px;
      border: 1px solid #D1D5DB;
      border-radius: 8px;
      background: #fff;
      font-size: 1.25rem;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #374151;
      transition: background 0.15s;
    }

    .nav-btn:hover { background: #F9FAFB; }

    .month-label {
      font-size: 1.125rem;
      font-weight: 700;
      color: #0A1628;
      min-width: 160px;
      text-align: center;
    }

    .today-btn {
      padding: 6px 16px;
      background: #1E4D8C;
      color: #fff;
      border: none;
      border-radius: 8px;
      font-size: 0.875rem;
      font-weight: 600;
      cursor: pointer;
      transition: opacity 0.15s;
    }

    .today-btn:hover { opacity: 0.85; }

    /* Filters */
    .filters-card {
      display: flex;
      align-items: flex-end;
      flex-wrap: wrap;
      gap: 16px;
      background: #fff;
      border-radius: 12px;
      padding: 16px 20px;
      box-shadow: 0 2px 8px rgba(10, 22, 40, 0.06);
      margin-bottom: 16px;
    }

    .filter-group {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .filter-label {
      font-size: 0.75rem;
      font-weight: 600;
      color: #6B7280;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }

    .filter-select, .filter-input {
      padding: 8px 12px;
      border: 1px solid #D1D5DB;
      border-radius: 8px;
      font-size: 0.875rem;
      color: #111827;
      background: #fff;
      min-width: 160px;
      cursor: pointer;
    }

    .filter-select:focus, .filter-input:focus {
      outline: none;
      border-color: #F59E0B;
    }

    .btn-reset {
      padding: 8px 16px;
      background: transparent;
      border: 1px solid #D1D5DB;
      border-radius: 8px;
      font-size: 0.875rem;
      color: #6B7280;
      cursor: pointer;
      transition: all 0.15s;
      align-self: flex-end;
    }

    .btn-reset:hover { background: #F9FAFB; color: #374151; }

    /* Legend */
    .legend {
      display: flex;
      flex-wrap: wrap;
      gap: 16px;
      margin-bottom: 16px;
    }

    .legend-item {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 0.8125rem;
      color: #6B7280;
    }

    .dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      flex-shrink: 0;
    }

    .dot-leave { background: #3B82F6; }
    .dot-multi { background: #F59E0B; }
    .dot-holiday { background: #10B981; }
    .dot-today { background: #EF4444; border: 2px solid #EF4444; }

    /* Error */
    .error-banner {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 14px 16px;
      background: #FEE2E2;
      border: 1px solid #FECACA;
      border-radius: 8px;
      color: #DC2626;
      font-size: 0.875rem;
      margin-bottom: 16px;
    }

    .retry-btn {
      padding: 4px 12px;
      background: #DC2626;
      color: #fff;
      border: none;
      border-radius: 6px;
      font-size: 0.8125rem;
      cursor: pointer;
    }

    /* Loading */
    .loading-overlay {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 80px 24px;
      gap: 16px;
      color: #6B7280;
      font-size: 0.9375rem;
    }

    .spinner {
      width: 40px;
      height: 40px;
      border: 3px solid #E5E7EB;
      border-top-color: #1E4D8C;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }

    @keyframes spin { to { transform: rotate(360deg); } }

    /* Calendar card */
    .calendar-card {
      background: #fff;
      border-radius: 12px;
      box-shadow: 0 4px 12px rgba(10, 22, 40, 0.08);
      overflow: hidden;
    }

    /* Day-of-week header */
    .dow-header {
      display: grid;
      grid-template-columns: repeat(7, 1fr);
      background: #0F2240;
    }

    .dow-cell {
      padding: 12px 8px;
      text-align: center;
      font-size: 0.75rem;
      font-weight: 700;
      color: #fff;
      text-transform: uppercase;
      letter-spacing: 0.06em;
    }

    /* Weeks grid */
    .weeks-grid {
      display: grid;
      grid-template-columns: repeat(7, 1fr);
    }

    /* Day cell */
    .day-cell {
      min-height: 110px;
      padding: 8px;
      border-right: 1px solid #F3F4F6;
      border-bottom: 1px solid #F3F4F6;
      cursor: pointer;
      transition: background 0.12s;
      position: relative;
      overflow: hidden;
    }

    .day-cell:hover { background: #FFFBEB; }

    .day-cell.other-month {
      background: #FAFAFA;
      opacity: 0.55;
    }

    .day-cell.today .day-number {
      background: #EF4444;
      color: #fff;
      border-radius: 50%;
      width: 26px;
      height: 26px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .day-cell.weekend { background: #F9FAFB; }

    .day-cell.has-holiday { border-top: 3px solid #10B981; }

    .day-cell.multi-leave { background: #FFFBEB; }

    .day-number {
      font-size: 0.875rem;
      font-weight: 600;
      color: #374151;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 26px;
      height: 26px;
      margin-bottom: 4px;
    }

    /* Holiday badge */
    .holiday-badge {
      display: flex;
      align-items: center;
      gap: 4px;
      background: #D1FAE5;
      border-radius: 4px;
      padding: 2px 6px;
      margin-bottom: 3px;
      font-size: 0.7rem;
      color: #065F46;
      font-weight: 500;
      overflow: hidden;
      white-space: nowrap;
      text-overflow: ellipsis;
    }

    .holiday-icon { font-size: 0.75rem; flex-shrink: 0; }
    .holiday-name { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

    /* Leave pills */
    .leave-pill {
      border-radius: 4px;
      padding: 2px 6px;
      margin-bottom: 3px;
      font-size: 0.7rem;
      font-weight: 600;
      color: #fff;
      overflow: hidden;
      white-space: nowrap;
      text-overflow: ellipsis;
      cursor: pointer;
    }

    .more-pill {
      font-size: 0.7rem;
      color: #6B7280;
      padding: 2px 4px;
      font-weight: 500;
    }

    /* Multi-leave badge */
    .multi-badge {
      position: absolute;
      bottom: 4px;
      right: 4px;
      background: #F59E0B;
      color: #fff;
      border-radius: 10px;
      padding: 1px 6px;
      font-size: 0.65rem;
      font-weight: 700;
    }

    /* Popover overlay */
    .popover-overlay {
      position: fixed;
      inset: 0;
      background: rgba(10, 22, 40, 0.4);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      padding: 16px;
    }

    .popover-card {
      background: #fff;
      border-radius: 12px;
      padding: 24px;
      max-width: 480px;
      width: 100%;
      box-shadow: 0 20px 48px rgba(10, 22, 40, 0.16);
      max-height: 80vh;
      overflow-y: auto;
    }

    .popover-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 16px;
    }

    .popover-date {
      font-family: 'Outfit', sans-serif;
      font-size: 1.125rem;
      font-weight: 700;
      color: #0A1628;
    }

    .popover-close {
      background: none;
      border: none;
      font-size: 1rem;
      color: #9CA3AF;
      cursor: pointer;
      padding: 4px;
      line-height: 1;
    }

    .popover-close:hover { color: #374151; }

    .popover-section { margin-bottom: 16px; }

    .popover-section-title {
      font-size: 0.75rem;
      font-weight: 700;
      color: #6B7280;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      margin: 0 0 10px;
    }

    .popover-holiday {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 12px;
      background: #D1FAE5;
      border-radius: 8px;
      font-size: 0.9375rem;
      color: #065F46;
      font-weight: 500;
      margin-bottom: 6px;
    }

    .holiday-icon-lg { font-size: 1.125rem; }

    .popover-entry {
      display: flex;
      align-items: stretch;
      gap: 10px;
      padding: 10px 12px;
      background: #F9FAFB;
      border-radius: 8px;
      margin-bottom: 6px;
    }

    .entry-color-bar {
      width: 4px;
      border-radius: 2px;
      flex-shrink: 0;
    }

    .entry-info {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .entry-name {
      font-size: 0.9375rem;
      font-weight: 700;
      color: #0A1628;
    }

    .entry-type {
      font-size: 0.8125rem;
      color: #6B7280;
    }

    .entry-duration {
      font-size: 0.8125rem;
      color: #9CA3AF;
    }

    .popover-empty {
      text-align: center;
      color: #9CA3AF;
      font-size: 0.9375rem;
      padding: 16px 0;
    }

    @media (max-width: 768px) {
      .page-wrapper { padding: 16px; }
      .page-header { flex-direction: column; }
      .filters-card { flex-direction: column; }
      .day-cell { min-height: 70px; padding: 4px; }
      .leave-pill, .holiday-badge { font-size: 0.6rem; }
      .multi-badge { display: none; }
    }
  `]
})
export class TeamCalendarComponent implements OnInit {
  // Calendar state
  currentYear = new Date().getFullYear();
  currentMonth = new Date().getMonth(); // 0-indexed
  calendarDays: CalendarDay[] = [];
  monthLabel = '';

  // Data
  allEntries: CalendarEntry[] = [];
  leaveTypes: LeaveType[] = [];

  // UI state
  loading = false;
  errorMessage = '';
  popover: PopoverData | null = null;

  // Filters
  filterForm!: FormGroup;

  readonly dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Colour palette for leave types (cycles through)
  private readonly colorPalette = [
    '#3B82F6', '#8B5CF6', '#EC4899', '#F97316',
    '#14B8A6', '#6366F1', '#EF4444', '#84CC16'
  ];
  private colorMap = new Map<number, string>();

  constructor(
    private leaveService: LeaveService,
    private fb: FormBuilder
  ) {}

  ngOnInit(): void {
    this.filterForm = this.fb.group({
      leaveTypeId: [''],
      startDate: [''],
      endDate: ['']
    });

    this.leaveService.getLeaveTypes().subscribe({
      next: (types) => { this.leaveTypes = types; },
      error: () => {}
    });

    this.buildCalendarGrid();
    this.loadCalendar();
  }

  // ── Navigation ──────────────────────────────────────────────────────────────

  prevMonth(): void {
    if (this.currentMonth === 0) {
      this.currentMonth = 11;
      this.currentYear--;
    } else {
      this.currentMonth--;
    }
    this.buildCalendarGrid();
    this.loadCalendar();
  }

  nextMonth(): void {
    if (this.currentMonth === 11) {
      this.currentMonth = 0;
      this.currentYear++;
    } else {
      this.currentMonth++;
    }
    this.buildCalendarGrid();
    this.loadCalendar();
  }

  goToToday(): void {
    const now = new Date();
    this.currentYear = now.getFullYear();
    this.currentMonth = now.getMonth();
    this.buildCalendarGrid();
    this.loadCalendar();
  }

  // ── Filters ─────────────────────────────────────────────────────────────────

  applyFilters(): void {
    this.populateDays(this.allEntries);
  }

  resetFilters(): void {
    this.filterForm.reset({ leaveTypeId: '', startDate: '', endDate: '' });
    this.populateDays(this.allEntries);
  }

  // ── Data loading ─────────────────────────────────────────────────────────────

  loadCalendar(): void {
    this.loading = true;
    this.errorMessage = '';

    const firstDay = new Date(this.currentYear, this.currentMonth, 1);
    const lastDay = new Date(this.currentYear, this.currentMonth + 1, 0);
    const startDate = this.toDateStr(firstDay);
    const endDate = this.toDateStr(lastDay);

    this.leaveService.getCalendarEntries({ startDate, endDate }).subscribe({
      next: (entries) => {
        this.allEntries = entries;
        this.populateDays(entries);
        this.loading = false;
      },
      error: () => {
        this.errorMessage = 'Failed to load calendar data. Please try again.';
        this.loading = false;
      }
    });
  }

  // ── Calendar grid building ───────────────────────────────────────────────────

  private buildCalendarGrid(): void {
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    this.monthLabel = `${monthNames[this.currentMonth]} ${this.currentYear}`;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const firstOfMonth = new Date(this.currentYear, this.currentMonth, 1);
    const lastOfMonth = new Date(this.currentYear, this.currentMonth + 1, 0);

    // Start grid on Sunday of the week containing the 1st
    const startDate = new Date(firstOfMonth);
    startDate.setDate(startDate.getDate() - startDate.getDay());

    // End grid on Saturday of the week containing the last day
    const endDate = new Date(lastOfMonth);
    endDate.setDate(endDate.getDate() + (6 - endDate.getDay()));

    this.calendarDays = [];
    const cursor = new Date(startDate);
    while (cursor <= endDate) {
      const d = new Date(cursor);
      d.setHours(0, 0, 0, 0);
      this.calendarDays.push({
        date: d,
        dateStr: this.toDateStr(d),
        isCurrentMonth: d.getMonth() === this.currentMonth,
        isToday: d.getTime() === today.getTime(),
        isWeekend: d.getDay() === 0 || d.getDay() === 6,
        leaveEntries: [],
        holidays: [],
        employeeCount: 0
      });
      cursor.setDate(cursor.getDate() + 1);
    }
  }

  private populateDays(entries: CalendarEntry[]): void {
    const { leaveTypeId, startDate, endDate } = this.filterForm.value;

    // Filter leave entries
    const filtered = entries.filter(e => {
      if (e.entryType === 'LEAVE') {
        if (leaveTypeId && String(e.leaveTypeId) !== String(leaveTypeId)) return false;
        if (startDate && e.endDate && e.endDate < startDate) return false;
        if (endDate && e.startDate && e.startDate > endDate) return false;
      }
      return true;
    });

    // Reset days
    this.calendarDays.forEach(day => {
      day.leaveEntries = [];
      day.holidays = [];
      day.employeeCount = 0;
    });

    // Map entries to days
    for (const entry of filtered) {
      if (entry.entryType === 'PUBLIC_HOLIDAY' && entry.holidayDate) {
        const day = this.calendarDays.find(d => d.dateStr === entry.holidayDate);
        if (day) day.holidays.push(entry);
      } else if (entry.entryType === 'LEAVE' && entry.startDate && entry.endDate) {
        // Span the leave across all days in range
        for (const day of this.calendarDays) {
          if (day.dateStr >= entry.startDate && day.dateStr <= entry.endDate) {
            day.leaveEntries.push(entry);
          }
        }
      }
    }

    // Count distinct employees per day
    this.calendarDays.forEach(day => {
      const ids = new Set(day.leaveEntries.map(e => e.employeeId));
      day.employeeCount = ids.size;
    });
  }

  // ── Interaction ──────────────────────────────────────────────────────────────

  onDayClick(day: CalendarDay, event: MouseEvent): void {
    event.stopPropagation();
    if (day.leaveEntries.length === 0 && day.holidays.length === 0) {
      this.popover = null;
      return;
    }
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    this.popover = {
      entries: day.leaveEntries,
      holidays: day.holidays,
      dateLabel: `${day.date.getDate()} ${monthNames[day.date.getMonth()]} ${day.date.getFullYear()}`
    };
  }

  closePopover(): void {
    this.popover = null;
  }

  // ── Helpers ──────────────────────────────────────────────────────────────────

  leaveTypeColor(leaveTypeId?: number): string {
    if (leaveTypeId == null) return '#3B82F6';
    if (!this.colorMap.has(leaveTypeId)) {
      const idx = this.colorMap.size % this.colorPalette.length;
      this.colorMap.set(leaveTypeId, this.colorPalette[idx]);
    }
    return this.colorMap.get(leaveTypeId)!;
  }

  private toDateStr(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }
}
