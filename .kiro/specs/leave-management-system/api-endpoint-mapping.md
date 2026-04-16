# API Endpoint Mapping

## Overview

This document provides a comprehensive mapping of all API endpoints between the Angular frontend and Spring Boot backend, including request/response formats, authentication requirements, and integration notes.

---

## Authentication Endpoints

### POST /api/auth/login
**Controller**: `AuthenticationController.login()`  
**Frontend Service**: `AuthService.login()`  
**Authentication**: None (public endpoint)

**Request**:
```json
{
  "usernameOrEmail": "john.doe",
  "password": "password123"
}
```

**Response**:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": 1800,
  "user": {
    "id": 123,
    "username": "john.doe",
    "roles": ["ROLE_EMPLOYEE", "ROLE_MANAGER"]
  }
}
```

**Notes**:
- Backend accepts either username or email in `usernameOrEmail` field
- Frontend strips `ROLE_` prefix from roles
- Account lockout after 3 failed attempts returns 401 with message containing "locked"

---

### POST /api/auth/logout
**Controller**: `AuthenticationController.logout()`  
**Frontend Service**: `AuthService.logout()`  
**Authentication**: Required (JWT token)

**Request**:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response**:
```json
{
  "message": "Logged out successfully"
}
```

**Notes**:
- JWT is stateless, logout is primarily client-side
- Frontend clears token from sessionStorage

---

### POST /api/auth/refresh
**Controller**: `AuthenticationController.refresh()`  
**Frontend Service**: Not implemented yet  
**Authentication**: Required (JWT token)

**Request**:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response**:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": 1800
}
```

---

## Leave Request Endpoints

### POST /api/leave/requests
**Controller**: `LeaveRequestController.submitLeaveRequest()`  
**Frontend Service**: `LeaveService.submitLeaveRequest()`  
**Authentication**: Required (EMPLOYEE, MANAGER, ADMINISTRATOR)

**Request**:
```json
{
  "leaveTypeId": 1,
  "startDate": "2024-03-01",
  "endDate": "2024-03-05",
  "durationType": "FULL_DAY",
  "reason": "Family vacation"
}
```

**Request (Half-Day)**:
```json
{
  "leaveTypeId": 1,
  "startDate": "2024-03-01",
  "endDate": "2024-03-01",
  "durationType": "HALF_DAY",
  "sessionType": "MORNING",
  "reason": "Personal appointment"
}
```

**Request (Hourly)**:
```json
{
  "leaveTypeId": 1,
  "startDate": "2024-03-01",
  "endDate": "2024-03-01",
  "durationType": "HOURLY",
  "durationInHours": 2.5,
  "reason": "Doctor appointment"
}
```

**Response**:
```json
{
  "id": 456,
  "employeeId": 123,
  "employeeName": "John Doe",
  "leaveTypeId": 1,
  "leaveTypeName": "Annual Leave",
  "startDate": "2024-03-01",
  "endDate": "2024-03-05",
  "durationType": "FULL_DAY",
  "sessionType": null,
  "durationInHours": null,
  "totalDays": 5,
  "reason": "Family vacation",
  "status": "PENDING",
  "assignedManagerId": 789,
  "assignedManagerName": "Jane Smith",
  "submittedAt": "2024-02-20T10:30:00",
  "processedAt": null,
  "approvedById": null,
  "approvalComments": null
}
```

**Validation Rules**:
- `durationType` must be FULL_DAY, HALF_DAY, or HOURLY
- For HALF_DAY: `sessionType` required, `startDate` must equal `endDate`
- For HOURLY: `durationInHours` required (0.5-8), `startDate` must equal `endDate`
- Sufficient leave balance required
- No overlapping requests allowed
- Minimum notice period enforced

---

### GET /api/leave/requests
**Controller**: `LeaveRequestController.getMyRequests()`  
**Frontend Service**: `LeaveService.getLeaveRequests()`  
**Authentication**: Required (EMPLOYEE, MANAGER, ADMINISTRATOR)

**Query Parameters**:
- `status` (optional): PENDING, APPROVED, DENIED, CANCELLED

**Response**:
```json
[
  {
    "id": 456,
    "employeeId": 123,
    "employeeName": "John Doe",
    "leaveTypeId": 1,
    "leaveTypeName": "Annual Leave",
    "startDate": "2024-03-01",
    "endDate": "2024-03-05",
    "durationType": "FULL_DAY",
    "totalDays": 5,
    "reason": "Family vacation",
    "status": "PENDING",
    "submittedAt": "2024-02-20T10:30:00"
  }
]
```

**Notes**:
- Returns only the authenticated user's leave requests
- Can be filtered by status

---

### GET /api/leave/requests/{id}
**Controller**: `LeaveRequestController.getRequestById()`  
**Frontend Service**: `LeaveService.getLeaveRequest()` ⚠️ **ISSUE: Path includes /api prefix**  
**Authentication**: Required (EMPLOYEE, MANAGER, ADMINISTRATOR)

**Response**: Same as POST /api/leave/requests response

**Notes**:
- Employee can only view their own requests
- Returns 404 if request not found or not owned by user

---

### DELETE /api/leave/requests/{id}
**Controller**: `LeaveRequestController.cancelRequest()`  
**Frontend Service**: `LeaveService.cancelLeaveRequest()` ⚠️ **ISSUE: Path includes /api prefix**  
**Authentication**: Required (EMPLOYEE, MANAGER, ADMINISTRATOR)

**Response**: Same as POST /api/leave/requests response with status CANCELLED

**Notes**:
- Can only cancel own requests
- Balance is restored upon cancellation
- Manager is notified via email

---

### GET /api/leave/balance
**Controller**: `LeaveRequestController.getMyBalances()`  
**Frontend Service**: `LeaveService.getLeaveBalances()`  
**Authentication**: Required (EMPLOYEE, MANAGER, ADMINISTRATOR)

**Response**:
```json
[
  {
    "leaveTypeId": 1,
    "leaveTypeName": "Annual Leave",
    "availableDays": 15.5,
    "accruedDays": 20,
    "usedDays": 4.5,
    "accrualRate": 1.67,
    "availableHours": 120,
    "usedHours": 8
  }
]
```

**Notes**:
- Returns all leave balances for authenticated user
- Includes accrual rate for each leave type
- Supports fractional days for half-day leaves
- Includes hourly tracking for hourly permissions

---

### GET /api/leave/calendar
**Controller**: `LeaveRequestController.getCalendar()`  
**Frontend Service**: `LeaveService.getCalendarEntries()`  
**Authentication**: Required (EMPLOYEE, MANAGER, ADMINISTRATOR)

**Query Parameters**:
- `startDate` (required): ISO date format (YYYY-MM-DD)
- `endDate` (required): ISO date format (YYYY-MM-DD)
- `teamId` (required): Team ID ⚠️ **ISSUE: Frontend treats as optional**
- `leaveTypeId` (optional): Filter by leave type

**Response**:
```json
[
  {
    "date": "2024-03-01",
    "employeeId": 123,
    "employeeName": "John Doe",
    "leaveTypeId": 1,
    "leaveTypeName": "Annual Leave",
    "durationType": "FULL_DAY",
    "sessionType": null
  },
  {
    "date": "2024-03-15",
    "isPublicHoliday": true,
    "holidayName": "National Holiday"
  }
]
```

**Notes**:
- Returns approved leave entries and public holidays
- Backend requires teamId parameter
- Frontend should ensure teamId is always provided

---

## Leave Approval Endpoints

### PUT /api/leave/requests/{id}/approve
**Controller**: `LeaveApprovalController.approveRequest()`  
**Frontend Service**: `LeaveService.approveLeaveRequest()` ⚠️ **ISSUE: Path includes /api prefix**  
**Authentication**: Required (MANAGER, ADMINISTRATOR)

**Request**:
```json
{
  "comments": "Approved for the requested dates"
}
```

**Response**: Same as POST /api/leave/requests response with status APPROVED

**Notes**:
- Manager can only approve requests from direct reports
- Balance is deducted upon approval
- Employee is notified via email

---

### PUT /api/leave/requests/{id}/deny
**Controller**: `LeaveApprovalController.denyRequest()`  
**Frontend Service**: `LeaveService.denyLeaveRequest()` ⚠️ **ISSUE: Path includes /api prefix**  
**Authentication**: Required (MANAGER, ADMINISTRATOR)

**Request**:
```json
{
  "reason": "Insufficient staffing during requested period"
}
```

**Response**: Same as POST /api/leave/requests response with status DENIED

**Notes**:
- Reason is required for denial
- Employee is notified via email with denial reason

---

### GET /api/manager/pending-requests
**Controller**: `LeaveApprovalController.getPendingRequests()`  
**Frontend Service**: `LeaveService.getPendingRequests()`  
**Authentication**: Required (MANAGER, ADMINISTRATOR)

**Response**: Array of leave requests (same format as GET /api/leave/requests)

**Notes**:
- Returns only pending requests from manager's direct reports
- Based on manager-employee relationships

---

## Leave Policy Endpoints

### GET /api/leave-types
**Controller**: `LeavePolicyController.getLeaveTypes()`  
**Frontend Service**: `LeaveService.getLeaveTypes()` ⚠️ **ISSUE: Response format mismatch**  
**Authentication**: Required (any role)

**Response**:
```json
{
  "leaveTypes": [
    {
      "id": 1,
      "name": "Annual Leave",
      "description": "Paid annual leave",
      "isActive": true,
      "accrualRate": 1.67,
      "maxCarryOverDays": 5,
      "minNoticeDays": 7
    }
  ]
}
```

**Notes**:
- ⚠️ Backend returns wrapped response `{leaveTypes: [...]}`
- ⚠️ Frontend expects direct array `[...]`
- Frontend needs to extract `leaveTypes` from response

---

### POST /api/admin/leave-types
**Controller**: `LeavePolicyController.createLeaveType()`  
**Frontend Service**: `PolicyService.createLeaveType()`  
**Authentication**: Required (ADMINISTRATOR)

**Request**:
```json
{
  "name": "Sick Leave",
  "description": "Paid sick leave",
  "accrualRate": 1.0,
  "maxCarryOverDays": 10,
  "minNoticeDays": 0
}
```

**Response**:
```json
{
  "leaveType": {
    "id": 2,
    "name": "Sick Leave",
    "description": "Paid sick leave",
    "isActive": true,
    "accrualRate": 1.0,
    "maxCarryOverDays": 10,
    "minNoticeDays": 0
  }
}
```

---

### PUT /api/admin/leave-types/{id}
**Controller**: `LeavePolicyController.updateLeaveType()`  
**Frontend Service**: `PolicyService.updateLeaveType()`  
**Authentication**: Required (ADMINISTRATOR)

**Request**: Same as POST /api/admin/leave-types  
**Response**: Same as POST /api/admin/leave-types

---

## Public Holiday Endpoints

### GET /api/public-holidays
**Controller**: `PublicHolidayController.getHolidays()`  
**Frontend Service**: `LeaveService.getPublicHolidays()` ⚠️ **ISSUE: Response format mismatch**  
**Authentication**: Required (any role)

**Query Parameters**:
- `year` (optional): Year to filter holidays (defaults to current year)

**Response**:
```json
{
  "holidays": [
    {
      "id": 1,
      "date": "2024-01-01",
      "name": "New Year's Day"
    }
  ]
}
```

**Notes**:
- ⚠️ Backend returns wrapped response `{holidays: [...]}`
- ⚠️ Frontend expects direct array `[...]`
- Frontend needs to extract `holidays` from response

---

### POST /api/admin/public-holidays
**Controller**: `PublicHolidayController.createHoliday()`  
**Frontend Service**: `PolicyService.createPublicHoliday()`  
**Authentication**: Required (ADMINISTRATOR)

**Request**:
```json
{
  "date": "2024-12-25",
  "name": "Christmas Day"
}
```

**Response**:
```json
{
  "holiday": {
    "id": 2,
    "date": "2024-12-25",
    "name": "Christmas Day"
  }
}
```

---

### POST /api/admin/public-holidays/import
**Controller**: `PublicHolidayController.importHolidays()`  
**Frontend Service**: `PolicyService.importPublicHolidays()`  
**Authentication**: Required (ADMINISTRATOR)

**Request**: Multipart form data with CSV file

**Response**:
```json
{
  "importedCount": 10
}
```

**CSV Format**:
```csv
date,name
2024-01-01,New Year's Day
2024-12-25,Christmas Day
```

---

## User Management Endpoints

### POST /api/admin/users
**Controller**: `UserManagementController.createUser()`  
**Frontend Service**: `UserService.createUser()`  
**Authentication**: Required (ADMINISTRATOR)

**Request**:
```json
{
  "username": "john.doe",
  "email": "john.doe@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "roles": ["EMPLOYEE", "MANAGER"],
  "departmentId": 1,
  "managerId": 789
}
```

**Response**:
```json
{
  "userId": 123,
  "temporaryPassword": "Abc123XyZ789"
}
```

**Notes**:
- Temporary password is generated and sent to user's email
- At least one role is required
- Username and email must be unique

---

### GET /api/admin/users
**Controller**: `UserManagementController.getUsers()`  
**Frontend Service**: `UserService.getUsers()`  
**Authentication**: Required (ADMINISTRATOR)

**Query Parameters**:
- `page` (optional, default: 0): Page number
- `size` (optional, default: 20): Page size
- `departmentId` (optional): Filter by department
- `status` (optional): "active" or "inactive"

**Response**:
```json
{
  "content": [
    {
      "id": 123,
      "username": "john.doe",
      "email": "john.doe@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "isActive": true,
      "roles": ["EMPLOYEE", "MANAGER"],
      "departmentId": 1,
      "teamId": 5
    }
  ],
  "totalElements": 50,
  "totalPages": 3,
  "number": 0,
  "size": 20
}
```

---

### PUT /api/admin/users/{userId}
**Controller**: `UserManagementController.updateUser()`  
**Frontend Service**: `UserService.updateUser()`  
**Authentication**: Required (ADMINISTRATOR)

**Request**:
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john.doe@example.com",
  "phone": "+1234567890",
  "emergencyContact": "+0987654321",
  "address": "123 Main St"
}
```

**Response**: User object

**Notes**:
- Audit log is created for profile changes

---

### POST /api/admin/users/{userId}/roles
**Controller**: `UserManagementController.assignRoles()`  
**Frontend Service**: `UserService.assignRoles()`  
**Authentication**: Required (ADMINISTRATOR)

**Request**:
```json
{
  "roles": ["EMPLOYEE", "MANAGER", "ADMINISTRATOR"]
}
```

**Response**: User object with updated roles

**Notes**:
- Permissions are updated immediately
- Multiple roles can be assigned

---

### POST /api/admin/users/{userId}/deactivate
**Controller**: `UserManagementController.deactivateUser()`  
**Frontend Service**: `UserService.deactivateUser()`  
**Authentication**: Required (ADMINISTRATOR)

**Response**:
```json
{
  "message": "User account deactivated successfully"
}
```

**Notes**:
- User cannot authenticate after deactivation
- All pending leave requests are cancelled

---

### POST /api/admin/users/{userId}/reset-password
**Controller**: `UserManagementController.resetPassword()`  
**Frontend Service**: `UserService.resetPassword()`  
**Authentication**: Required (ADMINISTRATOR)

**Response**:
```json
{
  "message": "Password reset successfully. New temporary password sent to user."
}
```

**Notes**:
- New temporary password is generated and emailed to user

---

### PUT /api/admin/users/{userId}/manager
**Controller**: `UserManagementController.assignManager()`  
**Frontend Service**: `UserService.assignManager()`  
**Authentication**: Required (ADMINISTRATOR)

**Request**:
```json
{
  "managerId": 789
}
```

**Response**:
```json
{
  "message": "Manager assigned successfully"
}
```

**Notes**:
- Creates manager-employee relationship
- Employee can only have one direct manager

---

## Department & Team Endpoints

### POST /api/admin/departments
**Controller**: `DepartmentController.createDepartment()`  
**Frontend Service**: `UserService.createDepartment()`  
**Authentication**: Required (ADMINISTRATOR)

**Request**:
```json
{
  "name": "Engineering",
  "description": "Software development team"
}
```

**Response**:
```json
{
  "id": 1,
  "name": "Engineering",
  "description": "Software development team"
}
```

---

### GET /api/admin/departments
**Controller**: `DepartmentController.getAllDepartments()`  
**Frontend Service**: `UserService.getDepartments()`  
**Authentication**: Required (ADMINISTRATOR)

**Response**: Array of department objects

---

### PUT /api/admin/departments/{id}
**Controller**: `DepartmentController.updateDepartment()`  
**Frontend Service**: `UserService.updateDepartment()`  
**Authentication**: Required (ADMINISTRATOR)

**Request**: Same as POST /api/admin/departments  
**Response**: Department object

---

### DELETE /api/admin/departments/{id}
**Controller**: `DepartmentController.deleteDepartment()`  
**Frontend Service**: `UserService.deleteDepartment()`  
**Authentication**: Required (ADMINISTRATOR)

**Response**: 204 No Content

---

### POST /api/admin/teams
**Controller**: `TeamController.createTeam()`  
**Frontend Service**: `UserService.createTeam()`  
**Authentication**: Required (ADMINISTRATOR)

**Request**:
```json
{
  "name": "Backend Team",
  "departmentId": 1,
  "managerId": 789
}
```

**Response**:
```json
{
  "id": 5,
  "name": "Backend Team",
  "departmentId": 1,
  "managerId": 789
}
```

---

### GET /api/admin/teams
**Controller**: `TeamController.getTeams()`  
**Frontend Service**: `UserService.getTeams()`  
**Authentication**: Required (ADMINISTRATOR)

**Query Parameters**:
- `departmentId` (optional): Filter by department

**Response**: Array of team objects

---

### PUT /api/admin/teams/{id}
**Controller**: `TeamController.updateTeam()`  
**Frontend Service**: `UserService.updateTeam()`  
**Authentication**: Required (ADMINISTRATOR)

**Request**: Same as POST /api/admin/teams  
**Response**: Team object

---

### DELETE /api/admin/teams/{id}
**Controller**: `TeamController.deleteTeam()`  
**Frontend Service**: `UserService.deleteTeam()`  
**Authentication**: Required (ADMINISTRATOR)

**Response**: 204 No Content

---

## Reporting Endpoints

### GET /api/admin/reports/leave-usage
**Controller**: `ReportingController.getLeaveUsage()`  
**Frontend Service**: `ReportService.getLeaveUsageReport()`  
**Authentication**: Required (ADMINISTRATOR)

**Query Parameters**:
- `startDate` (required): ISO date format
- `endDate` (required): ISO date format
- `departmentId` (optional): Filter by department
- `leaveTypeId` (optional): Filter by leave type

**Response**:
```json
[
  {
    "employeeId": 123,
    "employeeName": "John Doe",
    "leaveTypeName": "Annual Leave",
    "totalDays": 5,
    "departmentName": "Engineering"
  }
]
```

---

### GET /api/admin/reports/leave-balances
**Controller**: `ReportingController.getLeaveBalances()`  
**Frontend Service**: `ReportService.getLeaveBalanceReport()`  
**Authentication**: Required (ADMINISTRATOR)

**Query Parameters**:
- `departmentId` (optional): Filter by department

**Response**:
```json
[
  {
    "employeeId": 123,
    "employeeName": "John Doe",
    "leaveTypeName": "Annual Leave",
    "availableDays": 15.5,
    "usedDays": 4.5,
    "departmentName": "Engineering"
  }
]
```

---

### GET /api/admin/reports/pending-requests
**Controller**: `ReportingController.getPendingRequests()`  
**Frontend Service**: `ReportService.getPendingRequestsReport()`  
**Authentication**: Required (ADMINISTRATOR)

**Response**:
```json
[
  {
    "requestId": 456,
    "employeeName": "John Doe",
    "leaveTypeName": "Annual Leave",
    "startDate": "2024-03-01",
    "endDate": "2024-03-05",
    "totalDays": 5,
    "submittedAt": "2024-02-20T10:30:00",
    "managerName": "Jane Smith"
  }
]
```

---

### GET /api/admin/reports/leave-trends
**Controller**: `ReportingController.getLeaveTrends()`  
**Frontend Service**: `ReportService.getLeaveTrendsReport()`  
**Authentication**: Required (ADMINISTRATOR)

**Query Parameters**:
- `startDate` (required): ISO date format
- `endDate` (required): ISO date format
- `groupBy` (required): "department" or "team"

**Response**:
```json
[
  {
    "groupName": "Engineering",
    "leaveTypeName": "Annual Leave",
    "totalDays": 120,
    "requestCount": 24
  }
]
```

---

### GET /api/admin/reports/export
**Controller**: `ReportingController.exportReport()`  
**Frontend Service**: `ReportService.exportReport()`  
**Authentication**: Required (ADMINISTRATOR)

**Query Parameters**:
- `reportType` (required): "leave-usage", "leave-balances", "pending-requests", "leave-trends"
- `format` (required): "csv"
- Additional filters based on report type

**Response**: CSV file download

---

## Audit Endpoints

### GET /api/admin/audit
**Controller**: `AuditController.getAuditLogs()`  
**Frontend Service**: `AuditService.getAuditLogs()`  
**Authentication**: Required (ADMINISTRATOR)

**Query Parameters**:
- `userId` (optional): Filter by user
- `actionType` (optional): Filter by action type
- `startDate` (optional): ISO date format
- `endDate` (optional): ISO date format
- `page` (optional, default: 0): Page number
- `size` (optional, default: 20): Page size

**Response**:
```json
{
  "content": [
    {
      "id": 1,
      "entityType": "LeaveRequest",
      "entityId": 456,
      "actionType": "APPROVED",
      "oldValue": "PENDING",
      "newValue": "APPROVED",
      "performedBy": 789,
      "performedAt": "2024-02-21T14:30:00",
      "ipAddress": "192.168.1.100"
    }
  ],
  "totalElements": 100,
  "totalPages": 5,
  "number": 0,
  "size": 20
}
```

---

## Accrual Endpoints

### POST /api/admin/leave-balance/adjust
**Controller**: `AccrualController.adjustBalance()`  
**Frontend Service**: `PolicyService.adjustBalance()`  
**Authentication**: Required (ADMINISTRATOR)

**Request**:
```json
{
  "userId": 123,
  "leaveTypeId": 1,
  "amount": 5.0,
  "reason": "Bonus leave for exceptional performance"
}
```

**Response**:
```json
{
  "newBalance": 20.5
}
```

---

### POST /api/admin/accrual/process
**Controller**: `AccrualController.processAccrual()`  
**Frontend Service**: `PolicyService.processAccrual()`  
**Authentication**: Required (ADMINISTRATOR)

**Response**:
```json
{
  "processedCount": 150
}
```

**Notes**:
- Manually triggers accrual processing for all active employees
- Normally runs automatically on schedule

---

## Summary of Integration Issues

### Critical Issues
1. **API Path Inconsistencies**: 4 endpoints in `leave.service.ts` include `/api` prefix
2. **Response Format Mismatches**: 2 endpoints return wrapped responses but frontend expects arrays
3. **Missing Required Parameter**: Calendar endpoint requires `teamId` but frontend treats as optional

### Affected Endpoints
- ❌ GET /api/leave/requests/{id} - Path issue
- ❌ DELETE /api/leave/requests/{id} - Path issue
- ❌ PUT /api/leave/requests/{id}/approve - Path issue
- ❌ PUT /api/leave/requests/{id}/deny - Path issue
- ❌ GET /api/leave-types - Response format issue
- ❌ GET /api/public-holidays - Response format issue
- ⚠️ GET /api/leave/calendar - Missing required parameter

### Total Endpoints
- **Authentication**: 3 endpoints
- **Leave Requests**: 6 endpoints
- **Leave Approval**: 3 endpoints
- **Leave Policy**: 3 endpoints
- **Public Holidays**: 3 endpoints
- **User Management**: 7 endpoints
- **Departments**: 4 endpoints
- **Teams**: 4 endpoints
- **Reporting**: 5 endpoints
- **Audit**: 1 endpoint
- **Accrual**: 2 endpoints

**Total**: 41 API endpoints
