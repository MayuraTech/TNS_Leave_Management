package com.tns.leavemgmt.exception;

import org.springframework.http.HttpStatus;

public class PolicyViolationException extends LeaveManagementException {

    public PolicyViolationException(String message) {
        super(message, HttpStatus.UNPROCESSABLE_ENTITY);
    }
}
