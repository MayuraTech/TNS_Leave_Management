# Implementation Plan: Leave Management System

## Overview

Incremental implementation of the Leave Management System using Spring Boot (Java 21) for the backend and Angular (TypeScript) for the frontend. Tasks are ordered to build foundational layers first (database, auth, core entities), then feature modules, and finally wire everything together.

## Tasks
- [x] 1. Database schema and Flyway migrations
  - [x] 1.1 Create initial Flyway migration for core tables
    - Write `V1__initial_schema.sql` creating `users`, `roles`, `user_roles` tables with all columns from the data model
    - _Requirements: 1.1, 14.7_
  - [x] 1.2 Create Flyway migration for organizational tables
    - Write `V2__org_schema.sql` creating `departments`, `teams`, `manager_employee` tables
    - _Requirements: 4.1, 5.2_
  - [x] 1.3 Create Flyway migration for leave tables
    - Write `V3__leave_schema.sql` creating `leave_types`, `leave_policies`, `leave_requests`, `leave_balances`, `leave_accrual_transactions`, `public_holidays` tables
    - _Requirements: 7.2, 9.1, 10.1, 15.4, 17.1_
  - [x] 1.4 Create Flyway migration for audit table
    - Write `V4__audit_schema.sql` creating `audit_logs` table
    - _Requirements: 18.1_
  - [x] 1.5 Seed initial roles data
    - Write `V5__seed_roles.sql` inserting EMPLOYEE, MANAGER, ADMINISTRATOR roles
    - _Requirements: 3.1_

- [x] 2. Backend project structure and shared infrastructure
  - [x] 2.1 Set up Spring Boot project with dependencies
    - Configure `pom.xml` with Spring Boot 3, Spring Security, Spring Data JPA, Flyway, Spring Mail, JWT library, Lombok, MapStruct
    - Configure `application.yml` with environment variable placeholders for DB, JWT, SMTP
    - _Requirements: 14.1_
  - [x] 2.2 Implement exception hierarchy and global exception handler
    - Create `LeaveManagementException` base class and subclasses: `InsufficientLeaveBalanceException`, `OverlappingLeaveRequestException`, `UnauthorizedAccessException`, `ResourceNotFoundException`, `PolicyViolationException`
    - Implement `GlobalExceptionHandler` with `@RestControllerAdvice` and `ErrorResponse` DTO
    - _Requirements: 7.1, 7.7, 10.5_
  - [x] 2.3 Implement JPA entities
    - Create `User`, `Role`, `Department`, `Team`, `ManagerEmployee` entities with all fields and relationships
    - Create `LeaveType`, `LeavePolicy`, `LeaveRequest`, `LeaveBalance`, `LeaveAccrualTransaction`, `PublicHoliday` entities
    - Create `AuditLog` entity
    - Create enums: `LeaveDurationType`, `SessionType`, `LeaveRequestStatus`
    - _Requirements: 1.2, 7.2, 7.3, 7.4, 9.1, 18.1_
  - [x] 2.4 Implement Spring Data JPA repositories
    - Create repositories for all entities with custom query methods: `findByUsername`, `findByEmail`, `findOverlappingRequests`, `findByEmployeeAndStatus`, `findByManagerId`, etc.
    - _Requirements: 7.7, 8.1, 9.5_

- [x] 3. Authentication and JWT implementation
  - [x] 3.1 Implement JWT infrastructure
    - Create `JwtTokenProvider` for token generation and validation
    - Create `JwtAuthenticationFilter` to intercept and validate tokens on each request
    - Create `UserDetailsServiceImpl` loading user by username or email
    - _Requirements: 14.1, 14.2, 14.3_
  - [x] 3.2 Implement Spring Security configuration
    - Create `SecurityConfig` with stateless session, route-level RBAC rules (`/api/admin/**` → ADMINISTRATOR, `/api/manager/**` → MANAGER/ADMINISTRATOR, `/api/leave/**` → all roles)
    - Configure BCrypt password encoder with strength 12
    - Configure CORS for Angular frontend origin
    - _Requirements: 14.4, 14.5, 14.7_
  - [x] 3.3 Implement authentication service and controller
    - Create `AuthenticationService` with `findByUsernameOrEmail`, `handleFailedLogin`, `handleSuccessfulLogin`, `isAccountLocked` methods
    - Create `AuthenticationController` with `POST /api/auth/login`, `POST /api/auth/logout`, `POST /api/auth/refresh` endpoints
    - Enforce 3-attempt lockout for 15 minutes
    - _Requirements: 14.1, 14.2, 14.3, 14.6, 14.8_
  - [x] 3.4 Write unit tests for authentication service
    - Test successful login resets failed attempts
    - Test failed login increments counter and locks after 3 attempts
    - Test locked account is rejected even with correct credentials
    - Test `findByUsernameOrEmail` resolves by both username and email
    - _Requirements: 14.1, 14.8_

- [x] 4. User Management module (admin-only)
  - [x] 4.1 Implement password service and user creation
    - Create `PasswordService` with BCrypt hashing, verification, and `generateTemporaryPassword`
    - Create `UserService.createUser` validating uniqueness, assigning roles, setting active status, triggering email with temporary password
    - _Requirements: 1.2, 1.3, 1.4, 1.5, 1.6_
  - [x] 4.2 Implement user profile update and password reset
    - Implement `UserService.updateUser` for profile fields (firstName, lastName, phone, emergencyContact, address, email, username)
    - Implement `UserService.resetPassword` generating and emailing a new temporary password
    - Record audit log entry on every profile change
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_
  - [x] 4.3 Implement role assignment and revocation
    - Implement `RoleService.assignRoles` and `RoleService.revokeRole` with immediate permission effect
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_
  - [x] 4.4 Implement account activation and deactivation
    - Implement `UserService.deactivateUser` blocking authentication and cancelling pending leave requests
    - Implement `UserService.reactivateUser` sending notification email with password reset instructions
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_
  - [x] 4.5 Implement department and team management
    - Implement `DepartmentService` CRUD and `TeamService` CRUD
    - Enforce auto-assignment of user to team's department when added to a team
    - Enforce single-team constraint per user
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6_
  - [x] 4.6 Implement manager-employee relationship management
    - Implement `ManagerRelationshipService` creating/modifying `ManagerEmployee` records
    - Enforce single-manager constraint per employee
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6_
  - [x] 4.7 Implement User Management REST controller
    - Create `UserManagementController` exposing all admin user endpoints: `POST /api/admin/users`, `PUT /api/admin/users/{id}`, `POST /api/admin/users/{id}/roles`, `POST /api/admin/users/{id}/deactivate`, `POST /api/admin/users/{id}/reset-password`, `GET /api/admin/users`, `PUT /api/admin/users/{id}/manager`
    - Create `DepartmentController` and `TeamController` for department/team CRUD endpoints
    - Apply `@PreAuthorize("hasRole('ADMINISTRATOR')")` on all endpoints
    - _Requirements: 1.1, 2.1, 3.1, 4.1, 5.1_
  - [x] 4.8 Write unit tests for user management service
    - Test duplicate username/email rejection
    - Test role assignment updates permissions
    - Test deactivation cancels pending leave requests
    - Test single-team constraint enforcement
    - _Requirements: 1.5, 3.5, 6.3, 4.5_

- [x] 5. Leave Policy and Public Holiday management
  - [x] 5.1 Implement leave type and policy service
    - Create `LeaveTypeService` for CRUD on leave types
    - Create `LeavePolicyService` storing accrual rate, max carry-over days, min notice days per leave type
    - _Requirements: 10.1, 10.2, 10.3, 10.4_
  - [x] 5.2 Implement public holiday service
    - Create `PublicHolidayService` for CRUD and CSV import of public holidays
    - _Requirements: 17.1, 17.5_
  - [x] 5.3 Implement working-day calculation utility
    - Create `WorkingDayCalculator` utility that excludes weekends and public holidays when computing leave duration
    - _Requirements: 17.2, 17.3_
  - [x] 5.4 Implement leave policy and public holiday REST controllers
    - Create `LeavePolicyController` with admin endpoints: `POST /api/admin/leave-types`, `PUT /api/admin/leave-types/{id}`, `GET /api/leave-types`
    - Create `PublicHolidayController` with `POST /api/admin/public-holidays`, `POST /api/admin/public-holidays/import`, `GET /api/public-holidays`
    - _Requirements: 10.1, 17.1, 17.5_
  - [x] 5.5 Write unit tests for working-day calculator
    - Test that weekends are excluded from duration
    - Test that public holidays are excluded from duration
    - Test a range spanning both weekends and holidays
    - _Requirements: 17.2, 17.3_

- [x] 6. Leave Request submission and validation
  - [x] 6.1 Implement leave balance service
    - Create `LeaveBalanceService` with methods: `getAvailableBalance`, `deductBalance`, `restoreBalance`, `adjustBalance` (admin manual adjustment)
    - Support fractional days (BigDecimal) for half-day and hourly deductions
    - _Requirements: 7.1, 7.5, 7.6, 9.1, 9.2, 9.3, 15.5_
  - [x] 6.2 Implement leave request submission service
    - Create `LeaveRequestService.submitLeaveRequest` validating: sufficient balance, no overlapping requests, min notice period, duration type constraints (HALF_DAY/HOURLY same-day, HOURLY 0.5–8 hours)
    - Assign request to employee's manager via `ManagerRelationshipService`
    - Set status to PENDING and trigger submission notification
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.7, 7.8, 7.9, 10.5_
  - [x] 6.3 Implement leave request cancellation service
    - Implement `LeaveRequestService.cancelRequest` allowing cancellation before leave starts (restore balance, notify manager, update calendar)
    - Require manager approval for in-progress leave cancellation
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5_
  - [x] 6.4 Implement leave request REST controller
    - Create `LeaveRequestController` with: `POST /api/leave/requests`, `GET /api/leave/requests`, `GET /api/leave/requests/{id}`, `DELETE /api/leave/requests/{id}`
    - Create `GET /api/leave/balance` endpoint returning all balances with accrual rates
    - _Requirements: 7.1, 9.1, 9.4, 9.5_
  - [x] 6.5 Write unit tests for leave request service
    - Test submission with sufficient balance succeeds and sets PENDING status
    - Test submission with insufficient balance throws `InsufficientLeaveBalanceException`
    - Test overlapping request throws `OverlappingLeaveRequestException`
    - Test HALF_DAY deducts 0.5 days on approval
    - Test HOURLY validates 0.5–8 hour range
    - Test cancellation before start restores balance
    - _Requirements: 7.1, 7.5, 7.6, 7.7, 12.2_

- [x] 7. Leave Approval workflow
  - [x] 7.1 Implement leave approval service
    - Create `LeaveApprovalService.approveRequest` deducting balance, updating calendar, notifying employee
    - Create `LeaveApprovalService.denyRequest` requiring a denial reason, notifying employee
    - _Requirements: 8.2, 8.3, 8.4, 8.5_
  - [x] 7.2 Implement manager approval REST controller
    - Create `PUT /api/leave/requests/{id}/approve` and `PUT /api/leave/requests/{id}/deny` endpoints
    - Create `GET /api/manager/pending-requests` returning all pending requests from manager's direct reports
    - Apply `@PreAuthorize("hasAnyRole('MANAGER','ADMINISTRATOR')")` on manager endpoints
    - _Requirements: 8.1, 8.2, 8.3_
  - [x] 7.3 Write unit tests for leave approval service
    - Test approval deducts correct balance and sets APPROVED status
    - Test denial without reason throws validation error
    - Test manager can only approve requests from their own direct reports
    - _Requirements: 8.2, 8.3, 8.1_

- [x] 8. Leave Calendar service
  - [x] 8.1 Implement leave calendar service and controller
    - Create `LeaveCalendarService.getCalendarEntries` returning approved leave for a team filtered by date range and leave type
    - Expose `GET /api/leave/calendar` with query params: `startDate`, `endDate`, `teamId`, `leaveTypeId`
    - Include public holidays in calendar response
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5, 17.4_

- [x] 9. Leave Accrual processing
  - [x] 9.1 Implement accrual service and scheduler
    - Create `AccrualService.processAccrual` iterating active employees, applying accrual rate, capping at max carry-over, recording `LeaveAccrualTransaction`
    - Create `AccrualScheduler` using `@Scheduled` to trigger monthly accrual
    - _Requirements: 15.1, 15.2, 15.3, 15.4_
  - [x] 9.2 Implement manual balance adjustment endpoint
    - Create `POST /api/admin/leave-balance/adjust` and `POST /api/admin/accrual/process` endpoints
    - _Requirements: 15.5_
  - [x] 9.3 Write unit tests for accrual service
    - Test accrual adds correct amount to balance
    - Test balance is capped at max carry-over limit
    - Test accrual transaction is recorded with timestamp
    - _Requirements: 15.2, 15.3, 15.4_

- [x] 10. Notification service
  - [x] 10.1 Implement email notification service
    - Create `NotificationService` using Spring Mail to send templated emails for all events: leave submitted (→ manager), approved/denied (→ employee), cancelled (→ manager), upcoming leave reminder (→ employee), account created/password reset (→ user)
    - Create `NotificationEventListener` listening to Spring application events to trigger notifications
    - _Requirements: 16.1, 16.2, 16.3, 16.4, 16.5, 1.3, 2.3, 6.5_

- [x] 11. Audit Trail service
  - [x] 11.1 Implement audit service and event listener
    - Create `AuditService.recordAudit` persisting `AuditLog` entries with entity type, action, old/new values, performer, timestamp
    - Create `AuditEventListener` to automatically record audits for: leave request submissions, approvals/denials, balance adjustments, user account changes
    - _Requirements: 18.1, 18.2, 18.3, 18.4_
  - [x] 11.2 Implement audit query endpoint
    - Create `GET /api/admin/audit` with filters: `userId`, `actionType`, `startDate`, `endDate`, pagination
    - _Requirements: 18.5_

- [x] 12. Reporting service
  - [x] 12.1 Implement report generation service
    - Create `LeaveReportService` with methods for: leave usage by type/date range, leave balances by department, pending requests, leave trends by department/team
    - _Requirements: 13.1, 13.2, 13.3, 13.5_
  - [x] 12.2 Implement CSV export service and reporting controller
    - Create `ReportExportService` serializing report data to CSV
    - Create `ReportingController` exposing: `GET /api/admin/reports/leave-usage`, `GET /api/admin/reports/leave-balances`, `GET /api/admin/reports/pending-requests`, `GET /api/admin/reports/leave-trends`, `GET /api/admin/reports/export`
    - _Requirements: 13.1, 13.2, 13.3, 13.4, 13.5_

- [x] 13. Checkpoint — Backend complete
  - Ensure all backend unit and integration tests pass. Verify all API endpoints return correct HTTP status codes for happy paths and error cases. Ask the user if questions arise.

- [x] 14. Angular project structure and core module
  - [x] 14.1 Set up Angular project structure
    - Scaffold `core/`, `features/`, `shared/` module structure as defined in the design
    - Configure `app-routing.module.ts` with lazy-loaded feature routes
    - _Requirements: 14.4_
  - [x] 14.2 Implement core auth service and JWT interceptor
    - Create `AuthService` handling login, logout, token storage in sessionStorage, and role extraction
    - Create `JwtInterceptor` attaching `Authorization: Bearer <token>` to all outgoing requests
    - Create `ErrorInterceptor` handling 401 redirects and displaying error messages
    - _Requirements: 14.1, 14.6_
  - [x] 14.3 Implement route guards
    - Create `AuthGuard` redirecting unauthenticated users to login
    - Create `RoleGuard` restricting routes by role (admin-only, manager-only)
    - _Requirements: 14.4, 14.5_
  - [x] 14.4 Implement shared components
    - Create `HeaderComponent`, `SidebarComponent` with role-aware navigation links
    - Create `DataTableComponent` and `DatePickerComponent` as reusable shared components
    - _Requirements: 14.4_

- [x] 15. Authentication UI
  - [x] 15.1 Implement login component
    - Create `LoginComponent` with reactive form accepting username/email and password
    - Display validation errors and account-locked messages
    - On success, store token and redirect to dashboard
    - _Requirements: 14.1, 14.2, 14.3, 14.8_
  - [x] 15.2 Write unit tests for login component
    - Test form validation rejects empty fields
    - Test successful login navigates to dashboard
    - Test failed login displays error message
    - _Requirements: 14.1_

- [x] 16. User Management UI (Admin only)
  - [x] 16.1 Implement user list and create components
    - Create `UserListComponent` with search/filter by department and status, paginated table
    - Create `UserCreateComponent` reactive form with username, email, first/last name, role multi-select, department, manager fields
    - _Requirements: 1.2, 1.4_
  - [x] 16.2 Implement user edit component
    - Create `UserEditComponent` for updating profile fields, resetting password, activating/deactivating account, modifying roles and manager assignment
    - _Requirements: 2.1, 2.2, 3.1, 3.4, 6.1, 6.4_
  - [x] 16.3 Implement department and team management components
    - Create `DepartmentManagementComponent` and `TeamManagementComponent` with CRUD forms and lists
    - _Requirements: 4.1, 4.3, 4.6_

- [x] 17. Leave Request UI
  - [x] 17.1 Implement leave request form component
    - Create `LeaveRequestFormComponent` reactive form with leave type selector, duration type toggle (Full Day / Half Day / Hourly), conditional fields (session type for half-day, hours input for hourly), date pickers, reason textarea
    - Show available balance for selected leave type
    - _Requirements: 7.2, 7.3, 7.4_
  - [x] 17.2 Implement leave request list and detail components
    - Create `LeaveRequestListComponent` showing employee's own requests with status badges and cancel action
    - Create `LeaveRequestDetailComponent` showing full request details
    - _Requirements: 9.5, 12.1_
  - [x] 17.3 Implement leave balance component
    - Create `LeaveBalanceComponent` displaying a card per leave type with available, accrued, used days and accrual rate
    - _Requirements: 9.1, 9.4_
  - [x] 17.4 Write unit tests for leave request form component
    - Test half-day form requires session type field
    - Test hourly form requires hours input within 0.5–8 range
    - Test form is invalid when end date is before start date
    - _Requirements: 7.3, 7.4_

- [x] 18. Leave Approval UI (Manager only)
  - [x] 18.1 Implement pending requests component
    - Create `PendingRequestsComponent` listing all pending requests from direct reports with approve/deny actions
    - Deny action opens a modal requiring a denial reason
    - _Requirements: 8.1, 8.3_
  - [x] 18.2 Implement team calendar component
    - Create `TeamCalendarComponent` using FullCalendar (or equivalent) to display approved team leave
    - Support filtering by leave type and date range
    - Highlight dates with multiple team members on leave
    - Show employee name and leave type on click
    - Include public holidays on calendar
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5, 17.4_

- [x] 19. Leave Policy UI (Admin only)
  - [x] 19.1 Implement leave type management component
    - Create `LeaveTypeManagementComponent` with list and form for creating/editing leave types including accrual rate, max carry-over, min notice days
    - _Requirements: 10.1, 10.2, 10.3, 10.4_
  - [x] 19.2 Implement public holiday management component
    - Create `HolidayManagementComponent` with list, add form, and CSV import functionality
    - _Requirements: 17.1, 17.5_

- [x] 20. Reporting UI (Admin only)
  - [x] 20.1 Implement leave usage and balance report components
    - Create `LeaveUsageReportComponent` with date range and department filters, tabular results, and CSV export button
    - Create `BalanceReportComponent` showing all employee balances filterable by department
    - _Requirements: 13.1, 13.2, 13.4_
  - [x] 20.2 Implement audit report component
    - Create `AuditReportComponent` with filters for employee, date range, action type; paginated audit log table
    - _Requirements: 18.5_

- [x] 21. Upcoming leave reminder scheduler
  - Implement `ReminderScheduler` using `@Scheduled` to run daily, querying leave requests starting within 2 days and triggering reminder notifications to employees
  - _Requirements: 16.3_

- [x] 22. Integration and wiring
  - [x] 22.1 Wire Angular services to backend API endpoints
    - Create Angular services (`UserService`, `LeaveService`, `LeaveBalanceService`, `ReportService`, `AuditService`, `PolicyService`) calling the correct REST endpoints
    - Ensure all services use `JwtInterceptor` and handle errors via `ErrorInterceptor`
    - _Requirements: All_
  - [x] 22.2 Wire role-based navigation and route guards
    - Apply `AuthGuard` to all protected routes
    - Apply `RoleGuard` to admin-only and manager-only routes
    - Hide navigation items in sidebar based on user roles
    - _Requirements: 14.4, 14.5_
  - [x] 22.3 Wire audit logging into all mutating operations
    - Ensure `AuditEventListener` captures all required events: user CRUD, leave request lifecycle, balance adjustments
    - _Requirements: 18.1, 18.2, 18.3, 18.4_

- [x] 23. Final checkpoint — Ensure all tests pass
  - Run all backend unit and integration tests. Run all Angular component tests. Verify end-to-end flows for the three roles (Employee, Manager, Administrator). Ask the user if questions arise.

## Integration Testing and Issue Resolution

- [ ] 24. Frontend-Backend Integration Testing and Fixes
  - [x] 24.1 Fix API path inconsistencies in frontend services
    - Fix `leave.service.ts`: Update `getLeaveRequest()` to use `/leave/requests/${id}` (remove `/api` prefix)
    - Fix `leave.service.ts`: Update `cancelLeaveRequest()` to use `/leave/requests/${id}` (remove `/api` prefix)
    - Fix `leave.service.ts`: Update `approveLeaveRequest()` to use `/leave/requests/${id}/approve` (remove `/api` prefix)
    - Fix `leave.service.ts`: Update `denyLeaveRequest()` to use `/leave/requests/${id}/deny` (remove `/api` prefix)
    - _Issue: Frontend services have inconsistent API path prefixes - some include `/api`, some don't, but ApiService already adds `/api` prefix_
    - _Requirements: 7.1, 8.2, 8.3, 9.4, 12.1_

  - [x] 24.2 Fix API response format mismatches
    - Update `leave.service.ts` `getLeaveTypes()` to extract `leaveTypes` array from response wrapper: `map(res => res.leaveTypes)`
    - Update `leave.service.ts` `getPublicHolidays()` to extract `holidays` array from response wrapper: `map(res => res.holidays)`
    - Update `policy.service.ts` to handle wrapped responses for leave types and public holidays
    - _Issue: Backend returns wrapped responses like `{leaveTypes: [...]}` but frontend expects direct arrays_
    - _Requirements: 10.1, 17.1_

  - [x] 24.3 Test authentication flow integration
    - Test login with username - verify JWT token is stored and user roles are extracted correctly
    - Test login with email - verify backend accepts email in `usernameOrEmail` field
    - Test account lockout after 3 failed attempts - verify frontend displays lockout message
    - Test token refresh - verify expired tokens are refreshed automatically
    - Test logout - verify token is cleared and user is redirected to login
    - _Requirements: 14.1, 14.2, 14.3, 14.8_

  - [ ] 24.4 Test leave request submission integration
    - Test full-day leave request submission - verify backend receives correct `durationType: FULL_DAY`
    - Test half-day leave request submission - verify `sessionType` is sent and `endDate` equals `startDate`
    - Test hourly leave request submission - verify `durationInHours` is sent as number and dates are same
    - Test insufficient balance error - verify frontend displays backend error message
    - Test overlapping request error - verify frontend displays backend error message
    - Test policy violation error - verify frontend displays backend error message
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7, 10.5_

  - [ ] 24.5 Test leave balance display integration
    - Test balance retrieval - verify all leave types with balances are displayed
    - Test balance includes accrual rate - verify `accrualRate` field is present in response
    - Test balance includes hourly tracking - verify `availableHours` and `usedHours` are displayed for hourly leave types
    - Test balance updates after approval - verify balance decreases correctly for full-day, half-day, and hourly leaves
    - _Requirements: 9.1, 9.2, 9.4_

  - [ ] 24.6 Test leave approval workflow integration
    - Test manager views pending requests - verify only direct reports' requests are shown
    - Test approve request - verify backend deducts balance and updates status to APPROVED
    - Test deny request with reason - verify backend requires denial reason and updates status to DENIED
    - Test approval notification - verify employee receives email notification
    - Test denial notification - verify employee receives email notification with reason
    - _Requirements: 8.1, 8.2, 8.3, 8.4_

  - [ ] 24.7 Test leave calendar integration
    - Test calendar requires teamId parameter - verify frontend sends required `teamId` query param
    - Test calendar date filtering - verify `startDate` and `endDate` are sent in ISO format
    - Test calendar leave type filtering - verify optional `leaveTypeId` param is sent correctly
    - Test calendar displays public holidays - verify holidays are included in calendar entries
    - Test calendar highlights multiple leaves - verify frontend highlights dates with multiple team members on leave
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5, 17.4_

  - [ ] 24.8 Test user management integration (Admin only)
    - Test create user - verify temporary password is generated and sent to email
    - Test user list with filters - verify pagination, department filter, and status filter work correctly
    - Test update user profile - verify firstName, lastName, email, phone, address updates are saved
    - Test assign roles - verify multiple roles can be assigned and permissions update immediately
    - Test deactivate user - verify pending leave requests are cancelled
    - Test reset password - verify new temporary password is sent to user email
    - Test assign manager - verify manager-employee relationship is created
    - _Requirements: 1.2, 1.3, 1.4, 2.1, 2.2, 3.1, 3.5, 5.1, 6.1, 6.3_

  - [ ] 24.9 Test leave policy management integration
    - Test create leave type - verify accrual rate, max carry-over, and min notice days are saved
    - Test update leave type - verify changes are applied and affect new leave requests
    - Test get leave types - verify only active leave types are returned to employees
    - Test create public holiday - verify holiday is saved and excluded from leave calculations
    - Test import public holidays from CSV - verify bulk import works and returns imported count
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 17.1, 17.5_

  - [ ] 24.10 Test reporting integration (Admin only)
    - Test leave usage report - verify date range and department filters work correctly
    - Test leave balance report - verify all employee balances are returned with department filter
    - Test pending requests report - verify all pending requests across organization are shown
    - Test leave trends report - verify trends are grouped by department/team correctly
    - Test CSV export - verify report data is exported in correct CSV format
    - _Requirements: 13.1, 13.2, 13.3, 13.4, 13.5_

  - [ ] 24.11 Test audit trail integration (Admin only)
    - Test audit log retrieval - verify filters for userId, actionType, date range work correctly
    - Test audit log pagination - verify page and size parameters work correctly
    - Test audit records leave actions - verify leave submissions, approvals, denials are logged
    - Test audit records user actions - verify user creation, updates, deactivation are logged
    - Test audit records balance adjustments - verify manual balance adjustments are logged with reason
    - _Requirements: 18.1, 18.2, 18.3, 18.4, 18.5_

  - [ ] 24.12 Test error handling and validation integration
    - Test 401 Unauthorized - verify frontend redirects to login page
    - Test 403 Forbidden - verify frontend displays permission error message
    - Test 400 Bad Request with validation errors - verify frontend displays field-specific error messages
    - Test 404 Not Found - verify frontend displays resource not found message
    - Test 500 Internal Server Error - verify frontend displays generic error message
    - Test network errors - verify frontend displays connection error message
    - _Requirements: 14.4, 14.5_

  - [ ] 24.13 Test CORS configuration
    - Verify Angular dev server (http://localhost:4200) can make requests to backend (http://localhost:8080)
    - Verify preflight OPTIONS requests are handled correctly
    - Verify Authorization header is allowed in CORS configuration
    - Verify credentials are allowed in CORS configuration
    - _Requirements: 14.1_

  - [ ] 24.14 Test JWT token handling
    - Test JWT token is attached to all API requests via interceptor
    - Test JWT token expiration handling - verify 401 response triggers logout
    - Test JWT token refresh before expiration - verify token is refreshed automatically
    - Test JWT token contains correct user info - verify userId, username, roles are in token payload
    - Test role-based access control - verify ADMINISTRATOR, MANAGER, EMPLOYEE roles are enforced
    - _Requirements: 14.1, 14.4, 14.5, 14.6_

  - [ ] 24.15 Test leave cancellation integration
    - Test cancel pending request - verify balance is restored and status changes to CANCELLED
    - Test cancel approved request before start date - verify cancellation is allowed
    - Test cancel in-progress leave - verify manager approval is required
    - Test cancellation notification - verify manager receives email notification
    - Test calendar update after cancellation - verify leave is removed from calendar
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5_

  - [ ] 24.16 Test department and team management integration
    - Test create department - verify unique name constraint is enforced
    - Test create team - verify team is assigned to department correctly
    - Test assign user to team - verify user is automatically assigned to team's department
    - Test single-team constraint - verify user can only belong to one team at a time
    - Test list teams by department - verify department filter works correctly
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

  - [ ] 24.17 Test manager-employee relationship integration
    - Test assign manager to employee - verify relationship is created
    - Test single-manager constraint - verify employee can only have one direct manager
    - Test leave request routing - verify requests are assigned to correct manager
    - Test manager views only direct reports - verify manager sees only their team's requests
    - Test update manager assignment - verify old relationship is ended and new one is created
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 8.1_

  - [ ] 24.18 Test notification system integration
    - Test leave submission notification - verify manager receives email when employee submits request
    - Test approval notification - verify employee receives email when request is approved
    - Test denial notification - verify employee receives email with denial reason
    - Test cancellation notification - verify manager receives email when employee cancels request
    - Test upcoming leave reminder - verify employee receives reminder 2 days before leave starts
    - Test account creation notification - verify new user receives email with temporary password
    - Test password reset notification - verify user receives email with new temporary password
    - _Requirements: 16.1, 16.2, 16.3, 16.4, 16.5, 1.3, 2.3_

  - [ ] 24.19 Test accrual processing integration
    - Test manual accrual trigger - verify admin can trigger accrual processing
    - Test accrual calculation - verify correct amount is added based on accrual rate
    - Test carry-over limit enforcement - verify balance is capped at max carry-over
    - Test accrual transaction recording - verify transaction is logged with timestamp
    - Test manual balance adjustment - verify admin can adjust balance with reason
    - _Requirements: 15.1, 15.2, 15.3, 15.4, 15.5_

  - [ ] 24.20 Test working day calculation integration
    - Test weekend exclusion - verify Saturdays and Sundays are excluded from leave duration
    - Test public holiday exclusion - verify public holidays are excluded from leave duration
    - Test leave duration calculation - verify total days is calculated correctly for date ranges
    - Test half-day calculation - verify 0.5 days is deducted for half-day leaves
    - Test hourly calculation - verify hours are converted to fractional days correctly
    - _Requirements: 17.2, 17.3, 7.5, 7.6_

- [ ] 25. Create integration test documentation
  - Document all identified integration issues and their fixes
  - Document API endpoint mapping between frontend and backend
  - Document expected request/response formats for all endpoints
  - Document error handling patterns and expected error messages
  - Document authentication and authorization flow
  - Create integration testing checklist for future development
  - _Requirements: All_

- [ ] 26. Final integration checkpoint
  - Verify all integration tests pass
  - Verify all identified issues are fixed
  - Verify end-to-end flows work for all three roles (Employee, Manager, Administrator)
  - Verify error handling works correctly for all scenarios
  - Verify notifications are sent correctly for all events
  - Ask the user if questions arise

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP
- Each task references specific requirements for traceability
- No property-based tests are included — the design document explicitly states PBT is not applicable for this CRUD/workflow application; unit and integration tests are used throughout
- Checkpoints at tasks 13, 23, and 26 ensure incremental validation before proceeding
- Integration testing tasks (24.x) focus on identifying and fixing frontend-backend integration issues
- All integration issues must be documented and fixed before final checkpoint
