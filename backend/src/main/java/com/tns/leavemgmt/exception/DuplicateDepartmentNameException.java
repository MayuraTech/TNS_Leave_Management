package com.tns.leavemgmt.exception;

public class DuplicateDepartmentNameException extends RuntimeException {

    public DuplicateDepartmentNameException(String name) {
        super("Department name already exists: " + name);
    }
}
