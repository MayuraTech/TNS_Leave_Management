package com.tns.leavemgmt.exception;

public class DuplicateUserException extends RuntimeException {

    public DuplicateUserException(String message) {
        super(message);
    }

    public static DuplicateUserException forUsername(String username) {
        return new DuplicateUserException("Username already exists: " + username);
    }

    public static DuplicateUserException forEmail(String email) {
        return new DuplicateUserException("Email already exists: " + email);
    }
}
