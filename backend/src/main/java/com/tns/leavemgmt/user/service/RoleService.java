package com.tns.leavemgmt.user.service;

import com.tns.leavemgmt.audit.service.AuditService;
import com.tns.leavemgmt.exception.ResourceNotFoundException;
import com.tns.leavemgmt.entity.Role;
import com.tns.leavemgmt.entity.User;
import com.tns.leavemgmt.user.repository.RoleRepository;
import com.tns.leavemgmt.user.repository.UserRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Set;
import java.util.stream.Collectors;

@Slf4j
@Service
public class RoleService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final AuditService auditService;

    public RoleService(UserRepository userRepository,
                       RoleRepository roleRepository,
                       AuditService auditService) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.auditService = auditService;
    }

    /**
     * Assigns multiple roles to a user, replacing any existing roles.
     * Permission changes take effect immediately in the database (Req 3.1, 3.2, 3.3, 3.5).
     *
     * @param userId    the target user's ID
     * @param roleNames the set of role names to assign
     * @param performedBy the administrator performing the action
     */
    @Transactional
    public User assignRoles(Long userId, Set<String> roleNames, User performedBy) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> ResourceNotFoundException.forUser(userId));

        Set<Role> newRoles = roleNames.stream()
                .map(name -> roleRepository.findByName(name)
                        .orElseThrow(() -> ResourceNotFoundException.forRole(name)))
                .collect(Collectors.toSet());

        String oldRoles = formatRoles(user.getRoles());

        user.getRoles().clear();
        user.getRoles().addAll(newRoles);
        user = userRepository.save(user);

        String newRolesStr = formatRoles(user.getRoles());
        log.info("Roles assigned to userId={}: {} -> {} by={}", userId, oldRoles, newRolesStr,
                performedBy.getUsername());

        auditService.recordAudit("User", userId, "ROLE_ASSIGNMENT",
                oldRoles, newRolesStr, performedBy);

        return user;
    }

    /**
     * Revokes a specific role from a user.
     * Permission changes take effect immediately in the database (Req 3.4, 3.5).
     *
     * @param userId    the target user's ID
     * @param roleName  the name of the role to revoke
     * @param performedBy the administrator performing the action
     */
    @Transactional
    public User revokeRole(Long userId, String roleName, User performedBy) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> ResourceNotFoundException.forUser(userId));

        Role role = roleRepository.findByName(roleName)
                .orElseThrow(() -> ResourceNotFoundException.forRole(roleName));

        String oldRoles = formatRoles(user.getRoles());

        boolean removed = user.getRoles().remove(role);
        if (!removed) {
            log.warn("Role '{}' was not assigned to userId={}, nothing to revoke", roleName, userId);
        }

        user = userRepository.save(user);

        String newRoles = formatRoles(user.getRoles());
        log.info("Role '{}' revoked from userId={}: {} -> {} by={}", roleName, userId, oldRoles,
                newRoles, performedBy.getUsername());

        auditService.recordAudit("User", userId, "ROLE_REVOCATION",
                oldRoles, newRoles, performedBy);

        return user;
    }

    private String formatRoles(Set<Role> roles) {
        return roles.stream()
                .map(Role::getName)
                .sorted()
                .collect(Collectors.joining(",", "[", "]"));
    }
}
