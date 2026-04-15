package com.tns.leavemgmt.service;

import com.tns.leavemgmt.entity.User;
import com.tns.leavemgmt.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthenticationService {

    private static final int MAX_FAILED_ATTEMPTS = 3;
    private static final int LOCKOUT_MINUTES = 15;

    private final UserRepository userRepository;

    /**
     * Looks up a user by username first, then falls back to email.
     */
    public Optional<User> findByUsernameOrEmail(String usernameOrEmail) {
        return userRepository.findByUsername(usernameOrEmail)
                .or(() -> userRepository.findByEmail(usernameOrEmail));
    }

    /**
     * Increments failed login attempts. Locks the account for 15 minutes after 3 failures.
     */
    @Transactional
    public void handleFailedLogin(User user) {
        int attempts = (user.getFailedLoginAttempts() == null ? 0 : user.getFailedLoginAttempts()) + 1;
        user.setFailedLoginAttempts(attempts);

        if (attempts >= MAX_FAILED_ATTEMPTS) {
            user.setLockedUntil(LocalDateTime.now().plusMinutes(LOCKOUT_MINUTES));
            log.warn("Account locked for user '{}' until {}", user.getUsername(), user.getLockedUntil());
        }

        userRepository.save(user);
    }

    /**
     * Resets failed attempts and clears any lockout on successful login.
     */
    @Transactional
    public void handleSuccessfulLogin(User user) {
        user.setFailedLoginAttempts(0);
        user.setLockedUntil(null);
        userRepository.save(user);
    }

    /**
     * Returns true if the account is currently locked.
     * If the lockout period has expired, clears it and returns false.
     */
    @Transactional
    public boolean isAccountLocked(User user) {
        if (user.getLockedUntil() == null) {
            return false;
        }
        if (LocalDateTime.now().isAfter(user.getLockedUntil())) {
            // Lockout expired — clear it
            user.setLockedUntil(null);
            user.setFailedLoginAttempts(0);
            userRepository.save(user);
            return false;
        }
        return true;
    }
}
