package com.tns.leavemgmt.event;

import com.tns.leavemgmt.entity.LeaveRequest;
import com.tns.leavemgmt.entity.User;
import lombok.Getter;
import org.springframework.context.ApplicationEvent;

/**
 * Published when a manager approves a leave request.
 * Requirements: 8.4, 8.5
 */
public class LeaveRequestApprovedEvent extends ApplicationEvent {

    private final LeaveRequest leaveRequest;

    public LeaveRequestApprovedEvent(Object source, LeaveRequest leaveRequest) {
        super(source);
        this.leaveRequest = leaveRequest;
    }

    public LeaveRequest getLeaveRequest() {
        return leaveRequest;
    }
}
