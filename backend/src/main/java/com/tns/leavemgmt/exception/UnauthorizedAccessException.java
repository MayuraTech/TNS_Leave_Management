package com.tns.leavemgmt.exception;

import org.springframework.http.HttpStatus;

public class UnauthorizedAccessException extends LeaveManagementException {

    public UnauthorizedAccessException(String message) {
        super(message, HttpStatus.FORBIDDEN);
    }
}
