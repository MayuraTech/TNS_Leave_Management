package com.tns.leavemgmt.service;

import com.tns.leavemgmt.entity.User;
import com.tns.leavemgmt.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/**
 * Unit tests for AuthenticationService.
 * Requirements: 14.1, 14.8
 */
@ExtendWith(MockitoExtension.class)
class AuthenticationServiceTest {

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private AuthenticationService authenticationService;

    private User user;

    @BeforeEach
    void setUp() {
        user = new User();
        user.setId(1L);
        user.setUsername("jdoe");
        user.setEmail("jdoe@example.com");
        user.setPasswordHash("$2a$12$hashedpassword");
        user.setIsActive(true);
        user.setFailedLoginAttempts(0);
        user.setLockedUntil(null);
    }

    // -------------------------------------------------------------------------
    // handleSuccessfulLogin
    // -------------------------------------------------------------------------

    /**
     * Requirement 14.8: Successful login resets failed attempts counter and clears lockout.
     */
    @Test
    void handleSuccessfulLogin_resetsFailedAttemptsToZero() {
        user.setFailedLoginAttempts(2);
        user.setLockedUntil(LocalDateTime.now().plusMinutes(10));

        when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));

        authenticationService.handleSuccessfulLogin(user);

        ArgumentCaptor<User> captor = ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(captor.capture());
        User saved = captor.getValue();

        assertThat(saved.getFailedLoginAttempts()).isZero();
        assertThat(saved.getLockedUntil()).isNull();
    }

    /**
     * Requirement 14.8: Successful login on a clean account still saves with zero attempts.
     */
    @Test
    void handleSuccessfulLogin_withNoFailedAttempts_savesWithZeroAttempts() {
        when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));

        authenticationService.handleSuccessfulLogin(user);

        ArgumentCaptor<User> captor = ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(captor.capture());
        assertThat(captor.getValue().getFailedLoginAttempts()).isZero();
        assertThat(captor.getValue().getLockedUntil()).isNull();
    }

    // -------------------------------------------------------------------------
    // handleFailedLogin
    // -------------------------------------------------------------------------

    /**
     * Requirement 14.8: First failed login increments counter to 1, no lockout yet.
     */
    @Test
    void handleFailedLogin_firstFailure_incrementsCounterToOne() {
        when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));

        authenticationService.handleFailedLogin(user);

        ArgumentCaptor<User> captor = ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(captor.capture());
        User saved = captor.getValue();

        assertThat(saved.getFailedLoginAttempts()).isEqualTo(1);
        assertThat(saved.getLockedUntil()).isNull();
    }

    /**
     * Requirement 14.8: Second failed login increments counter to 2, no lockout yet.
     */
    @Test
    void handleFailedLogin_secondFailure_incrementsCounterToTwo() {
        user.setFailedLoginAttempts(1);
        when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));

        authenticationService.handleFailedLogin(user);

        ArgumentCaptor<User> captor = ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(captor.capture());
        User saved = captor.getValue();

        assertThat(saved.getFailedLoginAttempts()).isEqualTo(2);
        assertThat(saved.getLockedUntil()).isNull();
    }

    /**
     * Requirement 14.8: Third consecutive failed login locks the account for 15 minutes.
     */
    @Test
    void handleFailedLogin_thirdFailure_locksAccountFor15Minutes() {
        user.setFailedLoginAttempts(2);
        when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));

        LocalDateTime before = LocalDateTime.now().plusMinutes(14).plusSeconds(59);

        authenticationService.handleFailedLogin(user);

        ArgumentCaptor<User> captor = ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(captor.capture());
        User saved = captor.getValue();

        assertThat(saved.getFailedLoginAttempts()).isEqualTo(3);
        assertThat(saved.getLockedUntil()).isNotNull();
        assertThat(saved.getLockedUntil()).isAfter(before);
        assertThat(saved.getLockedUntil()).isBefore(LocalDateTime.now().plusMinutes(16));
    }

    /**
     * Requirement 14.8: handleFailedLogin handles null failedLoginAttempts gracefully (treats as 0).
     */
    @Test
    void handleFailedLogin_withNullAttempts_treatsAsZeroAndIncrementsToOne() {
        user.setFailedLoginAttempts(null);
        when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));

        authenticationService.handleFailedLogin(user);

        ArgumentCaptor<User> captor = ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(captor.capture());
        assertThat(captor.getValue().getFailedLoginAttempts()).isEqualTo(1);
    }

    // -------------------------------------------------------------------------
    // isAccountLocked
    // -------------------------------------------------------------------------

    /**
     * Requirement 14.8: Account with no lockout timestamp is not locked.
     */
    @Test
    void isAccountLocked_withNoLockout_returnsFalse() {
        boolean locked = authenticationService.isAccountLocked(user);
        assertThat(locked).isFalse();
        verify(userRepository, never()).save(any());
    }

    /**
     * Requirement 14.8: Account with active lockout (in the future) is locked.
     */
    @Test
    void isAccountLocked_withActiveLockout_returnsTrue() {
        user.setLockedUntil(LocalDateTime.now().plusMinutes(10));

        boolean locked = authenticationService.isAccountLocked(user);

        assertThat(locked).isTrue();
        verify(userRepository, never()).save(any());
    }

    /**
     * Requirement 14.8: Account whose lockout has expired is unlocked and cleared.
     */
    @Test
    void isAccountLocked_withExpiredLockout_returnsFalseAndClearsLockout() {
        user.setLockedUntil(LocalDateTime.now().minusMinutes(1));
        user.setFailedLoginAttempts(3);
        when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));

        boolean locked = authenticationService.isAccountLocked(user);

        assertThat(locked).isFalse();
        ArgumentCaptor<User> captor = ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(captor.capture());
        User saved = captor.getValue();
        assertThat(saved.getLockedUntil()).isNull();
        assertThat(saved.getFailedLoginAttempts()).isZero();
    }

    /**
     * Requirement 14.8: Locked account is rejected even with correct credentials scenario —
     * isAccountLocked returns true while lockout is still active.
     */
    @Test
    void isAccountLocked_lockedAccountRemainsLockedDuringLockoutPeriod() {
        user.setFailedLoginAttempts(3);
        user.setLockedUntil(LocalDateTime.now().plusMinutes(15));

        boolean locked = authenticationService.isAccountLocked(user);

        assertThat(locked).isTrue();
    }

    // -------------------------------------------------------------------------
    // findByUsernameOrEmail
    // -------------------------------------------------------------------------

    /**
     * Requirement 14.1 / 14.2: findByUsernameOrEmail resolves a user by username.
     */
    @Test
    void findByUsernameOrEmail_withUsername_returnsUser() {
        when(userRepository.findByUsername("jdoe")).thenReturn(Optional.of(user));

        Optional<User> result = authenticationService.findByUsernameOrEmail("jdoe");

        assertThat(result).isPresent().contains(user);
        verify(userRepository).findByUsername("jdoe");
        verify(userRepository, never()).findByEmail(any());
    }

    /**
     * Requirement 14.1 / 14.3: findByUsernameOrEmail falls back to email when username not found.
     */
    @Test
    void findByUsernameOrEmail_withEmail_returnsUser() {
        when(userRepository.findByUsername("jdoe@example.com")).thenReturn(Optional.empty());
        when(userRepository.findByEmail("jdoe@example.com")).thenReturn(Optional.of(user));

        Optional<User> result = authenticationService.findByUsernameOrEmail("jdoe@example.com");

        assertThat(result).isPresent().contains(user);
        verify(userRepository).findByUsername("jdoe@example.com");
        verify(userRepository).findByEmail("jdoe@example.com");
    }

    /**
     * Requirement 14.1: findByUsernameOrEmail returns empty when neither username nor email matches.
     */
    @Test
    void findByUsernameOrEmail_withUnknownIdentifier_returnsEmpty() {
        when(userRepository.findByUsername("unknown")).thenReturn(Optional.empty());
        when(userRepository.findByEmail("unknown")).thenReturn(Optional.empty());

        Optional<User> result = authenticationService.findByUsernameOrEmail("unknown");

        assertThat(result).isEmpty();
    }
}
