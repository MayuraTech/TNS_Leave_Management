package com.tns.leavemgmt.exception;

import org.springframework.http.HttpStatus;

public class OverlappingLeaveRequestException extends LeaveManagementException {

    public OverlappingLeaveRequestException(String message) {
        super(message, HttpStatus.CONFLICT);
    }
}
