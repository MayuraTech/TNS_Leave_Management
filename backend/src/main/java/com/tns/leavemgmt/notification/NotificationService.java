package com.tns.leavemgmt.notification;

import com.tns.leavemgmt.user.entity.User;

public interface NotificationService {

    void sendAccountCreatedEmail(User user, String temporaryPassword);

    void sendPasswordResetEmail(User user, String temporaryPassword);
}
