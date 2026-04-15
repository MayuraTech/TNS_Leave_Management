package com.tns.leavemgmt.exception;

public class OverlappingLeaveRequestException extends LeaveManagementException {

    public OverlappingLeaveRequestException(String message) {
        super(message, "OVERLAPPING_REQUEST");
    }
}
