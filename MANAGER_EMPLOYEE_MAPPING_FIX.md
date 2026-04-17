# Manager-Employee Mapping Issue - Root Cause Analysis and Fix

## Problem Statement

When an employee under a manager applies for leave, the concerned manager is not able to see the leave request or edit it.

## Root Cause Analysis

### Issue 1: Existing Leave Requests Have No Assigned Manager

**Database Investigation:**
```sql
SELECT lr.id, e.username, lr.status, m.username as assigned_manager
FROM leave_requests lr
JOIN users e ON lr.employee_id = e.id
LEFT JOIN users m ON lr.assigned_manager_id = m.id
WHERE lr.status = 'PENDING';
```

**Result:** All leave requests have `assigned_manager_id = NULL`

**Why this happens:**
- Leave requests were created before proper manager-employee relationships were set up
- The `LeaveRequestService.submitLeaveRequest()` method calls `managerRelationshipService.getManagerForEmployee()` 
- If no manager is found, it logs a warning and continues without assigning a manager
- The `LeaveApprovalController.getPendingRequests()` queries by `findByAssignedManagerAndStatus(manager, PENDING)`
- Since `assigned_manager_id` is NULL, the query returns no results

### Issue 2: Incomplete Manager-Employee Relationships

**Current State:**
- jane.employee (ID 3) → admin (ID 1) as manager ✓ (but should be john.manager)
- Dinesh (ID 8) → NO manager ✗
- Surya (ID 10) → NO manager ✗

**Expected State:**
- jane.employee (ID 3) → john.manager (ID 2)
- Dinesh (ID 8) → Saravanan (ID 7) or another manager
- Surya (ID 10) → Walter (ID 11) or another manager

## Solution

### Step 1: Set Up Proper Manager-Employee Relationships

Run the SQL script: `setup_manager_employee_relationships.sql`

This script will:
1. Close the current relationship for jane.employee (admin as manager)
2. Assign john.manager (ID 2) as manager for jane.employee (ID 3)
3. Assign Saravanan (ID 7) as manager for Dinesh (ID 8)
4. Assign Walter (ID 11) as manager for Surya (ID 10)

### Step 2: Update Existing Leave Requests

The same script will also update existing PENDING leave requests to assign the correct manager based on the active manager-employee relationships.

### Step 3: Verify the Fix

After running the script, verify:

1. **Manager-Employee Relationships:**
```sql
SELECT m.username as manager, e.username as employee
FROM manager_employee me
JOIN users m ON me.manager_id = m.id
JOIN users e ON me.employee_id = e.id
WHERE me.effective_to IS NULL;
```

2. **Leave Requests with Assigned Managers:**
```sql
SELECT lr.id, e.username as employee, m.username as assigned_manager, lr.status
FROM leave_requests lr
JOIN users e ON lr.employee_id = e.id
LEFT JOIN users m ON lr.assigned_manager_id = m.id
WHERE lr.status = 'PENDING';
```

## How to Run the Fix

### Option 1: Using Database Client (Recommended)

1. Connect to your PostgreSQL database using your preferred client (pgAdmin, DBeaver, psql, etc.)
2. Open and execute `setup_manager_employee_relationships.sql`
3. Review the output to verify the changes

### Option 2: Using psql Command Line

```bash
# Navigate to the project root directory
cd /path/to/TNS_Leave_Management

# Run the SQL script
psql -U your_username -d your_database_name -f setup_manager_employee_relationships.sql
```

## Testing the Fix

### Test 1: Employee Submits Leave Request

1. Log in as an employee (e.g., jane.employee)
2. Submit a new leave request
3. Verify the request is created with `assigned_manager_id` set correctly

### Test 2: Manager Views Pending Requests

1. Log in as a manager (e.g., john.manager)
2. Navigate to the "Pending Requests" page
3. Verify you can see leave requests from your direct reports

### Test 3: Manager Approves/Denies Request

1. As a manager, click on a pending request
2. Approve or deny the request
3. Verify the action is successful and the employee is notified

## Code Review

The backend code is working correctly:

### LeaveRequestService.submitLeaveRequest()
```java
// Step 6: Assign manager (Req 7.8)
Optional<ManagerEmployee> managerRelationship = managerRelationshipService.getManagerForEmployee(employee.getId());
Optional<User> manager = managerRelationship.map(ManagerEmployee::getManager);
if (manager.isEmpty()) {
    log.warn("No manager found for employee id={}. Request will be submitted without manager assignment.",
            employee.getId());
}
// ...
manager.ifPresent(leaveRequest::setAssignedManager);
```

**This code is correct** - it assigns the manager if one exists. The issue was that manager-employee relationships were not set up properly in the database.

### LeaveApprovalController.getPendingRequests()
```java
@GetMapping("/api/manager/pending-requests")
@PreAuthorize("hasAnyRole('MANAGER','ADMINISTRATOR')")
public ResponseEntity<List<LeaveRequestResponse>> getPendingRequests() {
    User manager = resolveCurrentUser();
    List<LeaveRequest> pending = leaveRequestRepository
            .findByAssignedManagerAndStatus(manager, LeaveRequestStatus.PENDING);
    // ...
}
```

**This code is correct** - it queries for requests assigned to the current manager. The issue was that `assigned_manager_id` was NULL in existing requests.

## Prevention

To prevent this issue in the future:

1. **Always set up manager-employee relationships BEFORE employees submit leave requests**
2. **Consider adding a validation** in the UI to warn employees if they don't have a manager assigned
3. **Consider adding a database constraint** to require `assigned_manager_id` for PENDING requests (though this may be too strict)
4. **Add monitoring/alerts** for leave requests with NULL `assigned_manager_id`

## Additional Recommendations

### 1. Add a UI Warning for Employees Without Managers

In the leave request form component, check if the employee has a manager and display a warning:

```typescript
ngOnInit(): void {
  this.checkManagerAssignment();
}

checkManagerAssignment(): void {
  this.userService.getCurrentUserManager().subscribe({
    next: (manager) => {
      if (!manager) {
        this.showWarning('You do not have a manager assigned. Please contact HR before submitting leave requests.');
      }
    }
  });
}
```

### 2. Add an Admin Dashboard Widget

Show a count of employees without managers in the admin dashboard:

```sql
SELECT COUNT(*) as employees_without_manager
FROM users u
JOIN user_roles ur ON u.id = ur.user_id
JOIN roles r ON ur.role_id = r.id
WHERE r.name = 'EMPLOYEE'
  AND NOT EXISTS (
    SELECT 1 FROM manager_employee me 
    WHERE me.employee_id = u.id AND me.effective_to IS NULL
  );
```

### 3. Add a Background Job

Create a scheduled job to check for and report:
- Employees without managers
- Leave requests without assigned managers
- Inactive manager-employee relationships that should be closed

## Summary

The issue was caused by:
1. Incomplete manager-employee relationships in the database
2. Existing leave requests created before relationships were set up

The fix involves:
1. Setting up proper manager-employee relationships
2. Updating existing leave requests to assign the correct manager

The backend code is working correctly and does not need any changes.
