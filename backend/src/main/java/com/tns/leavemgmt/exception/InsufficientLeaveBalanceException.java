package com.tns.leavemgmt.exception;

import org.springframework.http.HttpStatus;

public class InsufficientLeaveBalanceException extends LeaveManagementException {

    public InsufficientLeaveBalanceException(String message) {
        super(message, HttpStatus.UNPROCESSABLE_ENTITY);
    }
}
