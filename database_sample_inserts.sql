-- ============================================================================
-- Leave Management System - Sample Data Insert Scripts
-- ============================================================================
-- This script inserts one complete set of sample records across all tables
-- including an administrator user account
-- ============================================================================

-- Note: Password for all users is 'Password123!' 
-- BCrypt hash: $2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMESaEGEYs.yrpMBGKUYW36jqe

-- ============================================================================
-- 1. ROLES (including ADMINISTRATOR role)
-- ============================================================================
-- Note: Roles table already has 3 records (EMPLOYEE, MANAGER, ADMINISTRATOR)
-- We'll reference existing role IDs: 1=EMPLOYEE, 2=MANAGER, 3=ADMINISTRATOR

-- ============================================================================
-- 2. DEPARTMENTS
-- ============================================================================
INSERT INTO departments (id, name, description, created_at) 
VALUES (
    1, 
    'Information Technology', 
    'IT department responsible for software development and infrastructure',
    CURRENT_TIMESTAMP
);

-- ============================================================================
-- 3. USERS (including Administrator)
-- ============================================================================
-- Admin User
INSERT INTO users (
    id, username, email, password_hash, first_name, last_name, 
    phone, emergency_contact, address, is_active, 
    failed_login_attempts, locked_until, created_at, updated_at, 
    department_id, team_id
) VALUES (
    1,
    'admin',
    'admin@tnsleave.com',
    '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMESaEGEYs.yrpMBGKUYW36jqe',
    'System',
    'Administrator',
    '+1-555-0100',
    '+1-555-0101',
    '123 Admin Street, Tech City, TC 12345',
    true,
    0,
    NULL,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP,
    1,
    NULL
);

-- Manager User
INSERT INTO users (
    id, username, email, password_hash, first_name, last_name, 
    phone, emergency_contact, address, is_active, 
    failed_login_attempts, locked_until, created_at, updated_at, 
    department_id, team_id
) VALUES (
    2,
    'john.manager',
    'john.manager@tnsleave.com',
    '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMESaEGEYs.yrpMBGKUYW36jqe',
    'John',
    'Manager',
    '+1-555-0200',
    '+1-555-0201',
    '456 Manager Avenue, Tech City, TC 12345',
    true,
    0,
    NULL,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP,
    1,
    NULL
);

-- Employee User
INSERT INTO users (
    id, username, email, password_hash, first_name, last_name, 
    phone, emergency_contact, address, is_active, 
    failed_login_attempts, locked_until, created_at, updated_at, 
    department_id, team_id
) VALUES (
    3,
    'jane.employee',
    'jane.employee@tnsleave.com',
    '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMESaEGEYs.yrpMBGKUYW36jqe',
    'Jane',
    'Employee',
    '+1-555-0300',
    '+1-555-0301',
    '789 Employee Road, Tech City, TC 12345',
    true,
    0,
    NULL,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP,
    1,
    NULL
);

-- ============================================================================
-- 4. USER_ROLES (Assign roles to users)
-- ============================================================================
-- Assign ADMINISTRATOR role to admin user
INSERT INTO user_roles (id, user_id, role_id, assigned_at, assigned_by)
VALUES (1, 1, 3, CURRENT_TIMESTAMP, 1);

-- Assign MANAGER role to manager user
INSERT INTO user_roles (id, user_id, role_id, assigned_at, assigned_by)
VALUES (2, 2, 2, CURRENT_TIMESTAMP, 1);

-- Assign EMPLOYEE role to employee user
INSERT INTO user_roles (id, user_id, role_id, assigned_at, assigned_by)
VALUES (3, 3, 1, CURRENT_TIMESTAMP, 1);

-- ============================================================================
-- 5. TEAMS
-- ============================================================================
INSERT INTO teams (id, name, department_id, manager_id, created_at)
VALUES (
    1,
    'Development Team',
    1,
    2,
    CURRENT_TIMESTAMP
);

-- Update users to assign them to the team
UPDATE users SET team_id = 1 WHERE id IN (2, 3);

-- ============================================================================
-- 6. MANAGER_EMPLOYEE (Manager-Employee Relationships)
-- ============================================================================
INSERT INTO manager_employee (
    id, manager_id, employee_id, effective_from, effective_to, 
    created_at, created_by
) VALUES (
    1,
    2,
    3,
    CURRENT_TIMESTAMP,
    NULL,
    CURRENT_TIMESTAMP,
    1
);

-- ============================================================================
-- 7. LEAVE_TYPES
-- ============================================================================
-- Annual Leave
INSERT INTO leave_types (id, name, description, is_active, created_at)
VALUES (
    1,
    'Annual Leave',
    'Paid annual vacation leave',
    true,
    CURRENT_TIMESTAMP
);

-- Sick Leave
INSERT INTO leave_types (id, name, description, is_active, created_at)
VALUES (
    2,
    'Sick Leave',
    'Leave for medical reasons',
    true,
    CURRENT_TIMESTAMP
);

-- Personal Leave
INSERT INTO leave_types (id, name, description, is_active, created_at)
VALUES (
    3,
    'Personal Leave',
    'Leave for personal matters',
    true,
    CURRENT_TIMESTAMP
);

-- ============================================================================
-- 8. LEAVE_POLICIES
-- ============================================================================
-- Policy for Annual Leave
INSERT INTO leave_policies (
    id, leave_type_id, accrual_rate, max_carry_over_days, 
    min_notice_days, effective_from, effective_to
) VALUES (
    1,
    1,
    1.67,
    5,
    7,
    '2026-01-01 00:00:00',
    NULL
);

-- Policy for Sick Leave
INSERT INTO leave_policies (
    id, leave_type_id, accrual_rate, max_carry_over_days, 
    min_notice_days, effective_from, effective_to
) VALUES (
    2,
    2,
    0.83,
    10,
    0,
    '2026-01-01 00:00:00',
    NULL
);

-- Policy for Personal Leave
INSERT INTO leave_policies (
    id, leave_type_id, accrual_rate, max_carry_over_days, 
    min_notice_days, effective_from, effective_to
) VALUES (
    3,
    3,
    0.42,
    3,
    3,
    '2026-01-01 00:00:00',
    NULL
);

-- ============================================================================
-- 9. LEAVE_BALANCES
-- ============================================================================
-- Leave balances for Admin user
INSERT INTO leave_balances (
    id, user_id, leave_type_id, available_days, accrued_days, 
    used_days, available_hours, used_hours, year, last_updated
) VALUES (
    1, 1, 1, 20.0, 20.0, 0.0, 0.0, 0.0, 2026, CURRENT_TIMESTAMP
);

INSERT INTO leave_balances (
    id, user_id, leave_type_id, available_days, accrued_days, 
    used_days, available_hours, used_hours, year, last_updated
) VALUES (
    2, 1, 2, 10.0, 10.0, 0.0, 0.0, 0.0, 2026, CURRENT_TIMESTAMP
);

INSERT INTO leave_balances (
    id, user_id, leave_type_id, available_days, accrued_days, 
    used_days, available_hours, used_hours, year, last_updated
) VALUES (
    3, 1, 3, 5.0, 5.0, 0.0, 0.0, 0.0, 2026, CURRENT_TIMESTAMP
);

-- Leave balances for Manager user
INSERT INTO leave_balances (
    id, user_id, leave_type_id, available_days, accrued_days, 
    used_days, available_hours, used_hours, year, last_updated
) VALUES (
    4, 2, 1, 20.0, 20.0, 0.0, 0.0, 0.0, 2026, CURRENT_TIMESTAMP
);

INSERT INTO leave_balances (
    id, user_id, leave_type_id, available_days, accrued_days, 
    used_days, available_hours, used_hours, year, last_updated
) VALUES (
    5, 2, 2, 10.0, 10.0, 0.0, 0.0, 0.0, 2026, CURRENT_TIMESTAMP
);

INSERT INTO leave_balances (
    id, user_id, leave_type_id, available_days, accrued_days, 
    used_days, available_hours, used_hours, year, last_updated
) VALUES (
    6, 2, 3, 5.0, 5.0, 0.0, 0.0, 0.0, 2026, CURRENT_TIMESTAMP
);

-- Leave balances for Employee user
INSERT INTO leave_balances (
    id, user_id, leave_type_id, available_days, accrued_days, 
    used_days, available_hours, used_hours, year, last_updated
) VALUES (
    7, 3, 1, 18.0, 20.0, 2.0, 0.0, 0.0, 2026, CURRENT_TIMESTAMP
);

INSERT INTO leave_balances (
    id, user_id, leave_type_id, available_days, accrued_days, 
    used_days, available_hours, used_hours, year, last_updated
) VALUES (
    8, 3, 2, 10.0, 10.0, 0.0, 0.0, 0.0, 2026, CURRENT_TIMESTAMP
);

INSERT INTO leave_balances (
    id, user_id, leave_type_id, available_days, accrued_days, 
    used_days, available_hours, used_hours, year, last_updated
) VALUES (
    9, 3, 3, 5.0, 5.0, 0.0, 0.0, 0.0, 2026, CURRENT_TIMESTAMP
);

-- ============================================================================
-- 10. PUBLIC_HOLIDAYS
-- ============================================================================
INSERT INTO public_holidays (id, holiday_date, name, created_at)
VALUES (1, '2026-01-01', 'New Year''s Day', CURRENT_TIMESTAMP);

INSERT INTO public_holidays (id, holiday_date, name, created_at)
VALUES (2, '2026-07-04', 'Independence Day', CURRENT_TIMESTAMP);

INSERT INTO public_holidays (id, holiday_date, name, created_at)
VALUES (3, '2026-12-25', 'Christmas Day', CURRENT_TIMESTAMP);

-- ============================================================================
-- 11. LEAVE_REQUESTS
-- ============================================================================
-- Approved leave request for employee
INSERT INTO leave_requests (
    id, employee_id, leave_type_id, start_date, end_date, 
    total_days, reason, status, duration_type, session_type, 
    duration_in_hours, approved_by, approval_comments, 
    submitted_at, processed_at, created_at, updated_at
) VALUES (
    1,
    3,
    1,
    '2026-05-01',
    '2026-05-02',
    2.0,
    'Family vacation',
    'APPROVED',
    'FULL_DAY',
    NULL,
    NULL,
    2,
    'Approved. Enjoy your vacation!',
    CURRENT_TIMESTAMP - INTERVAL '5 days',
    CURRENT_TIMESTAMP - INTERVAL '4 days',
    CURRENT_TIMESTAMP - INTERVAL '5 days',
    CURRENT_TIMESTAMP - INTERVAL '4 days'
);

-- Pending leave request for employee
INSERT INTO leave_requests (
    id, employee_id, leave_type_id, start_date, end_date, 
    total_days, reason, status, duration_type, session_type, 
    duration_in_hours, approved_by, approval_comments, 
    submitted_at, processed_at, created_at, updated_at
) VALUES (
    2,
    3,
    1,
    '2026-06-15',
    '2026-06-19',
    5.0,
    'Summer vacation',
    'PENDING',
    'FULL_DAY',
    NULL,
    NULL,
    NULL,
    NULL,
    CURRENT_TIMESTAMP - INTERVAL '1 day',
    NULL,
    CURRENT_TIMESTAMP - INTERVAL '1 day',
    CURRENT_TIMESTAMP - INTERVAL '1 day'
);

-- Half-day leave request
INSERT INTO leave_requests (
    id, employee_id, leave_type_id, start_date, end_date, 
    total_days, reason, status, duration_type, session_type, 
    duration_in_hours, approved_by, approval_comments, 
    submitted_at, processed_at, created_at, updated_at
) VALUES (
    3,
    3,
    3,
    '2026-04-20',
    '2026-04-20',
    0.5,
    'Personal appointment',
    'APPROVED',
    'HALF_DAY',
    'MORNING',
    NULL,
    2,
    'Approved',
    CURRENT_TIMESTAMP - INTERVAL '2 days',
    CURRENT_TIMESTAMP - INTERVAL '1 day',
    CURRENT_TIMESTAMP - INTERVAL '2 days',
    CURRENT_TIMESTAMP - INTERVAL '1 day'
);

-- ============================================================================
-- 12. LEAVE_ACCRUAL_TRANSACTIONS
-- ============================================================================
-- Initial accrual for employee
INSERT INTO leave_accrual_transactions (
    id, user_id, leave_type_id, amount, transaction_type, 
    reason, created_by, created_at
) VALUES (
    1,
    3,
    1,
    20.0,
    'ACCRUAL',
    'Annual accrual for 2026',
    1,
    '2026-01-01 00:00:00'
);

-- Deduction for approved leave
INSERT INTO leave_accrual_transactions (
    id, user_id, leave_type_id, amount, transaction_type, 
    reason, created_by, created_at
) VALUES (
    2,
    3,
    1,
    -2.0,
    'DEDUCTION',
    'Leave request #1 approved',
    2,
    CURRENT_TIMESTAMP - INTERVAL '4 days'
);

-- ============================================================================
-- 13. AUDIT_LOGS
-- ============================================================================
-- Audit log for user creation
INSERT INTO audit_logs (
    id, entity_type, entity_id, action_type, old_value, 
    new_value, performed_by, performed_at, ip_address
) VALUES (
    1,
    'USER',
    3,
    'CREATE',
    NULL,
    '{"username":"jane.employee","email":"jane.employee@tnsleave.com","firstName":"Jane","lastName":"Employee"}',
    1,
    CURRENT_TIMESTAMP - INTERVAL '30 days',
    '192.168.1.100'
);

-- Audit log for leave request submission
INSERT INTO audit_logs (
    id, entity_type, entity_id, action_type, old_value, 
    new_value, performed_by, performed_at, ip_address
) VALUES (
    2,
    'LEAVE_REQUEST',
    1,
    'CREATE',
    NULL,
    '{"employeeId":3,"leaveTypeId":1,"startDate":"2026-05-01","endDate":"2026-05-02","status":"PENDING"}',
    3,
    CURRENT_TIMESTAMP - INTERVAL '5 days',
    '192.168.1.105'
);

-- Audit log for leave request approval
INSERT INTO audit_logs (
    id, entity_type, entity_id, action_type, old_value, 
    new_value, performed_by, performed_at, ip_address
) VALUES (
    3,
    'LEAVE_REQUEST',
    1,
    'UPDATE',
    '{"status":"PENDING"}',
    '{"status":"APPROVED","approvedBy":2,"approvalComments":"Approved. Enjoy your vacation!"}',
    2,
    CURRENT_TIMESTAMP - INTERVAL '4 days',
    '192.168.1.102'
);

-- ============================================================================
-- Reset sequences to continue from the last inserted ID
-- ============================================================================
SELECT setval('departments_id_seq', (SELECT MAX(id) FROM departments));
SELECT setval('users_id_seq', (SELECT MAX(id) FROM users));
SELECT setval('user_roles_id_seq', (SELECT MAX(id) FROM user_roles));
SELECT setval('teams_id_seq', (SELECT MAX(id) FROM teams));
SELECT setval('manager_employee_id_seq', (SELECT MAX(id) FROM manager_employee));
SELECT setval('leave_types_id_seq', (SELECT MAX(id) FROM leave_types));
SELECT setval('leave_policies_id_seq', (SELECT MAX(id) FROM leave_policies));
SELECT setval('leave_balances_id_seq', (SELECT MAX(id) FROM leave_balances));
SELECT setval('public_holidays_id_seq', (SELECT MAX(id) FROM public_holidays));
SELECT setval('leave_requests_id_seq', (SELECT MAX(id) FROM leave_requests));
SELECT setval('leave_accrual_transactions_id_seq', (SELECT MAX(id) FROM leave_accrual_transactions));
SELECT setval('audit_logs_id_seq', (SELECT MAX(id) FROM audit_logs));

-- ============================================================================
-- SUMMARY OF INSERTED DATA
-- ============================================================================
-- 1 Department: Information Technology
-- 3 Users: 
--   - admin (ADMINISTRATOR role)
--   - john.manager (MANAGER role)
--   - jane.employee (EMPLOYEE role)
-- 1 Team: Development Team (managed by john.manager)
-- 1 Manager-Employee relationship: john.manager manages jane.employee
-- 3 Leave Types: Annual Leave, Sick Leave, Personal Leave
-- 3 Leave Policies: One for each leave type
-- 9 Leave Balances: 3 leave types × 3 users
-- 3 Public Holidays: New Year's Day, Independence Day, Christmas Day
-- 3 Leave Requests: 1 approved, 1 pending, 1 half-day approved
-- 2 Leave Accrual Transactions: Initial accrual and deduction
-- 3 Audit Logs: User creation, leave request submission, leave approval
--
-- Login Credentials (all users):
--   Username: admin / john.manager / jane.employee
--   Password: Password123!
-- ============================================================================
