package com.tns.leavemgmt.exception;

public class ResourceNotFoundException extends LeaveManagementException {

    public ResourceNotFoundException(String message) {
        super(message, "NOT_FOUND");
    }
}
