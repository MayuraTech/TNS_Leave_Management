package com.tns.leavemgmt.exception;

public class LeaveManagementException extends RuntimeException {

    private final String errorCode;

    public LeaveManagementException(String message, String errorCode) {
        super(message);
        this.errorCode = errorCode;
    }

    public String getErrorCode() {
        return errorCode;
    }
}
