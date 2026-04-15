package com.tns.leavemgmt.notification;

import com.tns.leavemgmt.user.entity.User;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Slf4j
@Service
public class LoggingNotificationService implements NotificationService {

    @Override
    public void sendAccountCreatedEmail(User user, String temporaryPassword) {
        log.info("EMAIL [Account Created] To: {} | Username: {} | Temporary Password: {}",
                user.getEmail(), user.getUsername(), temporaryPassword);
    }

    @Override
    public void sendPasswordResetEmail(User user, String temporaryPassword) {
        log.info("EMAIL [Password Reset] To: {} | Username: {} | Temporary Password: {}",
                user.getEmail(), user.getUsername(), temporaryPassword);
    }
}
