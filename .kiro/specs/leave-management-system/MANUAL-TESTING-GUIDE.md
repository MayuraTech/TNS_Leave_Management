# Manual Testing Guide - Leave Management System

## Overview

This guide provides step-by-step instructions for manually testing the Leave Management System after the critical integration fixes have been applied.

**Prerequisites**:
- ✅ Backend running on http://localhost:8080
- ✅ Frontend running on http://localhost:4200
- ✅ Database initialized with test data
- ✅ Critical fixes applied (Tasks 24.1, 24.2)

---

## Test User Accounts

### Administrator
- **Username**: `admin`
- **Email**: `admin@example.com`
- **Password**: (Use temporary password from email or database)
- **Roles**: ADMINISTRATOR

### Manager
- **Username**: `manager`
- **Email**: `manager@example.com`
- **Password**: (Use temporary password)
- **Roles**: MANAGER, EMPLOYEE

### Employee
- **Username**: `employee`
- **Email**: `employee@example.com`
- **Password**: (Use temporary password)
- **Roles**: EMPLOYEE

---

## Test Scenario 1: Authentication Flow (Task 24.3)

### Test 1.1: Login with Username
1. Navigate to http://localhost:4200/login
2. Enter username: `employee`
3. Enter password
4. Click "Login"
5. **Expected**: Redirect to dashboard, JWT token stored in sessionStorage
6. **Verify**: Check browser DevTools → Application → Session Storage → JWT token present

### Test 1.2: Login with Email
1. Navigate to http://localhost:4200/login
2. Enter email: `employee@example.com`
3. Enter password
4. Click "Login"
5. **Expected**: Redirect to dashboard, JWT token stored
6. **Verify**: Same as Test 1.1

### Test 1.3: Account Lockout
1. Navigate to http://localhost:4200/login
2. Enter username: `employee`
3. Enter wrong password
4. Click "Login" (repeat 3 times)
5. **Expected**: After 3rd attempt, see "Account is locked" message
6. **Verify**: Cannot login for 15 minutes

### Test 1.4: Logout
1. Login as any user
2. Click "Logout" button
3. **Expected**: Redirect to login page, token cleared from sessionStorage
4. **Verify**: Check sessionStorage is empty

---

## Test Scenario 2: Leave Request Submission (Task 24.4)

### Test 2.1: Full-Day Leave Request
1. Login as `employee`
2. Navigate to "Request Leave"
3. Select leave type: "Annual Leave"
4. Select duration type: "Full Day"
5. Select start date: (future date)
6. Select end date: (future date after start)
7. Enter reason: "Family vacation"
8. Click "Submit"
9. **Expected**: Success message, request appears in "My Requests" with status PENDING
10. **Verify**: Check leave balance decreased (if auto-deduct enabled)

### Test 2.2: Half-Day Leave Request
1. Login as `employee`
2. Navigate to "Request Leave"
3. Select leave type: "Annual Leave"
4. Select duration type: "Half Day"
5. Select date: (future date)
6. Select session: "Morning" or "Afternoon"
7. Enter reason: "Personal appointment"
8. Click "Submit"
9. **Expected**: Success message, 0.5 days deducted from balance
10. **Verify**: Request shows durationType: HALF_DAY, sessionType: MORNING/AFTERNOON

### Test 2.3: Hourly Leave Request
1. Login as `employee`
2. Navigate to "Request Leave"
3. Select leave type: "Personal Leave"
4. Select duration type: "Hourly"
5. Select date: (future date)
6. Enter hours: 2.5 (between 0.5 and 8)
7. Enter reason: "Doctor appointment"
8. Click "Submit"
9. **Expected**: Success message, 2.5 hours deducted from hourly balance
10. **Verify**: Request shows durationType: HOURLY, durationInHours: 2.5

### Test 2.4: Insufficient Balance Error
1. Login as `employee` with low balance
2. Try to submit leave request for more days than available
3. **Expected**: Error message "Insufficient leave balance"
4. **Verify**: Request not created, balance unchanged

### Test 2.5: Overlapping Request Error
1. Login as `employee`
2. Submit leave request for dates: 2026-05-01 to 2026-05-05
3. Try to submit another request for dates: 2026-05-03 to 2026-05-07
4. **Expected**: Error message "Overlapping leave request"
5. **Verify**: Second request not created

---

## Test Scenario 3: Leave Balance Display (Task 24.5)

### Test 3.1: View Leave Balances
1. Login as `employee`
2. Navigate to "Leave Balance" or Dashboard
3. **Expected**: See cards for each leave type showing:
   - Leave type name
   - Available days
   - Accrued days
   - Used days
   - Accrual rate
   - Available hours (for hourly leave types)
   - Used hours
4. **Verify**: All fields populated with correct data

### Test 3.2: Balance Updates After Approval
1. Login as `employee`, submit leave request
2. Login as `manager`, approve the request
3. Login back as `employee`
4. Check leave balance
5. **Expected**: Available days decreased by request duration
6. **Verify**: Used days increased by request duration

---

## Test Scenario 4: Leave Approval Workflow (Task 24.6)

### Test 4.1: Manager Views Pending Requests
1. Login as `manager`
2. Navigate to "Pending Approvals"
3. **Expected**: See list of pending requests from direct reports only
4. **Verify**: No requests from other teams visible

### Test 4.2: Approve Leave Request
1. Login as `manager`
2. Navigate to "Pending Approvals"
3. Click "Approve" on a request
4. Enter comments: "Approved for requested dates"
5. Click "Confirm"
6. **Expected**: Request status changes to APPROVED
7. **Verify**: 
   - Employee receives email notification
   - Employee's balance is deducted
   - Request appears in calendar

### Test 4.3: Deny Leave Request
1. Login as `manager`
2. Navigate to "Pending Approvals"
3. Click "Deny" on a request
4. Enter reason: "Insufficient staffing during this period"
5. Click "Confirm"
6. **Expected**: Request status changes to DENIED
7. **Verify**:
   - Employee receives email notification with reason
   - Employee's balance unchanged

---

## Test Scenario 5: Leave Calendar (Task 24.7)

### Test 5.1: View Team Calendar
1. Login as `manager`
2. Navigate to "Team Calendar"
3. **Expected**: See calendar with approved leave for team members
4. **Verify**: 
   - teamId parameter is sent in API request (check Network tab)
   - Public holidays displayed
   - Leave entries show employee name and leave type

### Test 5.2: Filter by Leave Type
1. On Team Calendar page
2. Select leave type filter: "Annual Leave"
3. **Expected**: Calendar shows only Annual Leave entries
4. **Verify**: Other leave types hidden

### Test 5.3: Filter by Date Range
1. On Team Calendar page
2. Select date range: 2026-05-01 to 2026-05-31
3. **Expected**: Calendar shows only entries in May 2026
4. **Verify**: Entries outside range not visible

---

## Test Scenario 6: User Management (Task 24.8) - Admin Only

### Test 6.1: Create User
1. Login as `admin`
2. Navigate to "User Management"
3. Click "Create User"
4. Fill form:
   - Username: `newuser`
   - Email: `newuser@example.com`
   - First Name: `New`
   - Last Name: `User`
   - Roles: Select "EMPLOYEE"
   - Department: Select department
   - Manager: Select manager
5. Click "Create"
6. **Expected**: Success message, temporary password sent to email
7. **Verify**: User appears in user list

### Test 6.2: Update User Profile
1. Login as `admin`
2. Navigate to "User Management"
3. Click "Edit" on a user
4. Update fields: firstName, lastName, phone, address
5. Click "Save"
6. **Expected**: Success message, changes saved
7. **Verify**: Audit log records the change

### Test 6.3: Assign Roles
1. Login as `admin`
2. Navigate to "User Management"
3. Click "Edit" on a user
4. Add role: "MANAGER"
5. Click "Save"
6. **Expected**: User now has MANAGER permissions
7. **Verify**: User can access manager-only features

### Test 6.4: Deactivate User
1. Login as `admin`
2. Navigate to "User Management"
3. Click "Deactivate" on a user
4. Confirm action
5. **Expected**: User cannot login, pending leave requests cancelled
6. **Verify**: User status shows "Inactive"

---

## Test Scenario 7: Leave Policy Management (Task 24.9) - Admin Only

### Test 7.1: Create Leave Type
1. Login as `admin`
2. Navigate to "Leave Policy" → "Leave Types"
3. Click "Create Leave Type"
4. Fill form:
   - Name: `Sick Leave`
   - Description: `Paid sick leave`
   - Accrual Rate: 1.0
   - Max Carry Over: 10
   - Min Notice Days: 0
5. Click "Create"
6. **Expected**: Success message, leave type appears in list
7. **Verify**: Employees can select this leave type when requesting leave

### Test 7.2: Update Leave Type
1. Login as `admin`
2. Navigate to "Leave Policy" → "Leave Types"
3. Click "Edit" on a leave type
4. Change accrual rate: 1.5
5. Click "Save"
6. **Expected**: Success message, changes applied
7. **Verify**: New accrual rate used for future accruals

### Test 7.3: Create Public Holiday
1. Login as `admin`
2. Navigate to "Leave Policy" → "Public Holidays"
3. Click "Add Holiday"
4. Fill form:
   - Date: 2026-12-25
   - Name: `Christmas Day`
5. Click "Create"
6. **Expected**: Success message, holiday appears in list
7. **Verify**: Holiday excluded from leave duration calculations

### Test 7.4: Import Public Holidays from CSV
1. Login as `admin`
2. Navigate to "Leave Policy" → "Public Holidays"
3. Click "Import from CSV"
4. Select CSV file with format:
   ```csv
   date,name
   2026-01-01,New Year's Day
   2026-12-25,Christmas Day
   ```
5. Click "Import"
6. **Expected**: Success message showing imported count
7. **Verify**: All holidays from CSV appear in list

---

## Test Scenario 8: Reporting (Task 24.10) - Admin Only

### Test 8.1: Leave Usage Report
1. Login as `admin`
2. Navigate to "Reports" → "Leave Usage"
3. Select date range: 2026-01-01 to 2026-12-31
4. Select department (optional)
5. Click "Generate Report"
6. **Expected**: Table showing leave usage by employee and leave type
7. **Verify**: Data matches actual leave taken

### Test 8.2: Leave Balance Report
1. Login as `admin`
2. Navigate to "Reports" → "Leave Balances"
3. Select department (optional)
4. Click "Generate Report"
5. **Expected**: Table showing all employee balances
6. **Verify**: Balances match individual employee views

### Test 8.3: CSV Export
1. On any report page
2. Click "Export to CSV"
3. **Expected**: CSV file downloads
4. **Verify**: CSV contains all report data in correct format

---

## Test Scenario 9: Error Handling (Task 24.12)

### Test 9.1: 401 Unauthorized
1. Clear sessionStorage (remove JWT token)
2. Try to access protected page
3. **Expected**: Redirect to login page
4. **Verify**: Error message displayed

### Test 9.2: 403 Forbidden
1. Login as `employee`
2. Try to access admin-only page (e.g., /admin/users)
3. **Expected**: Error message "You don't have permission"
4. **Verify**: Redirect to dashboard or show error page

### Test 9.3: 400 Bad Request
1. Login as `employee`
2. Submit leave request with invalid data (e.g., end date before start date)
3. **Expected**: Validation error messages displayed
4. **Verify**: Field-specific errors shown (not generic message)

### Test 9.4: 404 Not Found
1. Login as any user
2. Navigate to non-existent URL (e.g., /leave/requests/99999)
3. **Expected**: "Resource not found" message
4. **Verify**: User can navigate back to valid page

---

## Test Scenario 10: CORS Configuration (Task 24.13)

### Test 10.1: Cross-Origin Requests
1. Open browser DevTools → Network tab
2. Login and perform any action
3. **Expected**: All API requests succeed (status 200/201)
4. **Verify**: No CORS errors in console

### Test 10.2: Preflight Requests
1. Open browser DevTools → Network tab
2. Submit a POST request (e.g., create leave request)
3. **Expected**: See OPTIONS request followed by POST request
4. **Verify**: OPTIONS request returns 200 with correct CORS headers

---

## Test Scenario 11: JWT Token Handling (Task 24.14)

### Test 11.1: Token Attached to Requests
1. Login as any user
2. Open browser DevTools → Network tab
3. Perform any action that calls API
4. Click on request → Headers tab
5. **Expected**: See `Authorization: Bearer <token>` header
6. **Verify**: Token matches one in sessionStorage

### Test 11.2: Token Expiration
1. Login as any user
2. Wait 30 minutes (or modify token expiration for testing)
3. Try to perform an action
4. **Expected**: Redirect to login page with "Session expired" message
5. **Verify**: Token removed from sessionStorage

---

## Test Scenario 12: Notifications (Task 24.18)

### Test 12.1: Leave Submission Notification
1. Login as `employee`
2. Submit leave request
3. **Expected**: Manager receives email notification
4. **Verify**: Email contains request details and link to approve

### Test 12.2: Approval Notification
1. Login as `manager`
2. Approve leave request
3. **Expected**: Employee receives email notification
4. **Verify**: Email contains approval confirmation and dates

### Test 12.3: Denial Notification
1. Login as `manager`
2. Deny leave request with reason
3. **Expected**: Employee receives email notification
4. **Verify**: Email contains denial reason

---

## Verification Checklist

After completing all tests, verify:

- [ ] All critical endpoints return correct status codes
- [ ] All data displays correctly in UI
- [ ] All forms validate input properly
- [ ] All error messages are user-friendly
- [ ] All notifications are sent correctly
- [ ] All role-based access controls work
- [ ] All audit logs are recorded
- [ ] All reports generate correctly
- [ ] All CSV exports work
- [ ] No console errors in browser
- [ ] No exceptions in backend logs

---

## Reporting Issues

If you find any issues during testing:

1. Document the issue:
   - Test scenario number
   - Steps to reproduce
   - Expected behavior
   - Actual behavior
   - Screenshots (if applicable)
   - Browser console errors
   - Backend logs

2. Add to integration-test-results.md

3. Create a fix task if needed

---

## Test Data Setup

Before testing, ensure database has:

- [ ] At least 3 users (admin, manager, employee)
- [ ] At least 2 departments
- [ ] At least 2 teams
- [ ] At least 3 leave types (Annual, Sick, Personal)
- [ ] Leave balances for all employees
- [ ] Manager-employee relationships configured
- [ ] Some public holidays defined
- [ ] Some existing leave requests (for testing approval)

---

**Note**: This is a comprehensive manual testing guide. You may not need to execute every test scenario if you're confident in certain areas. Focus on the critical user journeys first:

1. Authentication
2. Leave request submission
3. Leave approval
4. Leave balance tracking
5. Calendar display

Then proceed with admin features and edge cases.
