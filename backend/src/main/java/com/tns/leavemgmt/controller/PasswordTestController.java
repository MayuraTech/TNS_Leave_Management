package com.tns.leavemgmt.controller;

import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/test")
public class PasswordTestController {

    private final BCryptPasswordEncoder encoder = new BCryptPasswordEncoder(12);

    @PostMapping("/hash-password")
    public Map<String, String> hashPassword(@RequestBody Map<String, String> request) {
        String password = request.get("password");
        String hash = encoder.encode(password);
        boolean matches = encoder.matches(password, hash);
        
        return Map.of(
            "password", password,
            "hash", hash,
            "verification", String.valueOf(matches)
        );
    }
    
    @PostMapping("/verify-password")
    public Map<String, String> verifyPassword(@RequestBody Map<String, String> request) {
        String password = request.get("password");
        String hash = request.get("hash");
        boolean matches = encoder.matches(password, hash);
        
        return Map.of(
            "password", password,
            "hash", hash,
            "matches", String.valueOf(matches)
        );
    }
}
