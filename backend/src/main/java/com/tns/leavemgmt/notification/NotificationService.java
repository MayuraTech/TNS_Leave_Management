package com.tns.leavemgmt.notification;

import com.tns.leavemgmt.entity.LeaveRequest;
import com.tns.leavemgmt.entity.User;

/**
 * Contract for all email notifications in the Leave Management System.
 * Requirements: 1.3, 2.3, 6.5, 16.1, 16.2, 16.3, 16.4, 16.5
 */
public interface NotificationService {

    // ── User account notifications (Req 1.3, 2.3, 6.5) ──────────────────────

    void sendAccountCreatedEmail(com.tns.leavemgmt.user.entity.User user, String temporaryPassword);

    void sendPasswordResetEmail(com.tns.leavemgmt.user.entity.User user, String temporaryPassword);

    // ── Leave request notifications (Req 16.1 – 16.4) ────────────────────────

    /** Req 16.1 – notify manager when a leave request is submitted. */
    void sendLeaveSubmittedToManager(LeaveRequest leaveRequest, User manager);

    /** Req 16.2 – notify employee when their leave request is approved. */
    void sendLeaveApprovedToEmployee(LeaveRequest leaveRequest);

    /** Req 16.2 – notify employee when their leave request is denied. */
    void sendLeaveDeniedToEmployee(LeaveRequest leaveRequest);

    /** Req 16.4 – notify manager when a leave request is cancelled. */
    void sendLeaveCancelledToManager(LeaveRequest leaveRequest, User manager);

    /** Req 16.3 – send upcoming-leave reminder to employee. */
    void sendUpcomingLeaveReminder(LeaveRequest leaveRequest);
}
