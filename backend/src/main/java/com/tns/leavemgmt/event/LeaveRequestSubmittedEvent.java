package com.tns.leavemgmt.event;

import com.tns.leavemgmt.entity.LeaveRequest;
import org.springframework.context.ApplicationEvent;

/**
 * Spring ApplicationEvent published when a leave request is successfully submitted.
 * Requirement 7.9
 */
public class LeaveRequestSubmittedEvent extends ApplicationEvent {

    private final LeaveRequest leaveRequest;

    public LeaveRequestSubmittedEvent(Object source, LeaveRequest leaveRequest) {
        super(source);
        this.leaveRequest = leaveRequest;
    }

    public LeaveRequest getLeaveRequest() {
        return leaveRequest;
    }
}
