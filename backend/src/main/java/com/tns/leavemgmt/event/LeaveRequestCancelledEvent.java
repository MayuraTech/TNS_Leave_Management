package com.tns.leavemgmt.event;

import com.tns.leavemgmt.entity.LeaveRequest;
import org.springframework.context.ApplicationEvent;

/**
 * Spring ApplicationEvent published when a leave cancellation is requested.
 * Requirements 12.3, 12.4, 12.5
 */
public class LeaveRequestCancelledEvent extends ApplicationEvent {

    private final LeaveRequest leaveRequest;
    private final boolean requiresManagerApproval;

    public LeaveRequestCancelledEvent(Object source, LeaveRequest leaveRequest, boolean requiresManagerApproval) {
        super(source);
        this.leaveRequest = leaveRequest;
        this.requiresManagerApproval = requiresManagerApproval;
    }

    public LeaveRequest getLeaveRequest() {
        return leaveRequest;
    }

    /**
     * Returns true if the leave has already started and manager approval is required
     * to complete the cancellation (Req 12.4). Returns false for direct cancellations
     * where the leave has not yet started (Req 12.1).
     */
    public boolean isRequiresManagerApproval() {
        return requiresManagerApproval;
    }
}
