package com.tns.leavemgmt.user.service;

import com.tns.leavemgmt.service.AuditService;
import com.tns.leavemgmt.exception.DuplicateUserException;
import com.tns.leavemgmt.exception.ResourceNotFoundException;
import com.tns.leavemgmt.notification.NotificationService;
import com.tns.leavemgmt.security.PasswordService;
import com.tns.leavemgmt.user.dto.CreateUserRequest;
import com.tns.leavemgmt.user.dto.CreateUserResponse;
import com.tns.leavemgmt.user.dto.UpdateUserRequest;
import com.tns.leavemgmt.user.dto.UserResponse;
import com.tns.leavemgmt.entity.Department;
import com.tns.leavemgmt.entity.Role;
import com.tns.leavemgmt.entity.Team;
import com.tns.leavemgmt.entity.User;
import com.tns.leavemgmt.user.repository.DepartmentRepository;
import com.tns.leavemgmt.user.repository.RoleRepository;
import com.tns.leavemgmt.user.repository.TeamRepository;
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
    private final DepartmentRepository departmentRepository;
    private final TeamRepository teamRepository;
    private final PasswordService passwordService;
    private final NotificationService notificationService;
    private final AuditService auditService;

    public UserService(UserRepository userRepository,
                       RoleRepository roleRepository,
                       DepartmentRepository departmentRepository,
                       TeamRepository teamRepository,
                       PasswordService passwordService,
                       NotificationService notificationService,
                       AuditService auditService) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.departmentRepository = departmentRepository;
        this.teamRepository = teamRepository;
        this.passwordService = passwordService;
        this.notificationService = notificationService;
        this.auditService = auditService;
    }

    @Transactional
    public CreateUserResponse createUser(CreateUserRequest request) {
        try {
            log.info("Creating user with username: {}, email: {}, roles: {}", 
                    request.getUsername(), request.getEmail(), request.getRoles());
            
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

            // 6. Resolve Department if provided
            Department department = null;
            if (request.getDepartmentId() != null) {
                department = departmentRepository.findById(request.getDepartmentId())
                        .orElseThrow(() -> new ResourceNotFoundException("Department not found with id: " + request.getDepartmentId()));
            }

            // 7. Resolve Team (manager) if provided
            Team team = null;
            if (request.getManagerId() != null) {
                team = teamRepository.findById(request.getManagerId())
                        .orElse(null);
            }

            // 8. Build User entity
            User user = User.builder()
                    .username(request.getUsername())
                    .email(request.getEmail())
                    .firstName(request.getFirstName())
                    .lastName(request.getLastName())
                    .phone(request.getPhone())
                    .emergencyContact(request.getEmergencyContact())
                    .address(request.getAddress())
                    .passwordHash(hashedPassword)
                    .isActive(true)
                    .roles(roles)
                    .department(department)
                    .team(team)
                    .build();

            // 9. Save user first (required before setting relationships)
            user = userRepository.save(user);
            log.info("Created user account: username={}, email={}, departmentId={}", 
                    user.getUsername(), user.getEmail(), 
                    user.getDepartment() != null ? user.getDepartment().getId() : null);

            // 10. Trigger email notification
            try {
                notificationService.sendAccountCreatedEmail(user, temporaryPassword);
            } catch (Exception e) {
                log.warn("Failed to send account creation email to {}: {}", user.getEmail(), e.getMessage());
            }

            // 11. Return response
            return CreateUserResponse.builder()
                    .userId(user.getId())
                    .username(user.getUsername())
                    .email(user.getEmail())
                    .temporaryPassword(temporaryPassword)
                    .build();
        } catch (Exception e) {
            log.error("Error creating user: {}", e.getMessage(), e);
            throw e;
        }
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
    public List<UserResponse> getUsers(int page, int size, Long departmentId, Boolean active, String role) {
        Pageable pageable = PageRequest.of(page, size);
        Page<User> usersPage = userRepository.findAll(pageable);
        
        return usersPage.stream()
                .filter(u -> departmentId == null || (u.getDepartment() != null && u.getDepartment().getId().equals(departmentId)))
                .filter(u -> active == null || u.getIsActive().equals(active))
                .filter(u -> role == null || u.getRoles().stream().anyMatch(r -> r.getName().equalsIgnoreCase(role)))
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
