package com.tns.leavemgmt.event;

import com.tns.leavemgmt.entity.LeaveRequest;
import com.tns.leavemgmt.entity.User;
import org.springframework.context.ApplicationEvent;

/**
 * Published when a manager approves a leave request.
 * Requirements: 8.4, 8.5
 */
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

    public LeaveRequest getLeaveRequest() {
        return leaveRequest;
    }

    public User getApprovedBy() {
        return approvedBy;
    }

    public String getComments() {
        return comments;
    }
}
