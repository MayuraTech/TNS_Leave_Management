package com.tns.leavemgmt.event;

import com.tns.leavemgmt.entity.LeaveRequest;
import com.tns.leavemgmt.entity.User;
import lombok.Getter;
import org.springframework.context.ApplicationEvent;

/**
 * Published when a manager approves a leave request.
 * Satisfies Requirement 18.2.
 */
@Getter
public class LeaveRequestApprovedEvent extends ApplicationEvent {

    private final LeaveRequest leaveRequest;
    private final User approvedBy;
    private final String comments;

    public LeaveRequestApprovedEvent(Object source, LeaveRequest leaveRequest, User approvedBy, String comments) {
        super(source);
        this.leaveRequest = leaveRequest;
        this.approvedBy = approvedBy;
        this.comments = comments;
    }
}
