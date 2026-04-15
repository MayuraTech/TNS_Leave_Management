package com.tns.leavemgmt.exception;

import org.springframework.http.HttpStatus;

public class LeaveManagementException extends RuntimeException {

    private final HttpStatus status;

    public LeaveManagementException(String message, HttpStatus status) {
        super(message);
        this.status = status;
    }

    public LeaveManagementException(String message, HttpStatus status, Throwable cause) {
        super(message, cause);
        this.status = status;
    }

    public HttpStatus getStatus() {
        return status;
    }
}
