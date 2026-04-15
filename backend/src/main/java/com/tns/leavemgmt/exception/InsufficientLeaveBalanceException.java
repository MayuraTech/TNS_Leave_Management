package com.tns.leavemgmt.exception;

public class InsufficientLeaveBalanceException extends LeaveManagementException {

    public InsufficientLeaveBalanceException(String message) {
        super(message, org.springframework.http.HttpStatus.UNPROCESSABLE_ENTITY);
    }
}
