package com.tns.leavemgmt.service;

import com.tns.leavemgmt.dto.CalendarEntryResponse;
import com.tns.leavemgmt.entity.LeaveRequest;
import com.tns.leavemgmt.entity.PublicHoliday;
import com.tns.leavemgmt.repository.LeaveRequestRepository;
import com.tns.leavemgmt.leave.repository.PublicHolidayRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

/**
 * Service for generating leave calendar entries.
 * Returns approved leave for a team within a date range, plus public holidays.
 *
 * Requirements: 11.1, 11.2, 11.3, 11.4, 11.5, 17.4
 */
@Service
@Transactional(readOnly = true)
public class LeaveCalendarService {

    private final LeaveRequestRepository leaveRequestRepository;
    private final PublicHolidayRepository publicHolidayRepository;

    public LeaveCalendarService(LeaveRequestRepository leaveRequestRepository,
                                PublicHolidayRepository publicHolidayRepository) {
        this.leaveRequestRepository = leaveRequestRepository;
        this.publicHolidayRepository = publicHolidayRepository;
    }

    /**
     * Returns all calendar entries for a team within the given date range.
     *
     * Includes:
     * - Approved leave requests for team members, optionally filtered by leave type (Req 11.1, 11.3)
     * - Public holidays falling within the date range (Req 17.4)
     *
     * @param teamId      the team whose leave to display (Req 11.1)
     * @param startDate   start of the date range filter (Req 11.4)
     * @param endDate     end of the date range filter (Req 11.4)
     * @param leaveTypeId optional leave type filter (Req 11.3); null means all types
     * @return combined list of leave entries and public holidays, sorted by date
     */
    public List<CalendarEntryResponse> getCalendarEntries(Long teamId,
                                                          LocalDate startDate,
                                                          LocalDate endDate,
                                                          Long leaveTypeId) {
        List<CalendarEntryResponse> entries = new ArrayList<>();

        // Approved leave for the team (Req 11.1, 11.3, 11.4)
        List<LeaveRequest> leaveRequests = leaveRequestRepository
                .findApprovedByTeamAndDateRange(teamId, startDate, endDate, leaveTypeId);
        for (LeaveRequest lr : leaveRequests) {
            entries.add(toLeaveEntry(lr));
        }

        // Public holidays in range (Req 17.4)
        List<PublicHoliday> holidays = publicHolidayRepository
                .findByHolidayDateBetween(startDate, endDate);
        for (PublicHoliday holiday : holidays) {
            entries.add(toHolidayEntry(holiday));
        }

        // Sort by start/holiday date ascending
        entries.sort((a, b) -> {
            LocalDate dateA = a.getEntryType().equals("LEAVE") ? a.getStartDate() : a.getHolidayDate();
            LocalDate dateB = b.getEntryType().equals("LEAVE") ? b.getStartDate() : b.getHolidayDate();
            return dateA.compareTo(dateB);
        });

        return entries;
    }

    // -------------------------------------------------------------------------
    // Mappers
    // -------------------------------------------------------------------------

    private CalendarEntryResponse toLeaveEntry(LeaveRequest lr) {
        CalendarEntryResponse entry = new CalendarEntryResponse();
        entry.setEntryType("LEAVE");
        entry.setLeaveRequestId(lr.getId());
        entry.setEmployeeId(lr.getEmployee().getId());
        entry.setEmployeeName(lr.getEmployee().getFirstName() + " " + lr.getEmployee().getLastName());
        entry.setLeaveTypeId(lr.getLeaveType().getId());
        entry.setLeaveTypeName(lr.getLeaveType().getName());
        entry.setStartDate(lr.getStartDate());
        entry.setEndDate(lr.getEndDate());
        entry.setDurationType(lr.getDurationType());
        entry.setSessionType(lr.getSessionType());
        entry.setDurationInHours(lr.getDurationInHours());
        entry.setTotalDays(lr.getTotalDays());
        return entry;
    }

    private CalendarEntryResponse toHolidayEntry(PublicHoliday holiday) {
        CalendarEntryResponse entry = new CalendarEntryResponse();
        entry.setEntryType("PUBLIC_HOLIDAY");
        entry.setHolidayId(holiday.getId());
        entry.setHolidayDate(holiday.getHolidayDate());
        entry.setHolidayName(holiday.getName());
        return entry;
    }
}
