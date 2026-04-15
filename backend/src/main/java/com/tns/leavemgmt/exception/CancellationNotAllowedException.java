package com.tns.leavemgmt.exception;

/**
 * Thrown when a leave request cancellation is not permitted.
 * Requirements: 12.1, 12.4
 */
public class CancellationNotAllowedException extends LeaveManagementException {

    public CancellationNotAllowedException(String message) {
        super(message, "CANCELLATION_NOT_ALLOWED");
    }
}
