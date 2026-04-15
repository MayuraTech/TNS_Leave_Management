package com.tns.leavemgmt.exception;

public class PolicyViolationException extends LeaveManagementException {

    public PolicyViolationException(String message) {
        super(message, "POLICY_VIOLATION");
    }
}
