package com.tns.leavemgmt.notification;

import com.tns.leavemgmt.entity.LeaveRequest;
import com.tns.leavemgmt.entity.User;
import com.tns.leavemgmt.event.LeaveRequestApprovedEvent;
import com.tns.leavemgmt.event.LeaveRequestCancelledEvent;
import com.tns.leavemgmt.event.LeaveRequestDeniedEvent;
import com.tns.leavemgmt.event.LeaveRequestSubmittedEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;

/**
 * Listens to domain events and delegates to {@link NotificationService} to send emails.
 * Requirements: 16.1, 16.2, 16.4
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class NotificationEventListener {

    private final NotificationService notificationService;

    /**
     * Req 16.1 – when a leave request is submitted, notify the assigned manager.
     */
    @Async
    @EventListener
    public void onLeaveRequestSubmitted(LeaveRequestSubmittedEvent event) {
        LeaveRequest req = event.getLeaveRequest();
        User manager = req.getAssignedManager();

        if (manager == null) {
            log.warn("No manager assigned for leave request id={}; skipping submission notification.",
                    req.getId());
            return;
        }

        try {
            notificationService.sendLeaveSubmittedToManager(req, manager);
        } catch (Exception e) {
            log.error("Failed to send leave-submitted notification for request id={}: {}",
                    req.getId(), e.getMessage(), e);
        }
    }

    /**
     * Req 16.2 – when a leave request is approved, notify the employee.
     */
    @Async
    @EventListener
    public void onLeaveRequestApproved(LeaveRequestApprovedEvent event) {
        LeaveRequest req = event.getLeaveRequest();
        try {
            notificationService.sendLeaveApprovedToEmployee(req);
        } catch (Exception e) {
            log.error("Failed to send leave-approved notification for request id={}: {}",
                    req.getId(), e.getMessage(), e);
        }
    }

    /**
     * Req 16.2 – when a leave request is denied, notify the employee.
     */
    @Async
    @EventListener
    public void onLeaveRequestDenied(LeaveRequestDeniedEvent event) {
        LeaveRequest req = event.getLeaveRequest();
        try {
            notificationService.sendLeaveDeniedToEmployee(req);
        } catch (Exception e) {
            log.error("Failed to send leave-denied notification for request id={}: {}",
                    req.getId(), e.getMessage(), e);
        }
    }

    /**
     * Req 16.4 – when a leave request is cancelled, notify the assigned manager.
     */
    @Async
    @EventListener
    public void onLeaveRequestCancelled(LeaveRequestCancelledEvent event) {
        LeaveRequest req = event.getLeaveRequest();
        User manager = req.getAssignedManager();

        if (manager == null) {
            log.warn("No manager assigned for leave request id={}; skipping cancellation notification.",
                    req.getId());
            return;
        }

        try {
            notificationService.sendLeaveCancelledToManager(req, manager);
        } catch (Exception e) {
            log.error("Failed to send leave-cancelled notification for request id={}: {}",
                    req.getId(), e.getMessage(), e);
        }
    }
}
