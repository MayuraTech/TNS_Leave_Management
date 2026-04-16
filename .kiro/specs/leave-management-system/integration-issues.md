# Frontend-Backend Integration Issues

## Overview

This document identifies and tracks integration issues between the Angular frontend and Spring Boot backend in the Leave Management System. All issues have been discovered through code analysis and need to be tested and fixed.

## Critical Issues

### 1. API Path Inconsistencies in Frontend Services

**Issue**: Frontend services have inconsistent API path prefixes. The `ApiService` already adds `/api` prefix to all requests, but some service methods include `/api` in their paths, causing double prefixing.

**Affected Files**:
- `frontend/src/app/core/services/leave.service.ts`

**Specific Problems**:
```typescript
// INCORRECT - Will result in /api/api/leave/requests/{id}
getLeaveRequest(id: number): Observable<LeaveRequest> {
  return this.api.get<LeaveRequest>(`/api/leave/requests/${id}`);
}

// INCORRECT - Will result in /api/api/leave/requests/{id}
cancelLeaveRequest(id: number): Observable<void> {
  return this.api.delete<void>(`/api/leave/requests/${id}`);
}

// INCORRECT - Will result in /api/api/leave/requests/{id}/approve
approveLeaveRequest(id: number, comments: string): Observable<LeaveRequest> {
  return this.api.put<LeaveRequest>(`/api/leave/requests/${id}/approve`, { comments });
}

// INCORRECT - Will result in /api/api/leave/requests/{id}/deny
denyLeaveRequest(id: number, reason: string): Observable<LeaveRequest> {
  return this.api.put<LeaveRequest>(`/api/leave/requests/${id}/deny`, { reason });
}
```

**Expected Backend Endpoints**:
- `GET /api/leave/requests/{id}` (LeaveRequestController)
- `DELETE /api/leave/requests/{id}` (LeaveRequestController)
- `PUT /api/leave/requests/{id}/approve` (LeaveApprovalController)
- `PUT /api/leave/requests/{id}/deny` (LeaveApprovalController)

**Fix Required**:
```typescript
// CORRECT - ApiService adds /api prefix
getLeaveRequest(id: number): Observable<LeaveRequest> {
  return this.api.get<LeaveRequest>(`/leave/requests/${id}`);
}

cancelLeaveRequest(id: number): Observable<void> {
  return this.api.delete<void>(`/leave/requests/${id}`);
}

approveLeaveRequest(id: number, comments: string): Observable<LeaveRequest> {
  return this.api.put<LeaveRequest>(`/leave/requests/${id}/approve`, { comments });
}

denyLeaveRequest(id: number, reason: string): Observable<LeaveRequest> {
  return this.api.put<LeaveRequest>(`/leave/requests/${id}/deny`, { reason });
}
```

**Impact**: HIGH - These endpoints will return 404 errors, breaking leave request detail view, cancellation, and approval/denial functionality.

**Requirements Affected**: 7.1, 8.2, 8.3, 9.4, 12.1

---

### 2. API Response Format Mismatches

**Issue**: Backend returns wrapped responses (e.g., `{leaveTypes: [...]}`) but frontend expects direct arrays.

**Affected Files**:
- `frontend/src/app/core/services/leave.service.ts`
- `frontend/src/app/core/services/policy.service.ts`

**Specific Problems**:

#### Leave Types Endpoint
```typescript
// Backend returns: { leaveTypes: LeaveTypeResponse[] }
// Frontend expects: LeaveTypeResponse[]

// CURRENT (INCORRECT)
getLeaveTypes(): Observable<LeaveType[]> {
  return this.api.get<LeaveType[]>('/leave-types');
}

// SHOULD BE
getLeaveTypes(): Observable<LeaveType[]> {
  return this.api.get<{leaveTypes: LeaveType[]}>('/leave-types')
    .pipe(map(res => res.leaveTypes));
}
```

**Backend Implementation** (LeavePolicyController.java):
```java
@GetMapping("/api/leave-types")
public ResponseEntity<Map<String, List<LeaveTypeResponse>>> getLeaveTypes() {
    List<LeaveTypeResponse> leaveTypes = leaveTypeService.getAllLeaveTypes();
    return ResponseEntity.ok(Map.of("leaveTypes", leaveTypes));
}
```

#### Public Holidays Endpoint
```typescript
// Backend returns: { holidays: PublicHolidayResponse[] }
// Frontend expects: PublicHolidayResponse[]

// CURRENT (INCORRECT)
getPublicHolidays(year: number): Observable<PublicHoliday[]> {
  return this.api.get<PublicHoliday[]>('/public-holidays', { year });
}

// SHOULD BE
getPublicHolidays(year: number): Observable<PublicHoliday[]> {
  return this.api.get<{holidays: PublicHoliday[]}>('/public-holidays', { year })
    .pipe(map(res => res.holidays));
}
```

**Backend Implementation** (PublicHolidayController.java):
```java
@GetMapping("/api/public-holidays")
public ResponseEntity<Map<String, List<PublicHolidayResponse>>> getHolidays(
        @RequestParam(required = false) Integer year) {
    int targetYear = (year != null) ? year : LocalDate.now().getYear();
    List<PublicHolidayResponse> holidays = publicHolidayService.getAllHolidaysByYear(targetYear);
    return ResponseEntity.ok(Map.of("holidays", holidays));
}
```

**Impact**: HIGH - Leave type selection and public holiday display will fail, breaking leave request submission and calendar views.

**Requirements Affected**: 10.1, 17.1, 17.5

---

### 3. Missing teamId Parameter in Calendar Endpoint

**Issue**: Backend requires `teamId` as a mandatory parameter, but frontend may not always provide it.

**Backend Implementation** (LeaveRequestController.java):
```java
@GetMapping("/calendar")
public ResponseEntity<List<CalendarEntryResponse>> getCalendar(
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
        @RequestParam Long teamId,  // REQUIRED parameter
        @RequestParam(required = false) Long leaveTypeId) {
    // ...
}
```

**Frontend Implementation** (leave.service.ts):
```typescript
getCalendarEntries(params: {
  startDate: string;
  endDate: string;
  teamId?: number;  // Optional in frontend
  leaveTypeId?: number;
}): Observable<CalendarEntry[]> {
  const p: Record<string, string> = {
    startDate: params.startDate,
    endDate: params.endDate
  };
  if (params.teamId != null) p['teamId'] = String(params.teamId);
  if (params.leaveTypeId != null) p['leaveTypeId'] = String(params.leaveTypeId);
  return this.api.get<CalendarEntry[]>('/leave/calendar', p);
}
```

**Impact**: MEDIUM - Calendar will fail to load if teamId is not provided. Frontend components must ensure teamId is always passed.

**Requirements Affected**: 11.1, 11.2, 11.3, 11.4

---

## Data Format Issues

### 4. Leave Request DTO Field Type Mismatch

**Issue**: Backend expects `durationInHours` as `BigDecimal`, frontend sends as `number`.

**Backend DTO** (LeaveRequestDTO.java):
```java
@DecimalMin(value = "0.5", message = "Duration in hours must be at least 0.5")
@DecimalMax(value = "8.0", message = "Duration in hours must not exceed 8.0")
private BigDecimal durationInHours;
```

**Frontend Model** (leave-request.model.ts):
```typescript
export interface LeaveRequestDTO {
  leaveTypeId: number;
  startDate: string;
  endDate: string;
  durationType: LeaveDurationType;
  sessionType?: SessionType;
  durationInHours?: number;  // JavaScript number
  reason: string;
}
```

**Impact**: LOW - JSON serialization should handle this automatically, but validation may behave unexpectedly with floating-point precision.

**Requirements Affected**: 7.4, 7.6

---

### 5. Date Format Consistency

**Issue**: Need to ensure dates are sent in ISO format (YYYY-MM-DD) consistently.

**Backend Expectation**:
- `LocalDate` fields expect ISO date format: `2024-01-15`
- `@DateTimeFormat(iso = DateTimeFormat.ISO.DATE)` annotation enforces this

**Frontend Implementation**:
- HTML date inputs produce ISO format strings
- Need to verify all date fields use correct format

**Impact**: LOW - Should work correctly if HTML date inputs are used consistently.

**Requirements Affected**: 7.2, 7.3, 7.4, 11.3, 11.4

---

## Authentication & Authorization Issues

### 6. Role Prefix Handling

**Issue**: Backend adds `ROLE_` prefix to roles, frontend needs to strip it.

**Backend JWT Token**:
```json
{
  "sub": "john.doe",
  "userId": 123,
  "roles": ["ROLE_EMPLOYEE", "ROLE_MANAGER"],
  "iat": 1234567890,
  "exp": 1234569690
}
```

**Frontend Handling** (auth.service.ts):
```typescript
// CORRECTLY strips ROLE_ prefix
const roles = res.user.roles.map(role => 
  role.startsWith('ROLE_') ? role.substring(5) as UserRole : role
);
```

**Impact**: LOW - Already handled correctly in frontend.

**Requirements Affected**: 14.4, 14.5

---

### 7. Account Lockout Message Detection

**Issue**: Frontend detects account lockout by checking if error message contains "locked" (case-insensitive).

**Backend Error Message** (AuthenticationController.java):
```java
throw new LeaveManagementException(
    "Account is locked due to too many failed login attempts. Try again later.",
    HttpStatus.UNAUTHORIZED);
```

**Frontend Detection** (login.component.ts):
```typescript
this.isAccountLocked = message.toLowerCase().includes('locked');
```

**Impact**: LOW - Works correctly as long as backend message contains "locked".

**Requirements Affected**: 14.8

---

## Error Handling Issues

### 8. Error Response Structure

**Issue**: Need to verify error response structure is consistent across all endpoints.

**Backend Error Response** (GlobalExceptionHandler.java):
```java
public class ErrorResponse {
    private String errorCode;
    private String message;
    private String path;
    private LocalDateTime timestamp;
    private Map<String, String> fieldErrors;
}
```

**Frontend Error Handling** (error.interceptor.ts):
```typescript
const message = err.error?.message ?? 'An unexpected error occurred.';
notifications.error(message);
```

**Impact**: MEDIUM - Frontend expects `message` field in error response. Need to verify all backend exceptions return this structure.

**Requirements Affected**: All error handling scenarios

---

### 9. Validation Error Handling

**Issue**: Frontend needs to handle field-level validation errors from backend.

**Backend Validation Response**:
```java
@ExceptionHandler(MethodArgumentNotValidException.class)
public ResponseEntity<ErrorResponse> handleValidationException(
        MethodArgumentNotValidException ex, HttpServletRequest request) {
    Map<String, String> fieldErrors = new HashMap<>();
    ex.getBindingResult().getFieldErrors().forEach(error -> 
        fieldErrors.put(error.getField(), error.getDefaultMessage())
    );
    // Returns ErrorResponse with fieldErrors map
}
```

**Frontend Handling**:
- Currently displays generic error message
- Should extract and display field-specific errors

**Impact**: MEDIUM - Users don't see specific validation errors, only generic messages.

**Requirements Affected**: All form validation scenarios

---

## Missing Integration Tests

### 10. End-to-End Flow Testing

**Missing Tests**:
1. Complete leave request submission flow (Employee → Manager → Approval)
2. Leave cancellation flow with balance restoration
3. User creation flow with email notification
4. Password reset flow with email notification
5. Accrual processing flow with balance updates
6. Report generation and CSV export flow
7. Audit trail recording for all actions
8. Calendar view with multiple team members on leave
9. Department and team hierarchy management
10. Manager-employee relationship changes

**Impact**: HIGH - No comprehensive integration tests exist to verify end-to-end functionality.

**Requirements Affected**: All requirements

---

## CORS Configuration

### 11. CORS Settings Verification

**Backend Configuration** (application.yml):
```yaml
app:
  cors:
    allowed-origins: ${CORS_ALLOWED_ORIGINS:http://localhost:4200}
```

**Need to Verify**:
- Preflight OPTIONS requests are handled
- Authorization header is allowed
- Credentials are allowed
- All HTTP methods (GET, POST, PUT, DELETE) are allowed

**Impact**: MEDIUM - CORS issues will block all API requests from frontend.

**Requirements Affected**: 14.1

---

## Notification System

### 12. Email Notification Testing

**Missing Tests**:
1. Leave submission notification to manager
2. Approval notification to employee
3. Denial notification to employee with reason
4. Cancellation notification to manager
5. Upcoming leave reminder (2 days before)
6. Account creation notification with temporary password
7. Password reset notification with temporary password

**Impact**: MEDIUM - Email notifications may not be working correctly.

**Requirements Affected**: 16.1, 16.2, 16.3, 16.4, 16.5, 1.3, 2.3

---

## Summary

### Critical Issues (Must Fix Immediately)
1. API path inconsistencies in leave.service.ts
2. API response format mismatches for leave types and public holidays
3. Missing teamId parameter handling in calendar endpoint

### High Priority Issues
4. End-to-end integration testing
5. Error response structure consistency
6. Validation error handling in frontend

### Medium Priority Issues
7. CORS configuration verification
8. Email notification testing
9. Calendar teamId requirement

### Low Priority Issues
10. Date format consistency verification
11. Role prefix handling (already working)
12. Account lockout message detection (already working)

## Next Steps

1. Fix critical API path and response format issues in frontend services
2. Add comprehensive integration tests for all endpoints
3. Verify error handling works correctly for all scenarios
4. Test email notifications in development environment
5. Verify CORS configuration allows all required requests
6. Document all API endpoints with request/response examples
7. Create integration testing checklist for future development
