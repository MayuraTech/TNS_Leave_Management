-- Update admin password to Password123!
-- This hash is generated with BCrypt strength 12
UPDATE users 
SET password_hash = '$2a$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW',
    failed_login_attempts = 0,
    locked_until = NULL
WHERE username = 'admin';

-- Verify the update
SELECT username, email, failed_login_attempts, locked_until 
FROM users 
WHERE username = 'admin';
