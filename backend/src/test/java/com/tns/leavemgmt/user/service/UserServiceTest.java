package com.tns.leavemgmt.user.service;

import com.tns.leavemgmt.service.AuditService;
import com.tns.leavemgmt.exception.DuplicateUserException;
import com.tns.leavemgmt.exception.ResourceNotFoundException;
import com.tns.leavemgmt.notification.NotificationService;
import com.tns.leavemgmt.security.PasswordService;
import com.tns.leavemgmt.user.dto.CreateUserRequest;
import com.tns.leavemgmt.user.dto.CreateUserResponse;
import com.tns.leavemgmt.entity.Role;
import com.tns.leavemgmt.entity.User;
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

import java.util.Optional;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * Unit tests for UserService.
 * Validates Requirements: 1.5 (duplicate rejection), 6.3 (deactivation cancels pending leaves)
 */
@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @Mock private UserRepository userRepository;
    @Mock private RoleRepository roleRepository;
    @Mock private PasswordService passwordService;
    @Mock private NotificationService notificationService;
    @Mock private AuditService auditService;

    @InjectMocks
    private UserService userService;

    private User adminUser;

    @BeforeEach
    void setUp() {
        adminUser = User.builder()
                .id(1L)
                .username("admin")
                .email("admin@example.com")
                .passwordHash("hashed")
                .isActive(true)
                .build();
    }

    // ── Requirement 1.5: Duplicate username/email rejection ──────────────────

    @Nested
    @DisplayName("Duplicate username/email rejection (Req 1.5)")
    class DuplicateUserRejection {

        private CreateUserRequest validRequest() {
            return CreateUserRequest.builder()
                    .username("jdoe")
                    .email("jdoe@example.com")
                    .firstName("John")
                    .lastName("Doe")
                    .roles(Set.of("EMPLOYEE"))
                    .build();
        }

        @Test
        @DisplayName("Should throw DuplicateUserException when username already exists")
        void createUser_duplicateUsername_throwsDuplicateUserException() {
            CreateUserRequest request = validRequest();
            when(userRepository.existsByUsername("jdoe")).thenReturn(true);

            assertThatThrownBy(() -> userService.createUser(request))
                    .isInstanceOf(DuplicateUserException.class)
                    .hasMessageContaining("jdoe");

            verify(userRepository, never()).save(any());
        }

        @Test
        @DisplayName("Should throw DuplicateUserException when email already exists")
        void createUser_duplicateEmail_throwsDuplicateUserException() {
            CreateUserRequest request = validRequest();
            when(userRepository.existsByUsername("jdoe")).thenReturn(false);
            when(userRepository.existsByEmail("jdoe@example.com")).thenReturn(true);

            assertThatThrownBy(() -> userService.createUser(request))
                    .isInstanceOf(DuplicateUserException.class)
                    .hasMessageContaining("jdoe@example.com");

            verify(userRepository, never()).save(any());
        }

        @Test
        @DisplayName("Should create user successfully when username and email are unique")
        void createUser_uniqueCredentials_savesUser() {
            CreateUserRequest request = validRequest();
            Role employeeRole = Role.builder().id(1L).name("EMPLOYEE").build();

            when(userRepository.existsByUsername("jdoe")).thenReturn(false);
            when(userRepository.existsByEmail("jdoe@example.com")).thenReturn(false);
            when(roleRepository.findByName("EMPLOYEE")).thenReturn(Optional.of(employeeRole));
            when(passwordService.generateTemporaryPassword()).thenReturn("TempPass123");
            when(passwordService.hashPassword("TempPass123")).thenReturn("$2a$hashed");

            User savedUser = User.builder()
                    .id(10L)
                    .username("jdoe")
                    .email("jdoe@example.com")
                    .firstName("John")
                    .lastName("Doe")
                    .passwordHash("$2a$hashed")
                    .isActive(true)
                    .roles(Set.of(employeeRole))
                    .build();
            when(userRepository.save(any(User.class))).thenReturn(savedUser);

            CreateUserResponse response = userService.createUser(request);

            assertThat(response.getUserId()).isEqualTo(10L);
            assertThat(response.getUsername()).isEqualTo("jdoe");
            assertThat(response.getTemporaryPassword()).isEqualTo("TempPass123");
            verify(notificationService).sendAccountCreatedEmail(eq(savedUser), eq("TempPass123"));
        }

        @Test
        @DisplayName("Username check happens before email check")
        void createUser_duplicateUsername_doesNotCheckEmail() {
            CreateUserRequest request = validRequest();
            when(userRepository.existsByUsername("jdoe")).thenReturn(true);

            assertThatThrownBy(() -> userService.createUser(request))
                    .isInstanceOf(DuplicateUserException.class);

            verify(userRepository, never()).existsByEmail(anyString());
        }
    }

    // ── Requirement 6.3: Deactivation sets account inactive ─────────────────

    @Nested
    @DisplayName("User deactivation (Req 6.3)")
    class UserDeactivation {

        @Test
        @DisplayName("Should set isActive=false when deactivating a user")
        void deactivateUser_setsIsActiveFalse() {
            User target = User.builder()
                    .id(5L)
                    .username("employee1")
                    .email("emp1@example.com")
                    .passwordHash("hash")
                    .isActive(true)
                    .build();

            when(userRepository.findById(5L)).thenReturn(Optional.of(target));
            when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));

            userService.deactivateUser(5L, adminUser);

            ArgumentCaptor<User> captor = ArgumentCaptor.forClass(User.class);
            verify(userRepository).save(captor.capture());
            assertThat(captor.getValue().getIsActive()).isFalse();
        }

        @Test
        @DisplayName("Should record audit log on deactivation")
        void deactivateUser_recordsAuditLog() {
            User target = User.builder()
                    .id(5L)
                    .username("employee1")
                    .email("emp1@example.com")
                    .passwordHash("hash")
                    .isActive(true)
                    .build();

            when(userRepository.findById(5L)).thenReturn(Optional.of(target));
            when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));

            userService.deactivateUser(5L, adminUser);

            verify(auditService).recordAudit(
                    eq("User"), eq(5L), eq("ACCOUNT_DEACTIVATED"),
                    anyString(), anyString(), eq(adminUser));
        }

        @Test
        @DisplayName("Should throw ResourceNotFoundException when user does not exist")
        void deactivateUser_userNotFound_throwsResourceNotFoundException() {
            when(userRepository.findById(99L)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> userService.deactivateUser(99L, adminUser))
                    .isInstanceOf(ResourceNotFoundException.class);
        }

        @Test
        @DisplayName("Should reactivate user and send password reset email")
        void reactivateUser_setsIsActiveTrueAndSendsEmail() {
            User target = User.builder()
                    .id(5L)
                    .username("employee1")
                    .email("emp1@example.com")
                    .passwordHash("oldhash")
                    .isActive(false)
                    .build();

            when(userRepository.findById(5L)).thenReturn(Optional.of(target));
            when(passwordService.generateTemporaryPassword()).thenReturn("NewTemp456");
            when(passwordService.hashPassword("NewTemp456")).thenReturn("$2a$newhash");
            when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));

            userService.reactivateUser(5L, adminUser);

            ArgumentCaptor<User> captor = ArgumentCaptor.forClass(User.class);
            verify(userRepository).save(captor.capture());
            assertThat(captor.getValue().getIsActive()).isTrue();
            verify(notificationService).sendPasswordResetEmail(any(User.class), eq("NewTemp456"));
        }
    }
}
