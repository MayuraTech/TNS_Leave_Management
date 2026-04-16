package com.tns.leavemgmt.controller;

import com.tns.leavemgmt.dto.CalendarEntryResponse;
import com.tns.leavemgmt.dto.LeaveBalanceResponse;
import com.tns.leavemgmt.dto.LeaveRequestDTO;
import com.tns.leavemgmt.dto.LeaveRequestResponse;
import com.tns.leavemgmt.entity.LeaveRequest;
import com.tns.leavemgmt.entity.enums.LeaveRequestStatus;
import com.tns.leavemgmt.entity.User;
import com.tns.leavemgmt.repository.LeaveRequestRepository;
import com.tns.leavemgmt.user.repository.UserRepository;
import com.tns.leavemgmt.service.LeaveBalanceService;
import com.tns.leavemgmt.service.LeaveCalendarService;
import com.tns.leavemgmt.service.LeaveRequestService;
import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

/**
 * REST controller for employee leave request operations.
 * Requirements: 7.1, 9.1, 9.4, 9.5
 */
@RestController
@RequestMapping("/api/leave")
@PreAuthorize("hasAnyRole('EMPLOYEE','MANAGER','ADMINISTRATOR')")
public class LeaveRequestController {

    private final LeaveRequestService leaveRequestService;
    private final LeaveBalanceService leaveBalanceService;
    private final UserRepository userRepository;
    private final LeaveRequestRepository leaveRequestRepository;
    private final LeaveCalendarService leaveCalendarService;

    public LeaveRequestController(LeaveRequestService leaveRequestService,
                                  LeaveBalanceService leaveBalanceService,
                                  UserRepository userRepository,
                                  LeaveRequestRepository leaveRequestRepository,
                                  LeaveCalendarService leaveCalendarService) {
        this.leaveRequestService = leaveRequestService;
        this.leaveBalanceService = leaveBalanceService;
        this.userRepository = userRepository;
        this.leaveRequestRepository = leaveRequestRepository;
        this.leaveCalendarService = leaveCalendarService;
    }

    /**
     * Submit a new leave request.
     * POST /api/leave/requests
     * Requirement 7.1
     */
    @PostMapping("/requests")
    public ResponseEntity<LeaveRequestResponse> submitLeaveRequest(@Valid @RequestBody LeaveRequestDTO dto) {
        User employee = resolveCurrentUser();
        LeaveRequest saved = leaveRequestService.submitLeaveRequest(employee, dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(toResponse(saved));
    }

    /**
     * List the authenticated employee's own leave requests, optionally filtered by status.
     * GET /api/leave/requests?status=PENDING
     * Requirements: 9.4, 9.5
     */
    @GetMapping("/requests")
    public ResponseEntity<List<LeaveRequestResponse>> getMyRequests(
            @RequestParam(required = false) LeaveRequestStatus status) {
        User employee = resolveCurrentUser();
        List<LeaveRequest> requests = (status != null)
                ? leaveRequestRepository.findByEmployeeAndStatus(employee, status)
                : leaveRequestRepository.findByEmployee(employee);
        List<LeaveRequestResponse> responses = requests.stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
        return ResponseEntity.ok(responses);
    }

    /**
     * Get a single leave request by ID (employee can only see their own).
     * GET /api/leave/requests/{id}
     * Requirement 9.4
     */
    @GetMapping("/requests/{id}")
    public ResponseEntity<LeaveRequestResponse> getRequestById(@PathVariable Long id) {
        User employee = resolveCurrentUser();
        LeaveRequest request = leaveRequestRepository.findById(id)
                .filter(r -> r.getEmployee().getId().equals(employee.getId()))
                .orElseThrow(() -> new com.tns.leavemgmt.exception.ResourceNotFoundException(
                        "Leave request not found with id: " + id));
        return ResponseEntity.ok(toResponse(request));
    }

    /**
     * Cancel a leave request.
     * DELETE /api/leave/requests/{id}
     * Requirement 9.5
     */
    @DeleteMapping("/requests/{id}")
    public ResponseEntity<LeaveRequestResponse> cancelRequest(@PathVariable Long id) {
        User employee = resolveCurrentUser();
        LeaveRequest cancelled = leaveRequestService.cancelRequest(id, employee);
        return ResponseEntity.ok(toResponse(cancelled));
    }

    /**
     * Get all leave balances with accrual rates for the authenticated user.
     * GET /api/leave/balance
     * Requirement 9.1
     */
    @GetMapping("/balance")
    public ResponseEntity<List<LeaveBalanceResponse>> getMyBalances() {
        User employee = resolveCurrentUser();
        List<LeaveBalanceResponse> balances = leaveBalanceService.getBalancesForUser(employee);
        return ResponseEntity.ok(balances);
    }

    /**
     * Get the leave calendar for a team within a date range.
     * Includes approved leave entries and public holidays.
     * GET /api/leave/calendar?startDate=&endDate=&teamId=&leaveTypeId=
     * Requirements: 11.1, 11.2, 11.3, 11.4, 11.5, 17.4
     */
    @GetMapping("/calendar")
    public ResponseEntity<List<CalendarEntryResponse>> getCalendar(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam Long teamId,
            @RequestParam(required = false) Long leaveTypeId) {
        List<CalendarEntryResponse> entries =
                leaveCalendarService.getCalendarEntries(teamId, startDate, endDate, leaveTypeId);
        return ResponseEntity.ok(entries);
    }

    // -------------------------------------------------------------------------
    // Helpers
    // -------------------------------------------------------------------------

    private User resolveCurrentUser() {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new com.tns.leavemgmt.exception.ResourceNotFoundException(
                        "Authenticated user not found: " + username));
    }

    private LeaveRequestResponse toResponse(LeaveRequest r) {
        LeaveRequestResponse resp = new LeaveRequestResponse();
        resp.setId(r.getId());
        resp.setEmployeeId(r.getEmployee().getId());
        resp.setEmployeeName(r.getEmployee().getFirstName() + " " + r.getEmployee().getLastName());
        resp.setLeaveTypeId(r.getLeaveType().getId());
        resp.setLeaveTypeName(r.getLeaveType().getName());
        resp.setStartDate(r.getStartDate());
        resp.setEndDate(r.getEndDate());
        resp.setDurationType(r.getDurationType());
        resp.setSessionType(r.getSessionType());
        resp.setDurationInHours(r.getDurationInHours());
        resp.setTotalDays(r.getTotalDays());
        resp.setReason(r.getReason());
        resp.setStatus(r.getStatus());
        if (r.getAssignedManager() != null) {
            resp.setAssignedManagerId(r.getAssignedManager().getId());
            resp.setAssignedManagerName(
                    r.getAssignedManager().getFirstName() + " " + r.getAssignedManager().getLastName());
        }
        resp.setSubmittedAt(r.getSubmittedAt());
        resp.setProcessedAt(r.getProcessedAt());
        return resp;
    }
}
