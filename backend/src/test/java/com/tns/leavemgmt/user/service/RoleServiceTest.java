package com.tns.leavemgmt.user.service;

import com.tns.leavemgmt.audit.service.AuditService;
import com.tns.leavemgmt.exception.ResourceNotFoundException;
import com.tns.leavemgmt.user.entity.Role;
import com.tns.leavemgmt.user.entity.User;
import com.tns.leavemgmt.user.repository.RoleRepository;
import com.tns.leavemgmt.user.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.HashSet;
import java.util.Optional;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * Unit tests for RoleService.
 * Validates Requirements: 3.5 (role changes immediately update permissions)
 */
@ExtendWith(MockitoExtension.class)
class RoleServiceTest {

    @Mock private UserRepository userRepository;
    @Mock private RoleRepository roleRepository;
    @Mock private AuditService auditService;

    @InjectMocks
    private RoleService roleService;

    private User adminUser;
    private Role employeeRole;
    private Role managerRole;
    private Role adminRole;

    @BeforeEach
    void setUp() {
        adminUser = User.builder()
                .id(1L)
                .username("admin")
                .email("admin@example.com")
                .passwordHash("hash")
                .isActive(true)
                .build();

        employeeRole = Role.builder().id(1L).name("EMPLOYEE").build();
        managerRole  = Role.builder().id(2L).name("MANAGER").build();
        adminRole    = Role.builder().id(3L).name("ADMINISTRATOR").build();
    }

    // ── Requirement 3.5: Role changes immediately update permissions ─────────

    @Nested
    @DisplayName("Role assignment updates permissions immediately (Req 3.5)")
    class RoleAssignment {

        @Test
        @DisplayName("Should replace existing roles with new set on assignRoles")
        void assignRoles_replacesExistingRoles() {
            User target = userWithRoles(Set.of(employeeRole));
            when(userRepository.findById(5L)).thenReturn(Optional.of(target));
            when(roleRepository.findByName("MANAGER")).thenReturn(Optional.of(managerRole));
            when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));

            User result = roleService.assignRoles(5L, Set.of("MANAGER"), adminUser);

            assertThat(result.getRoles()).containsExactly(managerRole);
            assertThat(result.getRoles()).doesNotContain(employeeRole);
        }

        @Test
        @DisplayName("Should persist role changes immediately (save is called)")
        void assignRoles_persistsImmediately() {
            User target = userWithRoles(Set.of(employeeRole));
            when(userRepository.findById(5L)).thenReturn(Optional.of(target));
            when(roleRepository.findByName("ADMINISTRATOR")).thenReturn(Optional.of(adminRole));
            when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));

            roleService.assignRoles(5L, Set.of("ADMINISTRATOR"), adminUser);

            verify(userRepository).save(argThat(u -> u.getRoles().contains(adminRole)));
        }

        @Test
        @DisplayName("Should assign multiple roles at once")
        void assignRoles_multipleRoles_allAssigned() {
            User target = userWithRoles(new HashSet<>());
            when(userRepository.findById(5L)).thenReturn(Optional.of(target));
            when(roleRepository.findByName("EMPLOYEE")).thenReturn(Optional.of(employeeRole));
            when(roleRepository.findByName("MANAGER")).thenReturn(Optional.of(managerRole));
            when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));

            User result = roleService.assignRoles(5L, Set.of("EMPLOYEE", "MANAGER"), adminUser);

            assertThat(result.getRoles()).containsExactlyInAnyOrder(employeeRole, managerRole);
        }

        @Test
        @DisplayName("Should record audit log on role assignment")
        void assignRoles_recordsAuditLog() {
            User target = userWithRoles(Set.of(employeeRole));
            when(userRepository.findById(5L)).thenReturn(Optional.of(target));
            when(roleRepository.findByName("MANAGER")).thenReturn(Optional.of(managerRole));
            when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));

            roleService.assignRoles(5L, Set.of("MANAGER"), adminUser);

            verify(auditService).recordAudit(
                    eq("User"), eq(5L), eq("ROLE_ASSIGNMENT"),
                    anyString(), anyString(), eq(adminUser));
        }

        @Test
        @DisplayName("Should throw ResourceNotFoundException when user does not exist")
        void assignRoles_userNotFound_throwsResourceNotFoundException() {
            when(userRepository.findById(99L)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> roleService.assignRoles(99L, Set.of("EMPLOYEE"), adminUser))
                    .isInstanceOf(ResourceNotFoundException.class);
        }

        @Test
        @DisplayName("Should throw ResourceNotFoundException when role name is unknown")
        void assignRoles_unknownRole_throwsResourceNotFoundException() {
            User target = userWithRoles(new HashSet<>());
            when(userRepository.findById(5L)).thenReturn(Optional.of(target));
            when(roleRepository.findByName("UNKNOWN_ROLE")).thenReturn(Optional.empty());

            assertThatThrownBy(() -> roleService.assignRoles(5L, Set.of("UNKNOWN_ROLE"), adminUser))
                    .isInstanceOf(ResourceNotFoundException.class);
        }
    }

    @Nested
    @DisplayName("Role revocation (Req 3.4, 3.5)")
    class RoleRevocation {

        @Test
        @DisplayName("Should remove the specified role from user")
        void revokeRole_removesRole() {
            User target = userWithRoles(new HashSet<>(Set.of(employeeRole, managerRole)));
            when(userRepository.findById(5L)).thenReturn(Optional.of(target));
            when(roleRepository.findByName("MANAGER")).thenReturn(Optional.of(managerRole));
            when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));

            User result = roleService.revokeRole(5L, "MANAGER", adminUser);

            assertThat(result.getRoles()).containsExactly(employeeRole);
            assertThat(result.getRoles()).doesNotContain(managerRole);
        }

        @Test
        @DisplayName("Should persist revocation immediately (save is called)")
        void revokeRole_persistsImmediately() {
            User target = userWithRoles(new HashSet<>(Set.of(managerRole)));
            when(userRepository.findById(5L)).thenReturn(Optional.of(target));
            when(roleRepository.findByName("MANAGER")).thenReturn(Optional.of(managerRole));
            when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));

            roleService.revokeRole(5L, "MANAGER", adminUser);

            verify(userRepository).save(argThat(u -> !u.getRoles().contains(managerRole)));
        }

        @Test
        @DisplayName("Should record audit log on role revocation")
        void revokeRole_recordsAuditLog() {
            User target = userWithRoles(new HashSet<>(Set.of(managerRole)));
            when(userRepository.findById(5L)).thenReturn(Optional.of(target));
            when(roleRepository.findByName("MANAGER")).thenReturn(Optional.of(managerRole));
            when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));

            roleService.revokeRole(5L, "MANAGER", adminUser);

            verify(auditService).recordAudit(
                    eq("User"), eq(5L), eq("ROLE_REVOCATION"),
                    anyString(), anyString(), eq(adminUser));
        }
    }

    // ── Helper ───────────────────────────────────────────────────────────────

    private User userWithRoles(Set<Role> roles) {
        return User.builder()
                .id(5L)
                .username("target")
                .email("target@example.com")
                .passwordHash("hash")
                .isActive(true)
                .roles(new HashSet<>(roles))
                .build();
    }
}
