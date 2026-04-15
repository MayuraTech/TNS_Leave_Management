package com.tns.leavemgmt.service;

import com.tns.leavemgmt.dto.LeaveRequestDTO;
import com.tns.leavemgmt.entity.*;
import com.tns.leavemgmt.event.LeaveRequestCancelledEvent;
import com.tns.leavemgmt.event.LeaveRequestSubmittedEvent;
import com.tns.leavemgmt.exception.CancellationNotAllowedException;
import com.tns.leavemgmt.exception.InsufficientLeaveBalanceException;
import com.tns.leavemgmt.exception.OverlappingLeaveRequestException;
import com.tns.leavemgmt.exception.ResourceNotFoundException;
import com.tns.leavemgmt.repository.LeaveRequestRepository;
import com.tns.leavemgmt.repository.LeaveTypeRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

/**
 * Service for submitting and managing leave requests.
 * Requirements: 7.1, 7.2, 7.3, 7.4, 7.7, 7.8, 7.9, 10.5
 */
@Service
@Transactional
public class LeaveRequestService {

    private static final Logger log = LoggerFactory.getLogger(LeaveRequestService.class);

    private static final BigDecimal HOURS_PER_DAY = new BigDecimal("8");
    private static final BigDecimal HALF_DAY = new BigDecimal("0.5");
    private static final BigDecimal MIN_HOURLY_DURATION = new BigDecimal("0.5");
    private static final BigDecimal MAX_HOURLY_DURATION = new BigDecimal("8.0");

    private final LeaveTypeRepository leaveTypeRepository;
    private final LeaveRequestRepository leaveRequestRepository;
    private final LeaveBalanceService leaveBalanceService;
    private final ManagerRelationshipService managerRelationshipService;
    private final ApplicationEventPublisher eventPublisher;

    public LeaveRequestService(LeaveTypeRepository leaveTypeRepository,
                               LeaveRequestRepository leaveRequestRepository,
                               LeaveBalanceService leaveBalanceService,
                               ManagerRelationshipService managerRelationshipService,
                               ApplicationEventPublisher eventPublisher) {
        this.leaveTypeRepository = leaveTypeRepository;
        this.leaveRequestRepository = leaveRequestRepository;
        this.leaveBalanceService = leaveBalanceService;
        this.managerRelationshipService = managerRelationshipService;
        this.eventPublisher = eventPublisher;
    }

    /**
     * Submits a leave request for the given employee.
     *
     * Validates:
     * - Sufficient leave balance (Req 7.1)
     * - No overlapping requests (Req 7.7)
     * - Min notice period from LeavePolicy (Req 10.5) - TODO when LeavePolicy entity exists
     * - Duration type constraints (Req 7.2, 7.3, 7.4)
     *
     * Assigns the request to the employee's manager (Req 7.8) and publishes a
     * submission event to trigger notifications (Req 7.9).
     *
     * @param employee the employee submitting the request
     * @param dto      the leave request data
     * @return the saved LeaveRequest with status PENDING
     */
    public LeaveRequest submitLeaveRequest(User employee, LeaveRequestDTO dto) {
        // Step 1: Load LeaveType
        LeaveType leaveType = leaveTypeRepository.findById(dto.getLeaveTypeId())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Leave type not found with id: " + dto.getLeaveTypeId()));

        // Step 2: Validate duration type constraints (service-level double-check)
        validateDurationTypeConstraints(dto);

        // Step 3: Validate leave balance (Req 7.1)
        validateBalance(employee, leaveType, dto);

        // Step 4: Check for overlapping requests (Req 7.7)
        checkOverlappingRequests(employee, dto);

        // Step 5: Validate min notice period from LeavePolicy (Req 10.5)
        // TODO: Implement when LeavePolicy entity and repository are available.
        //       Example:
        //         leavePolicy.getMinNoticeDays() -> compare with LocalDate.now() vs dto.getStartDate()
        //         if violated, throw new PolicyViolationException("Request violates minimum notice period of X days");

        // Step 6: Assign manager (Req 7.8)
        Optional<User> manager = managerRelationshipService.findManagerForEmployee(employee);
        if (manager.isEmpty()) {
            log.warn("No manager found for employee id={}. Request will be submitted without manager assignment.",
                    employee.getId());
        }

        // Step 7: Calculate totalDays
        BigDecimal totalDays = calculateTotalDays(dto);

        // Step 8: Build and save the LeaveRequest
        LeaveRequest leaveRequest = new LeaveRequest();
        leaveRequest.setEmployee(employee);
        leaveRequest.setLeaveType(leaveType);
        leaveRequest.setStartDate(dto.getStartDate());
        leaveRequest.setEndDate(dto.getEndDate());
        leaveRequest.setDurationType(dto.getDurationType());
        leaveRequest.setSessionType(dto.getSessionType());
        leaveRequest.setDurationInHours(dto.getDurationInHours());
        leaveRequest.setTotalDays(totalDays);
        leaveRequest.setReason(dto.getReason());
        leaveRequest.setStatus(LeaveRequestStatus.PENDING);
        manager.ifPresent(leaveRequest::setAssignedManager);

        LeaveRequest saved = leaveRequestRepository.save(leaveRequest);

        // Step 9: Publish submission event to trigger notification (Req 7.9)
        eventPublisher.publishEvent(new LeaveRequestSubmittedEvent(this, saved));

        return saved;
    }

    /**
     * Cancels a leave request on behalf of the requesting employee.
     *
     * If the leave has not yet started (Req 12.1):
     *   - Sets status to CANCELLED and restores the leave balance (Req 12.2)
     *   - Publishes a LeaveRequestCancelledEvent to notify the manager and update the calendar (Req 12.3, 12.5)
     *
     * If the leave has already started (Req 12.4):
     *   - Publishes a LeaveRequestCancelledEvent with requiresManagerApproval=true so the manager is notified
     *   - Throws CancellationNotAllowedException; actual cancellation happens via the approval workflow
     *
     * @param requestId      the id of the leave request to cancel
     * @param requestingUser the employee requesting the cancellation
     * @return the updated LeaveRequest (only returned for direct cancellations)
     * @throws ResourceNotFoundException       if the request does not exist
     * @throws CancellationNotAllowedException if the user is not the owner, the status is not cancellable,
     *                                         or the leave has already started
     */
    public LeaveRequest cancelRequest(Long requestId, User requestingUser) {
        // Load the request
        LeaveRequest request = leaveRequestRepository.findById(requestId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Leave request not found with id: " + requestId));

        // Verify ownership
        if (!request.getEmployee().getId().equals(requestingUser.getId())) {
            throw new CancellationNotAllowedException(
                    "You are not authorised to cancel this leave request.");
        }

        // Only PENDING or APPROVED requests can be cancelled
        LeaveRequestStatus status = request.getStatus();
        if (status == LeaveRequestStatus.DENIED || status == LeaveRequestStatus.CANCELLED) {
            throw new CancellationNotAllowedException(
                    "Leave request cannot be cancelled because its current status is: " + status);
        }

        boolean leaveNotStarted = LocalDate.now().isBefore(request.getStartDate());

        if (leaveNotStarted) {
            // Direct cancellation (Req 12.1, 12.2, 12.5)
            request.setStatus(LeaveRequestStatus.CANCELLED);
            request.setProcessedAt(java.time.LocalDateTime.now());

            // Restore balance (Req 12.2)
            if (request.getDurationType() == LeaveDurationType.HOURLY) {
                leaveBalanceService.restoreHours(
                        request.getEmployee(), request.getLeaveType(), request.getDurationInHours());
            } else {
                leaveBalanceService.restoreBalance(
                        request.getEmployee(), request.getLeaveType(), request.getTotalDays());
            }

            LeaveRequest saved = leaveRequestRepository.save(request);

            // Notify manager and update calendar (Req 12.3, 12.5)
            eventPublisher.publishEvent(new LeaveRequestCancelledEvent(this, saved, false));

            return saved;
        } else {
            // Leave already started — manager approval required (Req 12.4)
            // Notify manager via event so they can act on the approval workflow
            eventPublisher.publishEvent(new LeaveRequestCancelledEvent(this, request, true));

            throw new CancellationNotAllowedException(
                    "Leave has already started. Manager approval is required to cancel the remaining days.");
        }
    }

    /**
     * Validates duration type constraints at the service level.
     * The DTO Bean Validation handles most of this, but we double-check here for safety.
     * Requirements: 7.3, 7.4
     */
    private void validateDurationTypeConstraints(LeaveRequestDTO dto) {
        if (dto.getDurationType() == LeaveDurationType.HALF_DAY) {
            if (!dto.getStartDate().equals(dto.getEndDate())) {
                throw new IllegalArgumentException("Half-day leave must have the same start and end date");
            }
            if (dto.getSessionType() == null) {
                throw new IllegalArgumentException("Session type (MORNING/AFTERNOON) is required for half-day leave");
            }
        }

        if (dto.getDurationType() == LeaveDurationType.HOURLY) {
            if (!dto.getStartDate().equals(dto.getEndDate())) {
                throw new IllegalArgumentException("Hourly leave must have the same start and end date");
            }
            if (dto.getDurationInHours() == null) {
                throw new IllegalArgumentException("Duration in hours is required for hourly leave");
            }
            if (dto.getDurationInHours().compareTo(MIN_HOURLY_DURATION) < 0
                    || dto.getDurationInHours().compareTo(MAX_HOURLY_DURATION) > 0) {
                throw new IllegalArgumentException(
                        "Duration in hours must be between 0.5 and 8.0 for hourly leave");
            }
        }
    }

    /**
     * Validates that the employee has sufficient balance for the requested leave.
     * For HOURLY leave, checks hours balance; for FULL_DAY/HALF_DAY, checks days balance.
     * Requirement 7.1
     */
    private void validateBalance(User employee, LeaveType leaveType, LeaveRequestDTO dto) {
        if (dto.getDurationType() == LeaveDurationType.HOURLY) {
            BigDecimal availableHours = leaveBalanceService.getAvailableHours(employee, leaveType);
            if (availableHours.compareTo(dto.getDurationInHours()) < 0) {
                throw new InsufficientLeaveBalanceException(
                        String.format("Insufficient hourly leave balance. Available: %s hours, Requested: %s hours",
                                availableHours, dto.getDurationInHours()));
            }
        } else {
            BigDecimal requiredDays = calculateTotalDays(dto);
            BigDecimal availableDays = leaveBalanceService.getAvailableBalance(employee, leaveType);
            if (availableDays.compareTo(requiredDays) < 0) {
                throw new InsufficientLeaveBalanceException(
                        String.format("Insufficient leave balance. Available: %s days, Requested: %s days",
                                availableDays, requiredDays));
            }
        }
    }

    /**
     * Checks for overlapping PENDING or APPROVED leave requests.
     * Requirement 7.7
     */
    private void checkOverlappingRequests(User employee, LeaveRequestDTO dto) {
        List<LeaveRequest> overlapping = leaveRequestRepository.findOverlappingRequests(
                employee.getId(), dto.getStartDate(), dto.getEndDate());

        if (!overlapping.isEmpty()) {
            throw new OverlappingLeaveRequestException(
                    "A leave request already exists for the selected dates. " +
                    "Please choose different dates or cancel the existing request.");
        }
    }

    /**
     * Calculates the total days for the leave request.
     * - FULL_DAY: calendar days between startDate and endDate (inclusive).
     *   TODO: Integrate WorkingDayCalculator to exclude weekends/holidays.
     * - HALF_DAY: 0.5 days
     * - HOURLY: durationInHours / 8
     */
    private BigDecimal calculateTotalDays(LeaveRequestDTO dto) {
        return switch (dto.getDurationType()) {
            case HALF_DAY -> HALF_DAY;
            case HOURLY -> dto.getDurationInHours().divide(HOURS_PER_DAY, 4, RoundingMode.HALF_UP);
            case FULL_DAY -> {
                // TODO: Replace with WorkingDayCalculator to exclude weekends and public holidays
                long calendarDays = dto.getStartDate().until(dto.getEndDate()).getDays() + 1;
                yield BigDecimal.valueOf(calendarDays);
            }
        };
    }
}
