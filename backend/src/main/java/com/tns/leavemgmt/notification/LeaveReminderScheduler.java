package com.tns.leavemgmt.notification;

import com.tns.leavemgmt.entity.LeaveRequest;
import com.tns.leavemgmt.repository.LeaveRequestRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.util.List;

/**
 * Scheduled job that sends upcoming-leave reminder emails to employees
 * whose approved leave starts within the next 2 days.
 * Requirement 16.3
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class LeaveReminderScheduler {

    private final LeaveRequestRepository leaveRequestRepository;
    private final NotificationService notificationService;

    /**
     * Runs daily at 08:00 to find approved leaves starting within 2 days and notify employees.
     * Cron: second minute hour day-of-month month day-of-week
     */
    @Scheduled(cron = "0 0 8 * * *")
    public void sendUpcomingLeaveReminders() {
        LocalDate today = LocalDate.now();
        LocalDate twoDaysFromNow = today.plusDays(2);

        log.info("LeaveReminderScheduler: checking for leaves starting between {} and {}",
                today, twoDaysFromNow);

        List<LeaveRequest> upcomingLeaves =
                leaveRequestRepository.findApprovedStartingBetween(today, twoDaysFromNow);

        log.info("LeaveReminderScheduler: found {} upcoming leave(s) to remind", upcomingLeaves.size());

        for (LeaveRequest leaveRequest : upcomingLeaves) {
            try {
                notificationService.sendUpcomingLeaveReminder(leaveRequest);
            } catch (Exception e) {
                log.error("Failed to send upcoming-leave reminder for request id={}: {}",
                        leaveRequest.getId(), e.getMessage(), e);
            }
        }
    }
}
