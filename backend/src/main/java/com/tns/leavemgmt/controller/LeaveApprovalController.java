package com.tns.leavemgmt.controller;

import com.tns.leavemgmt.dto.ApproveLeaveRequest;
import com.tns.leavemgmt.dto.DenyLeaveRequest;
import com.tns.leavemgmt.dto.LeaveRequestResponse;
import com.tns.leavemgmt.entity.LeaveRequest;
import com.tns.leavemgmt.entity.enums.LeaveRequestStatus;
import com.tns.leavemgmt.entity.User;
import com.tns.leavemgmt.exception.ResourceNotFoundException;
import com.tns.leavemgmt.repository.LeaveRequestRepository;
import com.tns.leavemgmt.user.repository.UserRepository;
import com.tns.leavemgmt.service.LeaveApprovalService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

/**
 * REST controller for manager leave approval operations.
 * Requirements: 8.1, 8.2, 8.3
 */
@RestController
public class LeaveApprovalController {

    private final LeaveApprovalService leaveApprovalService;
    private final LeaveRequestRepository leaveRequestRepository;
    private final UserRepository userRepository;

    public LeaveApprovalController(LeaveApprovalService leaveApprovalService,
                                   LeaveRequestRepository leaveRequestRepository,
                                   UserRepository userRepository) {
        this.leaveApprovalService = leaveApprovalService;
        this.leaveRequestRepository = leaveRequestRepository;
        this.userRepository = userRepository;
    }

    /**
     * Approve a leave request.
     * PUT /api/leave/requests/{id}/approve
     * Requirements: 8.1, 8.2
     */
    @PutMapping("/api/leave/requests/{id}/approve")
    @PreAuthorize("hasAnyRole('MANAGER','ADMINISTRATOR')")
    public ResponseEntity<LeaveRequestResponse> approveRequest(
            @PathVariable Long id,
            @RequestBody ApproveLeaveRequest body) {
        User manager = resolveCurrentUser();
        LeaveRequest updated = leaveApprovalService.approveRequest(id, manager, body.getComments());
        return ResponseEntity.ok(toResponse(updated));
    }

    /**
     * Deny a leave request.
     * PUT /api/leave/requests/{id}/deny
     * Requirements: 8.1, 8.3
     */
    @PutMapping("/api/leave/requests/{id}/deny")
    @PreAuthorize("hasAnyRole('MANAGER','ADMINISTRATOR')")
    public ResponseEntity<LeaveRequestResponse> denyRequest(
            @PathVariable Long id,
            @Valid @RequestBody DenyLeaveRequest body) {
        User manager = resolveCurrentUser();
        LeaveRequest updated = leaveApprovalService.denyRequest(id, manager, body.getReason());
        return ResponseEntity.ok(toResponse(updated));
    }

    /**
     * Get all pending requests from the manager's direct reports.
     * GET /api/manager/pending-requests
     * Requirement: 8.1
     */
    @GetMapping("/api/manager/pending-requests")
    @PreAuthorize("hasAnyRole('MANAGER','ADMINISTRATOR')")
    public ResponseEntity<List<LeaveRequestResponse>> getPendingRequests() {
        User manager = resolveCurrentUser();
        List<LeaveRequest> pending = leaveRequestRepository
                .findByAssignedManagerAndStatus(manager, LeaveRequestStatus.PENDING);
        List<LeaveRequestResponse> responses = pending.stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
        return ResponseEntity.ok(responses);
    }

    // -------------------------------------------------------------------------
    // Helpers
    // -------------------------------------------------------------------------

    private User resolveCurrentUser() {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException(
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
        if (r.getApprovedBy() != null) {
            resp.setApprovedById(r.getApprovedBy().getId());
        }
        resp.setApprovalComments(r.getApprovalComments());
        resp.setSubmittedAt(r.getSubmittedAt());
        resp.setProcessedAt(r.getProcessedAt());
        return resp;
    }
}
