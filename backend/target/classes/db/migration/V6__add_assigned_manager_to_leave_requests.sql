-- Add assigned_manager_id column to leave_requests table
-- This column tracks which manager is assigned to review the leave request

ALTER TABLE leave_requests
ADD COLUMN assigned_manager_id BIGINT REFERENCES users(id) ON DELETE SET NULL;

-- Add index for better query performance
CREATE INDEX idx_leave_requests_assigned_manager ON leave_requests(assigned_manager_id);
