-- Update admin password to admin123 (simpler password for testing)
-- This hash is generated with BCrypt strength 12
UPDATE users 
SET password_hash = '$2a$12$C2iGHkXvyppvyQrOObHb4uBD62xLR.HR8YmVYMnHn5TZrl8qECisG',
    failed_login_attempts = 0,
    locked_until = NULL
WHERE username = 'admin';

-- Verify the update
SELECT username, email, failed_login_attempts, locked_until 
FROM users 
WHERE username = 'admin';
