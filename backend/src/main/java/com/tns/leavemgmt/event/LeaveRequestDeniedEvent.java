package com.tns.leavemgmt.event;

import com.tns.leavemgmt.entity.LeaveRequest;
import com.tns.leavemgmt.entity.User;
import org.springframework.context.ApplicationEvent;

/**
 * Published when a manager denies a leave request.
 * Requirement: 8.4
 */
public class LeaveRequestDeniedEvent extends ApplicationEvent {

    private final LeaveRequest leaveRequest;
    private final User deniedBy;
    private final String reason;

    public LeaveRequestDeniedEvent(Object source, LeaveRequest leaveRequest, User deniedBy, String reason) {
        super(source);
        this.leaveRequest = leaveRequest;
        this.deniedBy = deniedBy;
        this.reason = reason;
    }

    public LeaveRequest getLeaveRequest() {
        return leaveRequest;
    }

    public User getDeniedBy() {
        return deniedBy;
    }

    public String getReason() {
        return reason;
    }
}
