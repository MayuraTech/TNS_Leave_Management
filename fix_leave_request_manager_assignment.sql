-- ============================================================================
-- Fix Leave Request Manager Assignment
-- ============================================================================
-- This script updates existing leave requests to assign the correct manager
-- based on current active manager-employee relationships.
--
-- Problem: Leave requests have assigned_manager_id = NULL, so managers cannot
-- see pending requests from their direct reports.
--
-- Solution: Update leave requests to set assigned_manager_id based on the
-- active manager-employee relationship for each employee.
-- ============================================================================

-- Step 1: Check current state (before fix)
SELECT 
    lr.id as request_id,
    e.username as employee,
    lr.status,
    lr.start_date,
    lr.assigned_manager_id as current_manager_id,
    me.manager_id as should_be_manager_id,
    m.username as should_be_manager_username
FROM leave_requests lr
JOIN users e ON lr.employee_id = e.id
LEFT JOIN manager_employee me ON lr.employee_id = me.employee_id AND me.effective_to IS NULL
LEFT JOIN users m ON me.manager_id = m.id
WHERE lr.assigned_manager_id IS NULL
ORDER BY lr.id;

-- Step 2: Update PENDING leave requests to assign the correct manager
UPDATE leave_requests lr
SET assigned_manager_id = me.manager_id
FROM manager_employee me
WHERE lr.employee_id = me.employee_id
  AND me.effective_to IS NULL
  AND lr.assigned_manager_id IS NULL
  AND lr.status = 'PENDING';

-- Step 3: Verify the fix
SELECT 
    lr.id as request_id,
    e.username as employee,
    lr.status,
    lr.start_date,
    m.username as assigned_manager
FROM leave_requests lr
JOIN users e ON lr.employee_id = e.id
LEFT JOIN users m ON lr.assigned_manager_id = m.id
WHERE lr.status = 'PENDING'
ORDER BY lr.id;

-- Step 4: Check if there are any employees without managers
SELECT 
    u.id,
    u.username,
    u.first_name,
    u.last_name,
    r.name as role
FROM users u
JOIN user_roles ur ON u.id = ur.user_id
JOIN roles r ON ur.role_id = r.id
WHERE r.name = 'EMPLOYEE'
  AND NOT EXISTS (
    SELECT 1 FROM manager_employee me 
    WHERE me.employee_id = u.id AND me.effective_to IS NULL
  )
ORDER BY u.id;
