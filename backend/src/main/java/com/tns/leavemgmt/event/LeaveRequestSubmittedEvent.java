package com.tns.leavemgmt.event;

import com.tns.leavemgmt.entity.LeaveRequest;
import lombok.Getter;
import org.springframework.context.ApplicationEvent;

/**
 * Published when an employee submits a new leave request.
 * Satisfies Requirement 18.1.
 */
@Getter
public class LeaveRequestSubmittedEvent extends ApplicationEvent {

    private final LeaveRequest leaveRequest;

    public LeaveRequestSubmittedEvent(Object source, LeaveRequest leaveRequest) {
        super(source);
        this.leaveRequest = leaveRequest;
    }
}
