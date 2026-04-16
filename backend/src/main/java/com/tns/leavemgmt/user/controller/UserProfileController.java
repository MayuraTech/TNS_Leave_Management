package com.tns.leavemgmt.user.controller;

import com.tns.leavemgmt.entity.User;
import com.tns.leavemgmt.exception.DuplicateUserException;
import com.tns.leavemgmt.service.AuditService;
import com.tns.leavemgmt.user.dto.UserResponse;
import com.tns.leavemgmt.user.repository.UserRepository;
import com.tns.leavemgmt.user.service.UserService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * Self-service profile endpoints — any authenticated user can update their own username.
 */
@RestController
@RequestMapping("/api/users/me")
public class UserProfileController {

    private final UserRepository userRepository;
    private final UserService userService;
    private final AuditService auditService;

    public UserProfileController(UserRepository userRepository,
                                 UserService userService,
                                 AuditService auditService) {
        this.userRepository = userRepository;
        this.userService = userService;
        this.auditService = auditService;
    }

    /**
     * PATCH /api/users/me/username — Update own username.
     */
    @PatchMapping("/username")
    @Transactional
    public ResponseEntity<UserResponse> updateUsername(
            @RequestBody Map<String, String> body,
            @AuthenticationPrincipal UserDetails principal) {

        String newUsername = body.get("username");
        if (newUsername == null || newUsername.isBlank() || newUsername.length() < 3) {
            throw new IllegalArgumentException("Username must be at least 3 characters.");
        }

        User user = userRepository.findByUsername(principal.getUsername())
                .orElseThrow(() -> new IllegalStateException("User not found"));

        if (newUsername.equals(user.getUsername())) {
            return ResponseEntity.ok(userService.getUserById(user.getId()));
        }

        if (userRepository.existsByUsername(newUsername)) {
            throw DuplicateUserException.forUsername(newUsername);
        }

        String oldUsername = user.getUsername();
        user.setUsername(newUsername);
        userRepository.save(user);

        auditService.recordAudit("User", user.getId(), "USERNAME_CHANGED",
                "username=" + oldUsername, "username=" + newUsername, user);

        return ResponseEntity.ok(userService.getUserById(user.getId()));
    }
}
