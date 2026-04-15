package com.tns.leavemgmt.notification;

import com.tns.leavemgmt.entity.LeaveRequest;
import com.tns.leavemgmt.entity.User;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.stereotype.Service;

/**
 * Fallback notification service that logs notifications instead of sending emails.
 * Active when {@code spring.mail.username} is not configured (i.e. EmailNotificationService is absent).
 */
@Slf4j
@Service
@ConditionalOnMissingBean(EmailNotificationService.class)
public class LoggingNotificationService implements NotificationService {

    @Override
    public void sendAccountCreatedEmail(User user, String temporaryPassword) {
        log.info("EMAIL [Account Created] To: {} | Username: {} | Temporary Password: {}",
                user.getEmail(), user.getUsername(), temporaryPassword);
    }

    @Override
    public void sendPasswordResetEmail(User user, String temporaryPassword) {
        log.info("EMAIL [Password Reset] To: {} | Username: {} | Temporary Password: {}",
                user.getEmail(), user.getUsername(), temporaryPassword);
    }

    @Override
    public void sendLeaveSubmittedToManager(LeaveRequest leaveRequest, User manager) {
        log.info("EMAIL [Leave Submitted] To Manager: {} | Employee: {} | Dates: {} to {}",
                manager.getEmail(),
                leaveRequest.getEmployee().getUsername(),
                leaveRequest.getStartDate(),
                leaveRequest.getEndDate());
    }

    @Override
    public void sendLeaveApprovedToEmployee(LeaveRequest leaveRequest) {
        log.info("EMAIL [Leave Approved] To Employee: {} | Dates: {} to {}",
                leaveRequest.getEmployee().getEmail(),
                leaveRequest.getStartDate(),
                leaveRequest.getEndDate());
    }

    @Override
    public void sendLeaveDeniedToEmployee(LeaveRequest leaveRequest) {
        log.info("EMAIL [Leave Denied] To Employee: {} | Dates: {} to {}",
                leaveRequest.getEmployee().getEmail(),
                leaveRequest.getStartDate(),
                leaveRequest.getEndDate());
    }

    @Override
    public void sendLeaveCancelledToManager(LeaveRequest leaveRequest, User manager) {
        log.info("EMAIL [Leave Cancelled] To Manager: {} | Employee: {} | Dates: {} to {}",
                manager.getEmail(),
                leaveRequest.getEmployee().getUsername(),
                leaveRequest.getStartDate(),
                leaveRequest.getEndDate());
    }

    @Override
    public void sendUpcomingLeaveReminder(LeaveRequest leaveRequest) {
        log.info("EMAIL [Upcoming Leave Reminder] To Employee: {} | Dates: {} to {}",
                leaveRequest.getEmployee().getEmail(),
                leaveRequest.getStartDate(),
                leaveRequest.getEndDate());
    }
}
