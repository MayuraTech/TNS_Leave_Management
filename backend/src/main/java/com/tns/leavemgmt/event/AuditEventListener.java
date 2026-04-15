package com.tns.leavemgmt.event;

import com.tns.leavemgmt.entity.LeaveBalance;
import com.tns.leavemgmt.entity.LeaveRequest;
import com.tns.leavemgmt.entity.User;
import com.tns.leavemgmt.service.AuditService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;

/**
 * Listens to domain events and delegates to AuditService to persist audit log entries.
 * Covers Requirements 18.1, 18.2, 18.3, 18.4.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class AuditEventListener {

    private static final String ENTITY_LEAVE_REQUEST = "LeaveRequest";
    private static final String ENTITY_LEAVE_BALANCE  = "LeaveBalance";
    private static final String ENTITY_USER           = "User";

    private final AuditService auditService;

    /**
     * Req 18.1 – record leave request submissions.
     */
    @EventListener
    public void onLeaveRequestSubmitted(LeaveRequestSubmittedEvent event) {
        LeaveRequest req = event.getLeaveRequest();
        String newValue = buildLeaveRequestSummary(req);

        auditService.recordAudit(
                ENTITY_LEAVE_REQUEST,
                req.getId(),
                "SUBMITTED",
                null,
                newValue,
                req.getEmployee()
        );
    }

    /**
     * Req 18.2 – record approval actions with manager and comments.
     */
    @EventListener
    public void onLeaveRequestApproved(LeaveRequestApprovedEvent event) {
        LeaveRequest req = event.getLeaveRequest();
        String oldValue = "status=PENDING";
        String newValue = "status=APPROVED; approvedBy=" + username(event.getApprovedBy())
                + "; comments=" + nullSafe(event.getComments());

        auditService.recordAudit(
                ENTITY_LEAVE_REQUEST,
                req.getId(),
                "APPROVED",
                oldValue,
                newValue,
                event.getApprovedBy()
        );
    }

    /**
     * Req 18.2 – record denial actions with manager and reason.
     */
    @EventListener
    public void onLeaveRequestDenied(LeaveRequestDeniedEvent event) {
        LeaveRequest req = event.getLeaveRequest();
        String oldValue = "status=PENDING";
        String newValue = "status=DENIED; deniedBy=" + username(event.getDeniedBy())
                + "; reason=" + nullSafe(event.getReason());

        auditService.recordAudit(
                ENTITY_LEAVE_REQUEST,
                req.getId(),
                "DENIED",
                oldValue,
                newValue,
                event.getDeniedBy()
        );
    }

    /**
     * Req 18.3 – record leave balance adjustments with administrator and reason.
     */
    @EventListener
    public void onLeaveBalanceAdjusted(LeaveBalanceAdjustedEvent event) {
        LeaveBalance balance = event.getLeaveBalance();
        String oldValue = "availableDays=" + event.getPreviousAvailableDays();
        String newValue = "availableDays=" + balance.getAvailableDays()
                + "; adjustment=" + event.getAdjustment()
                + "; reason=" + nullSafe(event.getReason())
                + "; adjustedBy=" + username(event.getAdjustedBy());

        auditService.recordAudit(
                ENTITY_LEAVE_BALANCE,
                balance.getId(),
                "ADJUSTED",
                oldValue,
                newValue,
                event.getAdjustedBy()
        );
    }

    /**
     * Req 18.4 – record user account creation, modification, and deactivation/reactivation.
     */
    @EventListener
    public void onUserAccountChanged(UserAccountChangedEvent event) {
        User affected = event.getAffectedUser();
        String actionType = event.getChangeType().name();

        auditService.recordAudit(
                ENTITY_USER,
                affected.getId(),
                actionType,
                event.getOldValue(),
                event.getNewValue(),
                event.getPerformedBy()
        );
    }

    // ── helpers ──────────────────────────────────────────────────────────────

    private String buildLeaveRequestSummary(LeaveRequest req) {
        return "employee=" + username(req.getEmployee())
                + "; leaveType=" + (req.getLeaveType() != null ? req.getLeaveType().getName() : "null")
                + "; startDate=" + req.getStartDate()
                + "; endDate=" + req.getEndDate()
                + "; durationType=" + req.getDurationType()
                + "; totalDays=" + req.getTotalDays()
                + "; reason=" + nullSafe(req.getReason());
    }

    private String username(User user) {
        return user != null ? user.getUsername() : "system";
    }

    private String nullSafe(String value) {
        return value != null ? value : "";
    }
}
