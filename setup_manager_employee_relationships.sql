-- ============================================================================
-- Setup Manager-Employee Relationships
-- ============================================================================
-- This script sets up proper manager-employee relationships for all employees
-- who don't currently have an active manager assigned.
--
-- Current State:
-- - jane.employee (ID 3) has admin (ID 1) as manager
-- - Dinesh (ID 8) has NO manager
-- - Surya (ID 10) has NO manager
--
-- Recommended Setup:
-- - Assign john.manager (ID 2) as manager for jane.employee (ID 3)
-- - Assign Saravanan (ID 7) as manager for Dinesh (ID 8)
-- - Assign Walter (ID 11) as manager for Surya (ID 10)
-- ============================================================================

-- Step 1: View current manager-employee relationships
SELECT 
    me.id,
    m.username as manager,
    e.username as employee,
    me.effective_from,
    me.effective_to,
    CASE WHEN me.effective_to IS NULL THEN 'ACTIVE' ELSE 'CLOSED' END as status
FROM manager_employee me
JOIN users m ON me.manager_id = m.id
JOIN users e ON me.employee_id = e.id
ORDER BY me.id DESC;

-- Step 2: Close the current relationship for jane.employee (admin as manager)
-- and assign john.manager instead
UPDATE manager_employee
SET effective_to = CURRENT_TIMESTAMP
WHERE id = 7 AND effective_to IS NULL;

INSERT INTO manager_employee (manager_id, employee_id, effective_from, effective_to, created_at, created_by)
VALUES (2, 3, CURRENT_TIMESTAMP, NULL, CURRENT_TIMESTAMP, 1);

-- Step 3: Assign Saravanan as manager for Dinesh
INSERT INTO manager_employee (manager_id, employee_id, effective_from, effective_to, created_at, created_by)
VALUES (7, 8, CURRENT_TIMESTAMP, NULL, CURRENT_TIMESTAMP, 1);

-- Step 4: Assign Walter as manager for Surya
INSERT INTO manager_employee (manager_id, employee_id, effective_from, effective_to, created_at, created_by)
VALUES (11, 10, CURRENT_TIMESTAMP, NULL, CURRENT_TIMESTAMP, 1);

-- Step 5: Verify the new relationships
SELECT 
    m.username as manager,
    e.username as employee,
    me.effective_from,
    CASE WHEN me.effective_to IS NULL THEN 'ACTIVE' ELSE 'CLOSED' END as status
FROM manager_employee me
JOIN users m ON me.manager_id = m.id
JOIN users e ON me.employee_id = e.id
WHERE me.effective_to IS NULL
ORDER BY m.username, e.username;

-- Step 6: Update existing PENDING leave requests to assign the correct manager
UPDATE leave_requests lr
SET assigned_manager_id = me.manager_id
FROM manager_employee me
WHERE lr.employee_id = me.employee_id
  AND me.effective_to IS NULL
  AND lr.assigned_manager_id IS NULL
  AND lr.status = 'PENDING';

-- Step 7: Verify leave requests now have managers assigned
SELECT 
    lr.id as request_id,
    e.username as employee,
    lr.status,
    lr.start_date,
    lr.end_date,
    m.username as assigned_manager
FROM leave_requests lr
JOIN users e ON lr.employee_id = e.id
LEFT JOIN users m ON lr.assigned_manager_id = m.id
WHERE lr.status = 'PENDING'
ORDER BY lr.id;
