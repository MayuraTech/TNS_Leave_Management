package com.tns.leavemgmt.user.service;

import com.tns.leavemgmt.audit.service.AuditService;
import com.tns.leavemgmt.exception.DuplicateUserException;
import com.tns.leavemgmt.exception.ResourceNotFoundException;
import com.tns.leavemgmt.notification.NotificationService;
import com.tns.leavemgmt.security.PasswordService;
import com.tns.leavemgmt.user.dto.CreateUserRequest;
import com.tns.leavemgmt.user.dto.CreateUserResponse;
import com.tns.leavemgmt.user.dto.UpdateUserRequest;
import com.tns.leavemgmt.user.dto.UserResponse;
import com.tns.leavemgmt.entity.Role;
import com.tns.leavemgmt.entity.User;
import com.tns.leavemgmt.user.repository.RoleRepository;
import com.tns.leavemgmt.user.repository.UserRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Slf4j
@Service
public class UserService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordService passwordService;
    private final NotificationService notificationService;
    private final AuditService auditService;

    public UserService(UserRepository userRepository,
                       RoleRepository roleRepository,
                       PasswordService passwordService,
                       NotificationService notificationService,
                       AuditService auditService) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.passwordService = passwordService;
        this.notificationService = notificationService;
        this.auditService = auditService;
    }

    @Transactional
    public CreateUserResponse createUser(CreateUserRequest request) {
        // 1. Check username uniqueness
        if (userRepository.existsByUsername(request.getUsername())) {
            throw DuplicateUserException.forUsername(request.getUsername());
        }

        // 2. Check email uniqueness
        if (userRepository.existsByEmail(request.getEmail())) {
            throw DuplicateUserException.forEmail(request.getEmail());
        }

        // 3. Generate temporary password
        String temporaryPassword = passwordService.generateTemporaryPassword();

        // 4. Hash the temporary password
        String hashedPassword = passwordService.hashPassword(temporaryPassword);

        // 5. Resolve Role entities from role names
        Set<Role> roles = request.getRoles().stream()
                .map(roleName -> roleRepository.findByName(roleName)
                        .orElseThrow(() -> new IllegalArgumentException("Role not found: " + roleName)))
                .collect(Collectors.toSet());

        // 6. Build and save User entity
        User user = User.builder()
                .username(request.getUsername())
                .email(request.getEmail())
                .firstName(request.getFirstName())
                .lastName(request.getLastName())
                .passwordHash(hashedPassword)
                .isActive(true)
                .roles(roles)
                .build();

        user = userRepository.save(user);
        log.info("Created user account: username={}, email={}", user.getUsername(), user.getEmail());

        // 7. Trigger email notification
        notificationService.sendAccountCreatedEmail(user, temporaryPassword);

        // 8. Return response
        return CreateUserResponse.builder()
                .userId(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .temporaryPassword(temporaryPassword)
                .build();
    }

    @Transactional
    public User updateUser(Long userId, UpdateUserRequest request, User performedBy) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> ResourceNotFoundException.forUser(userId));

        // Validate uniqueness of username if changed
        if (request.getUsername() != null && !request.getUsername().equals(user.getUsername())) {
            if (userRepository.existsByUsername(request.getUsername())) {
                throw DuplicateUserException.forUsername(request.getUsername());
            }
        }

        // Validate uniqueness of email if changed
        if (request.getEmail() != null && !request.getEmail().equals(user.getEmail())) {
            if (userRepository.existsByEmail(request.getEmail())) {
                throw DuplicateUserException.forEmail(request.getEmail());
            }
        }

        // Capture old values for audit
        Map<String, String> oldValues = captureUserFields(user);

        // Apply updates
        if (request.getUsername() != null)        user.setUsername(request.getUsername());
        if (request.getEmail() != null)           user.setEmail(request.getEmail());
        if (request.getFirstName() != null)       user.setFirstName(request.getFirstName());
        if (request.getLastName() != null)        user.setLastName(request.getLastName());
        if (request.getPhone() != null)           user.setPhone(request.getPhone());
        if (request.getEmergencyContact() != null) user.setEmergencyContact(request.getEmergencyContact());
        if (request.getAddress() != null)         user.setAddress(request.getAddress());

        user = userRepository.save(user);
        log.info("Updated user profile: userId={} by={}", userId, performedBy.getUsername());

        // Record audit log
        Map<String, String> newValues = captureUserFields(user);
        auditService.recordAudit("User", userId, "PROFILE_UPDATE",
                mapToJson(oldValues), mapToJson(newValues), performedBy);

        return user;
    }

    @Transactional
    public void deactivateUser(Long userId, User performedBy) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> ResourceNotFoundException.forUser(userId));

        user.setIsActive(false);
        userRepository.save(user);
        log.info("Deactivated user account: userId={} by={}", userId, performedBy.getUsername());

        // TODO: Cancel all PENDING leave requests for this user once LeaveRequest module is implemented.
        // Example: leaveRequestRepository.cancelPendingByUserId(userId);

        auditService.recordAudit("User", userId, "ACCOUNT_DEACTIVATED",
                "isActive=true", "isActive=false", performedBy);
    }

    @Transactional
    public void reactivateUser(Long userId, User performedBy) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> ResourceNotFoundException.forUser(userId));

        user.setIsActive(true);
        String temporaryPassword = passwordService.generateTemporaryPassword();
        user.setPasswordHash(passwordService.hashPassword(temporaryPassword));
        userRepository.save(user);
        log.info("Reactivated user account: userId={} by={}", userId, performedBy.getUsername());

        notificationService.sendPasswordResetEmail(user, temporaryPassword);

        auditService.recordAudit("User", userId, "ACCOUNT_REACTIVATED",
                "isActive=false", "isActive=true", performedBy);
    }

    @Transactional
    public void resetPassword(Long userId, User performedBy) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> ResourceNotFoundException.forUser(userId));

        String temporaryPassword = passwordService.generateTemporaryPassword();
        user.setPasswordHash(passwordService.hashPassword(temporaryPassword));
        userRepository.save(user);

        log.info("Password reset for userId={} by={}", userId, performedBy.getUsername());

        notificationService.sendPasswordResetEmail(user, temporaryPassword);

        auditService.recordAudit("User", userId, "PASSWORD_RESET",
                null, "Password reset and emailed to user", performedBy);
    }

    @Transactional(readOnly = true)
    public List<UserResponse> getUsers(int page, int size, Long departmentId, Boolean active) {
        Pageable pageable = PageRequest.of(page, size);
        Page<User> users = userRepository.findAll(pageable);
        return users.stream()
                .filter(u -> departmentId == null
                        || (u.getDepartment() != null && u.getDepartment().getId().equals(departmentId)))
                .filter(u -> active == null || u.getIsActive().equals(active))
                .map(this::toUserResponse)
                .collect(Collectors.toList());
    }

    private UserResponse toUserResponse(User user) {
        Set<String> roleNames = user.getRoles().stream()
                .map(Role::getName)
                .collect(Collectors.toSet());
        return UserResponse.builder()
                .id(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .phone(user.getPhone())
                .address(user.getAddress())
                .isActive(user.getIsActive())
                .roles(roleNames)
                .departmentId(user.getDepartment() != null ? user.getDepartment().getId() : null)
                .departmentName(user.getDepartment() != null ? user.getDepartment().getName() : null)
                .createdAt(user.getCreatedAt())
                .build();
    }

    private Map<String, String> captureUserFields(User user) {
        Map<String, String> fields = new LinkedHashMap<>();
        fields.put("username", user.getUsername());
        fields.put("email", user.getEmail());
        fields.put("firstName", user.getFirstName());
        fields.put("lastName", user.getLastName());
        fields.put("phone", user.getPhone());
        fields.put("emergencyContact", user.getEmergencyContact());
        fields.put("address", user.getAddress());
        return fields;
    }

    private String mapToJson(Map<String, String> map) {
        StringBuilder sb = new StringBuilder("{");
        map.forEach((k, v) -> sb.append("\"").append(k).append("\":\"")
                .append(v != null ? v.replace("\"", "\\\"") : "").append("\","));
        if (sb.charAt(sb.length() - 1) == ',') sb.deleteCharAt(sb.length() - 1);
        sb.append("}");
        return sb.toString();
    }
}
