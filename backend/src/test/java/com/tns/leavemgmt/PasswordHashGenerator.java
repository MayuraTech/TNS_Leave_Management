package com.tns.leavemgmt;

import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

public class PasswordHashGenerator {
    public static void main(String[] args) {
        BCryptPasswordEncoder encoder = new BCryptPasswordEncoder(12);
        String password = "Password123!";
        String hash = encoder.encode(password);
        System.out.println("Password: " + password);
        System.out.println("BCrypt Hash: " + hash);
        System.out.println("Verification: " + encoder.matches(password, hash));
        
        // Test the existing hash
        String existingHash = "$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMESaEGEYs.yrpMBGKUYW36jqe";
        System.out.println("\nTesting existing hash:");
        System.out.println("Matches 'Password123!': " + encoder.matches("Password123!", existingHash));
    }
}
