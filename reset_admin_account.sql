-- Reset admin account lockout
UPDATE users 
SET failed_login_attempts = 0, 
    locked_until = NULL 
WHERE username = 'admin';
