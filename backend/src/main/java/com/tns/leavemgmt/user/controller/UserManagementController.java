package com.tns.leavemgmt.user.controller;

import com.tns.leavemgmt.user.dto.*;
import com.tns.leavemgmt.entity.User;
import com.tns.leavemgmt.user.repository.UserRepository;
import com.tns.leavemgmt.user.service.ManagerRelationshipService;
import com.tns.leavemgmt.user.service.RoleService;
import com.tns.leavemgmt.user.service.UserService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * REST controller for admin user management operations.
 * All endpoints require ADMINISTRATOR role (Requirements 1.1, 2.1, 3.1, 5.1).
 */
@RestController
@RequestMapping("/api/admin/users")
@PreAuthorize("hasRole('ADMINISTRATOR')")
public class UserManagementController {

    private final UserService userService;
    private final RoleService roleService;
    private final ManagerRelationshipService managerRelationshipService;
    private final UserRepository userRepository;

    public UserManagementController(UserService userService,
                                    RoleService roleService,
                                    ManagerRelationshipService managerRelationshipService,
                                    UserRepository userRepository) {
        this.userService = userService;
        this.roleService = roleService;
        this.managerRelationshipService = managerRelationshipService;
        this.userRepository = userRepository;
    }

    /** POST /api/admin/users — Create a new user account (Req 1.1) */
    @PostMapping
    public ResponseEntity<CreateUserResponse> createUser(
            @Valid @RequestBody CreateUserRequest request) {
        CreateUserResponse response = userService.createUser(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /** GET /api/admin/users — List users with optional filters (Req 1.1) */
    @GetMapping
    public ResponseEntity<List<UserResponse>> getUsers(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) Long departmentId,
            @RequestParam(required = false) Boolean status) {
        List<UserResponse> users = userService.getUsers(page, size, departmentId, status);
        return ResponseEntity.ok(users);
    }

    /** PUT /api/admin/users/{userId} — Update user profile (Req 2.1) */
    @PutMapping("/{userId}")
    public ResponseEntity<User> updateUser(
            @PathVariable Long userId,
            @Valid @RequestBody UpdateUserRequest request,
            @AuthenticationPrincipal UserDetails principal) {
        User admin = resolveUser(principal);
        User updated = userService.updateUser(userId, request, admin);
        return ResponseEntity.ok(updated);
    }

    /** POST /api/admin/users/{userId}/roles — Assign roles to user (Req 3.1) */
    @PostMapping("/{userId}/roles")
    public ResponseEntity<User> assignRoles(
            @PathVariable Long userId,
            @Valid @RequestBody RoleAssignmentRequest request,
            @AuthenticationPrincipal UserDetails principal) {
        User admin = resolveUser(principal);
        User updated = roleService.assignRoles(userId, request.getRoles(), admin);
        return ResponseEntity.ok(updated);
    }

    /** POST /api/admin/users/{userId}/deactivate — Deactivate user account (Req 1.1) */
    @PostMapping("/{userId}/deactivate")
    public ResponseEntity<Map<String, String>> deactivateUser(
            @PathVariable Long userId,
            @AuthenticationPrincipal UserDetails principal) {
        User admin = resolveUser(principal);
        userService.deactivateUser(userId, admin);
        return ResponseEntity.ok(Map.of("message", "User account deactivated successfully"));
    }

    /** POST /api/admin/users/{userId}/reset-password — Reset user password (Req 1.1) */
    @PostMapping("/{userId}/reset-password")
    public ResponseEntity<Map<String, String>> resetPassword(
            @PathVariable Long userId,
            @AuthenticationPrincipal UserDetails principal) {
        User admin = resolveUser(principal);
        userService.resetPassword(userId, admin);
        return ResponseEntity.ok(Map.of("message", "Password reset successfully. New temporary password sent to user."));
    }

    /** PUT /api/admin/users/{userId}/manager — Assign manager to user (Req 5.1) */
    @PutMapping("/{userId}/manager")
    public ResponseEntity<Map<String, String>> assignManager(
            @PathVariable Long userId,
            @Valid @RequestBody AssignManagerRequest request,
            @AuthenticationPrincipal UserDetails principal) {
        User admin = resolveUser(principal);
        managerRelationshipService.assignManager(userId, request.getManagerId(), admin);
        return ResponseEntity.ok(Map.of("message", "Manager assigned successfully"));
    }

    private User resolveUser(UserDetails principal) {
        return userRepository.findByUsername(principal.getUsername())
                .orElseThrow(() -> new IllegalStateException("Authenticated user not found: " + principal.getUsername()));
    }
}
