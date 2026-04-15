package com.tns.leavemgmt.exception;

import org.springframework.http.HttpStatus;

public class ResourceNotFoundException extends LeaveManagementException {

    public ResourceNotFoundException(String message) {
        super(message, HttpStatus.NOT_FOUND);
    }

    public ResourceNotFoundException(String resourceName, Long id) {
        super(resourceName + " not found with id: " + id, HttpStatus.NOT_FOUND);
    }
}
