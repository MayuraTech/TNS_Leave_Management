package com.tns.leavemgmt.notification;

import com.tns.leavemgmt.entity.LeaveRequest;
import com.tns.leavemgmt.entity.User;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

/**
 * Email-based implementation of {@link NotificationService} using Spring Mail.
 * Active when {@code spring.mail.username} is configured.
 * Requirements: 1.3, 2.3, 6.5, 16.1, 16.2, 16.3, 16.4, 16.5
 */
@Slf4j
@Service
@RequiredArgsConstructor
@ConditionalOnProperty(name = "spring.mail.username", matchIfMissing = false)
public class EmailNotificationService implements NotificationService {

    private final JavaMailSender mailSender;

    // ── User account notifications ────────────────────────────────────────────

    @Override
    public void sendAccountCreatedEmail(com.tns.leavemgmt.user.entity.User user, String temporaryPassword) {
        String subject = "Welcome to Leave Management System – Your Account Details";
        String body = buildAccountCreatedBody(user, temporaryPassword);
        send(user.getEmail(), subject, body);
    }

    @Override
    public void sendPasswordResetEmail(com.tns.leavemgmt.user.entity.User user, String temporaryPassword) {
        String subject = "Leave Management System – Password Reset";
        String body = buildPasswordResetBody(user, temporaryPassword);
        send(user.getEmail(), subject, body);
    }

    // ── Leave request notifications ───────────────────────────────────────────

    @Override
    public void sendLeaveSubmittedToManager(LeaveRequest leaveRequest, User manager) {
        String subject = "New Leave Request from " + fullName(leaveRequest.getEmployee());
        String body = buildLeaveSubmittedBody(leaveRequest, manager);
        send(manager.getEmail(), subject, body);
    }

    @Override
    public void sendLeaveApprovedToEmployee(LeaveRequest leaveRequest) {
        User employee = leaveRequest.getEmployee();
        String subject = "Your Leave Request Has Been Approved";
        String body = buildLeaveApprovedBody(leaveRequest);
        send(employee.getEmail(), subject, body);
    }

    @Override
    public void sendLeaveDeniedToEmployee(LeaveRequest leaveRequest) {
        User employee = leaveRequest.getEmployee();
        String subject = "Your Leave Request Has Been Denied";
        String body = buildLeaveDeniedBody(leaveRequest);
        send(employee.getEmail(), subject, body);
    }

    @Override
    public void sendLeaveCancelledToManager(LeaveRequest leaveRequest, User manager) {
        String subject = "Leave Request Cancelled by " + fullName(leaveRequest.getEmployee());
        String body = buildLeaveCancelledBody(leaveRequest, manager);
        send(manager.getEmail(), subject, body);
    }

    @Override
    public void sendUpcomingLeaveReminder(LeaveRequest leaveRequest) {
        User employee = leaveRequest.getEmployee();
        String subject = "Reminder: Your Leave Starts Soon";
        String body = buildUpcomingLeaveReminderBody(leaveRequest);
        send(employee.getEmail(), subject, body);
    }

    // ── Internal send helper ──────────────────────────────────────────────────

    private void send(String to, String subject, String htmlBody) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, false, "UTF-8");
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(htmlBody, true);
            mailSender.send(message);
            log.info("Email sent: to={} subject={}", to, subject);
        } catch (MessagingException e) {
            log.error("Failed to send email to {}: {}", to, e.getMessage(), e);
        }
    }

    // ── HTML template builders ────────────────────────────────────────────────

    private String buildAccountCreatedBody(com.tns.leavemgmt.user.entity.User user, String temporaryPassword) {
        return "<html><body>" +
               "<h2>Welcome to the Leave Management System</h2>" +
               "<p>Hello <strong>" + esc(fullNameUser(user)) + "</strong>,</p>" +
               "<p>Your account has been created. Use the credentials below to log in:</p>" +
               "<table><tr><td><strong>Username:</strong></td><td>" + esc(user.getUsername()) + "</td></tr>" +
               "<tr><td><strong>Temporary Password:</strong></td><td>" + esc(temporaryPassword) + "</td></tr></table>" +
               "<p>Please change your password after your first login.</p>" +
               "<p>Regards,<br/>Leave Management System</p>" +
               "</body></html>";
    }

    private String buildPasswordResetBody(com.tns.leavemgmt.user.entity.User user, String temporaryPassword) {
        return "<html><body>" +
               "<h2>Password Reset – Leave Management System</h2>" +
               "<p>Hello <strong>" + esc(fullNameUser(user)) + "</strong>,</p>" +
               "<p>Your password has been reset. Use the temporary password below to log in:</p>" +
               "<table><tr><td><strong>Username:</strong></td><td>" + esc(user.getUsername()) + "</td></tr>" +
               "<tr><td><strong>Temporary Password:</strong></td><td>" + esc(temporaryPassword) + "</td></tr></table>" +
               "<p>Please change your password immediately after logging in.</p>" +
               "<p>Regards,<br/>Leave Management System</p>" +
               "</body></html>";
    }

    private String buildLeaveSubmittedBody(LeaveRequest req, User manager) {
        return "<html><body>" +
               "<h2>New Leave Request Submitted</h2>" +
               "<p>Hello <strong>" + esc(fullName(manager)) + "</strong>,</p>" +
               "<p><strong>" + esc(fullName(req.getEmployee())) + "</strong> has submitted a leave request:</p>" +
               buildLeaveDetailTable(req) +
               "<p>Please log in to review and action this request.</p>" +
               "<p>Regards,<br/>Leave Management System</p>" +
               "</body></html>";
    }

    private String buildLeaveApprovedBody(LeaveRequest req) {
        return "<html><body>" +
               "<h2>Leave Request Approved</h2>" +
               "<p>Hello <strong>" + esc(fullName(req.getEmployee())) + "</strong>,</p>" +
               "<p>Your leave request has been <strong>approved</strong>.</p>" +
               buildLeaveDetailTable(req) +
               (req.getApprovalComments() != null && !req.getApprovalComments().isBlank()
                   ? "<p><strong>Comments:</strong> " + esc(req.getApprovalComments()) + "</p>" : "") +
               "<p>Regards,<br/>Leave Management System</p>" +
               "</body></html>";
    }

    private String buildLeaveDeniedBody(LeaveRequest req) {
        return "<html><body>" +
               "<h2>Leave Request Denied</h2>" +
               "<p>Hello <strong>" + esc(fullName(req.getEmployee())) + "</strong>,</p>" +
               "<p>Your leave request has been <strong>denied</strong>.</p>" +
               buildLeaveDetailTable(req) +
               (req.getApprovalComments() != null && !req.getApprovalComments().isBlank()
                   ? "<p><strong>Reason:</strong> " + esc(req.getApprovalComments()) + "</p>" : "") +
               "<p>Regards,<br/>Leave Management System</p>" +
               "</body></html>";
    }

    private String buildLeaveCancelledBody(LeaveRequest req, User manager) {
        return "<html><body>" +
               "<h2>Leave Request Cancelled</h2>" +
               "<p>Hello <strong>" + esc(fullName(manager)) + "</strong>,</p>" +
               "<p><strong>" + esc(fullName(req.getEmployee())) + "</strong> has cancelled a leave request:</p>" +
               buildLeaveDetailTable(req) +
               "<p>Regards,<br/>Leave Management System</p>" +
               "</body></html>";
    }

    private String buildUpcomingLeaveReminderBody(LeaveRequest req) {
        return "<html><body>" +
               "<h2>Upcoming Leave Reminder</h2>" +
               "<p>Hello <strong>" + esc(fullName(req.getEmployee())) + "</strong>,</p>" +
               "<p>This is a reminder that your approved leave is starting soon:</p>" +
               buildLeaveDetailTable(req) +
               "<p>Regards,<br/>Leave Management System</p>" +
               "</body></html>";
    }

    private String buildLeaveDetailTable(LeaveRequest req) {
        return "<table border='1' cellpadding='6' cellspacing='0'>" +
               "<tr><td><strong>Leave Type</strong></td><td>" +
                   esc(req.getLeaveType() != null ? req.getLeaveType().getName() : "N/A") + "</td></tr>" +
               "<tr><td><strong>Start Date</strong></td><td>" + req.getStartDate() + "</td></tr>" +
               "<tr><td><strong>End Date</strong></td><td>" + req.getEndDate() + "</td></tr>" +
               "<tr><td><strong>Duration</strong></td><td>" + req.getTotalDays() + " day(s)</td></tr>" +
               "<tr><td><strong>Reason</strong></td><td>" + esc(req.getReason()) + "</td></tr>" +
               "</table>";
    }

    // ── Utilities ─────────────────────────────────────────────────────────────

    private String fullName(User user) {
        if (user == null) return "Unknown";
        String fn = user.getFirstName() != null ? user.getFirstName() : "";
        String ln = user.getLastName() != null ? user.getLastName() : "";
        String name = (fn + " " + ln).trim();
        return name.isEmpty() ? user.getUsername() : name;
    }

    private String fullNameUser(com.tns.leavemgmt.user.entity.User user) {
        if (user == null) return "Unknown";
        String fn = user.getFirstName() != null ? user.getFirstName() : "";
        String ln = user.getLastName() != null ? user.getLastName() : "";
        String name = (fn + " " + ln).trim();
        return name.isEmpty() ? user.getUsername() : name;
    }

    /** Basic HTML escaping to prevent XSS in email bodies. */
    private String esc(String value) {
        if (value == null) return "";
        return value.replace("&", "&amp;")
                    .replace("<", "&lt;")
                    .replace(">", "&gt;")
                    .replace("\"", "&quot;");
    }
}
