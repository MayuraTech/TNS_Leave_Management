package com.tns.leavemgmt.exception;

public class DuplicateLeaveTypeNameException extends RuntimeException {

    public DuplicateLeaveTypeNameException(String name) {
        super("Leave type name already exists: " + name);
    }
}
