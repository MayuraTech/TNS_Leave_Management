package com.tns.leavemgmt.service;

import com.tns.leavemgmt.entity.enums.LeaveDurationType;
import com.tns.leavemgmt.entity.LeaveRequest;
import com.tns.leavemgmt.entity.enums.LeaveRequestStatus;
import com.tns.leavemgmt.entity.User;
import com.tns.leavemgmt.event.LeaveRequestApprovedEvent;
import com.tns.leavemgmt.event.LeaveRequestDeniedEvent;
import com.tns.leavemgmt.exception.ResourceNotFoundException;
import com.tns.leavemgmt.repository.LeaveRequestRepository;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

/**
 * Service for approving and denying leave requests.
 * Requirements: 8.2, 8.3, 8.4, 8.5
 */
@Service
@Transactional
public class LeaveApprovalService {

    private final LeaveRequestRepository leaveRequestRepository;
    private final LeaveBalanceService leaveBalanceService;
    private final ApplicationEventPublisher eventPublisher;

    public LeaveApprovalService(LeaveRequestRepository leaveRequestRepository,
                                LeaveBalanceService leaveBalanceService,
                                ApplicationEventPublisher eventPublisher) {
        this.leaveRequestRepository = leaveRequestRepository;
        this.leaveBalanceService = leaveBalanceService;
        this.eventPublisher = eventPublisher;
    }

    /**
     * Approves a leave request, deducting the employee's balance and publishing
     * an event to notify the employee and update the leave calendar.
     *
     * Requirements: 8.2 (deduct balance), 8.4 (notify employee), 8.5 (update calendar)
     *
     * @param requestId the id of the leave request to approve
     * @param manager   the manager performing the approval
     * @param comments  optional approval comments
     * @return the updated LeaveRequest with status APPROVED
     * @throws ResourceNotFoundException if the request does not exist
     * @throws IllegalStateException     if the request is not PENDING or the manager is not authorised
     */
    public LeaveRequest approveRequest(Long requestId, User manager, String comments) {
        LeaveRequest request = leaveRequestRepository.findById(requestId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Leave request not found with id: " + requestId));

        if (request.getStatus() != LeaveRequestStatus.PENDING) {
            throw new IllegalStateException(
                    "Only PENDING requests can be approved. Current status: " + request.getStatus());
        }

        validateManagerAuthorisation(manager, request);

        // Deduct balance (Req 8.2)
        if (request.getDurationType() == LeaveDurationType.HOURLY) {
            leaveBalanceService.deductHours(
                    request.getEmployee(), request.getLeaveType(), request.getDurationInHours());
        } else {
            leaveBalanceService.deductBalance(
                    request.getEmployee(), request.getLeaveType(), request.getTotalDays());
        }

        request.setStatus(LeaveRequestStatus.APPROVED);
        request.setApprovedBy(manager);
        request.setApprovalComments(comments);
        request.setProcessedAt(LocalDateTime.now());

        LeaveRequest saved = leaveRequestRepository.save(request);

        // Notify employee and update calendar (Req 8.4, 8.5)
        eventPublisher.publishEvent(new LeaveRequestApprovedEvent(this, saved, manager, comments));

        return saved;
    }

    /**
     * Denies a leave request, requiring a non-blank reason, and notifies the employee.
     *
     * Requirements: 8.3 (denial reason required), 8.4 (notify employee)
     *
     * @param requestId the id of the leave request to deny
     * @param manager   the manager performing the denial
     * @param reason    the reason for denial (must not be blank)
     * @return the updated LeaveRequest with status DENIED
     * @throws ResourceNotFoundException if the request does not exist
     * @throws IllegalStateException     if the request is not PENDING or the manager is not authorised
     * @throws IllegalArgumentException  if the denial reason is blank
     */
    public LeaveRequest denyRequest(Long requestId, User manager, String reason) {
        LeaveRequest request = leaveRequestRepository.findById(requestId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Leave request not found with id: " + requestId));

        if (request.getStatus() != LeaveRequestStatus.PENDING) {
            throw new IllegalStateException(
                    "Only PENDING requests can be denied. Current status: " + request.getStatus());
        }

        // Req 8.3: denial reason is mandatory
        if (reason == null || reason.isBlank()) {
            throw new IllegalArgumentException("Denial reason is required");
        }

        validateManagerAuthorisation(manager, request);

        request.setStatus(LeaveRequestStatus.DENIED);
        request.setApprovedBy(manager);
        request.setApprovalComments(reason);
        request.setProcessedAt(LocalDateTime.now());

        LeaveRequest saved = leaveRequestRepository.save(request);

        // Notify employee (Req 8.4)
        eventPublisher.publishEvent(new LeaveRequestDeniedEvent(this, saved, manager, reason));

        return saved;
    }

    /**
     * Validates that the given manager is either the assigned manager on the request
     * or holds the ADMINISTRATOR role.
     */
    private void validateManagerAuthorisation(User manager, LeaveRequest request) {
        boolean isAssignedManager = request.getAssignedManager() != null
                && manager.getId().equals(request.getAssignedManager().getId());

        boolean isAdministrator = manager.getRoles().stream()
                .anyMatch(role -> "ADMINISTRATOR".equals(role.getName()));

        if (!isAssignedManager && !isAdministrator) {
            throw new IllegalStateException(
                    "Manager is not authorised to process this leave request");
        }
    }
}
