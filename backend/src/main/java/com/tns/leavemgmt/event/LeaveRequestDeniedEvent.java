package com.tns.leavemgmt.event;

import com.tns.leavemgmt.entity.LeaveRequest;
import org.springframework.context.ApplicationEvent;

/**
 * Published when a manager denies a leave request.
 * Requirement: 8.4
 */
public class LeaveRequestDeniedEvent extends ApplicationEvent {

    private final LeaveRequest leaveRequest;

    public LeaveRequestDeniedEvent(Object source, LeaveRequest leaveRequest) {
        super(source);
        this.leaveRequest = leaveRequest;
    }

    public LeaveRequest getLeaveRequest() {
        return leaveRequest;
    }
}
