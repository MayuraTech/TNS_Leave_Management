# Task 22: Integration Testing Guide

## Manual Testing Checklist

### Sub-task 22.1: Service Integration Tests

#### Test 1: Authentication Service
```
1. Navigate to login page
2. Enter valid credentials
3. Verify JWT token is stored in sessionStorage
4. Verify subsequent API calls include Authorization header
5. Verify 401 errors trigger logout and redirect to login
```

#### Test 2: User Service (Admin)
```
1. Login as administrator
2. Navigate to /admin/users
3. Verify user list loads from /api/admin/users
4. Create a new user
5. Verify POST to /api/admin/users succeeds
6. Edit a user
7. Verify PUT to /api/admin/users/{id} succeeds
8. Reset user password
9. Verify POST to /api/admin/users/{id}/reset-password succeeds
```

#### Test 3: Leave Service (Employee)
```
1. Login as employee
2. Navigate to /leave
3. Verify leave requests load from /api/leave/requests
4. Navigate to /leave/balance
5. Verify balances load from /api/leave/balance
6. Submit a new leave request
7. Verify POST to /api/leave/requests succeeds
8. Cancel a pending request
9. Verify DELETE to /api/leave/requests/{id} succeeds
```

#### Test 4: Leave Approval Service (Manager)
```
1. Login as manager
2. Navigate to /approval/pending
3. Verify pending requests load from /api/manager/pending-requests
4. Approve a request
5. Verify PUT to /api/leave/requests/{id}/approve succeeds
6. Deny a request with reason
7. Verify PUT to /api/leave/requests/{id}/deny succeeds
```

#### Test 5: Policy Service (Admin)
```
1. Login as administrator
2. Navigate to /admin/policy/leave-types
3. Verify leave types load from /api/leave-types
4. Create a new leave type
5. Verify POST to /api/admin/leave-types succeeds
6. Navigate to /admin/policy/holidays
7. Verify holidays load from /api/public-holidays
8. Add a public holiday
9. Verify POST to /api/admin/public-holidays succeeds
```

#### Test 6: Report Service (Admin)
```
1. Login as administrator
2. Navigate to /admin/reports/leave-usage
3. Apply filters and generate report
4. Verify GET to /api/admin/reports/leave-usage with params
5. Export report to CSV
6. Verify GET to /api/admin/reports/export returns blob
```

#### Test 7: Audit Service (Admin)
```
1. Login as administrator
2. Navigate to /admin/reports/audit
3. Verify audit logs load from /api/admin/audit
4. Apply filters (user, action type, date range)
5. Verify filtered results load correctly
6. Navigate through pages
7. Verify pagination works correctly
```

### Sub-task 22.2: Route Guard Tests

#### Test 8: AuthGuard
```
1. Logout (clear sessionStorage)
2. Try to access /leave
3. Verify redirect to /auth/login
4. Try to access /admin/users
5. Verify redirect to /auth/login
6. Login as employee
7. Verify redirect to /leave (default route)
```

#### Test 9: RoleGuard - Employee Access
```
1. Login as employee (no MANAGER or ADMINISTRATOR role)
2. Try to access /approval/pending
3. Verify redirect to /unauthorized
4. Try to access /admin/users
5. Verify redirect to /unauthorized
6. Try to access /admin/policy
7. Verify redirect to /unauthorized
8. Try to access /admin/reports
9. Verify redirect to /unauthorized
10. Access /leave
11. Verify access granted
```

#### Test 10: RoleGuard - Manager Access
```
1. Login as manager (MANAGER role, not ADMINISTRATOR)
2. Access /approval/pending
3. Verify access granted
4. Access /approval/calendar
5. Verify access granted
6. Try to access /admin/users
7. Verify redirect to /unauthorized
8. Try to access /admin/policy
9. Verify redirect to /unauthorized
10. Try to access /admin/reports
11. Verify redirect to /unauthorized
```

#### Test 11: RoleGuard - Administrator Access
```
1. Login as administrator
2. Access /admin/users
3. Verify access granted
4. Access /admin/policy
5. Verify access granted
6. Access /admin/reports
7. Verify access granted
8. Access /approval/pending
9. Verify access granted (admin has all permissions)
```

#### Test 12: Sidebar Navigation
```
1. Login as employee
2. Verify sidebar shows:
   - My Leave
   - Apply Leave
3. Verify sidebar does NOT show:
   - Approvals
   - Users
   - Leave Policy
   - Reports
   - Audit Trail

4. Login as manager
5. Verify sidebar shows:
   - My Leave
   - Apply Leave
   - Approvals
6. Verify sidebar does NOT show:
   - Users
   - Leave Policy
   - Reports
   - Audit Trail

7. Login as administrator
8. Verify sidebar shows ALL items:
   - My Leave
   - Apply Leave
   - Approvals
   - Users
   - Leave Policy
   - Reports
   - Audit Trail
```

### Sub-task 22.3: Audit Logging Tests

#### Test 13: Leave Request Audit
```
1. Login as employee
2. Submit a leave request
3. Login as administrator
4. Navigate to /admin/reports/audit
5. Filter by action type "SUBMITTED"
6. Verify audit entry exists with:
   - Entity Type: LeaveRequest
   - Action: SUBMITTED
   - Performed By: Employee username
   - New Value: Contains leave details
```

#### Test 14: Leave Approval Audit
```
1. Login as manager
2. Approve a pending leave request with comments
3. Login as administrator
4. Navigate to /admin/reports/audit
5. Filter by action type "APPROVED"
6. Verify audit entry exists with:
   - Entity Type: LeaveRequest
   - Action: APPROVED
   - Performed By: Manager username
   - New Value: Contains approval details and comments
```

#### Test 15: Leave Denial Audit
```
1. Login as manager
2. Deny a pending leave request with reason
3. Login as administrator
4. Navigate to /admin/reports/audit
5. Filter by action type "DENIED"
6. Verify audit entry exists with:
   - Entity Type: LeaveRequest
   - Action: DENIED
   - Performed By: Manager username
   - New Value: Contains denial reason
```

#### Test 16: Balance Adjustment Audit
```
1. Login as administrator
2. Navigate to user management
3. Manually adjust a user's leave balance
4. Navigate to /admin/reports/audit
5. Filter by action type "ADJUSTED"
6. Verify audit entry exists with:
   - Entity Type: LeaveBalance
   - Action: ADJUSTED
   - Performed By: Administrator username
   - Old Value: Previous balance
   - New Value: New balance and reason
```

#### Test 17: User Account Audit
```
1. Login as administrator
2. Create a new user account
3. Navigate to /admin/reports/audit
4. Filter by action type "CREATED"
5. Verify audit entry exists with:
   - Entity Type: User
   - Action: CREATED
   - Performed By: Administrator username
   - New Value: Contains user details

6. Update the user's profile
7. Filter by action type "UPDATED"
8. Verify audit entry exists with old and new values

9. Deactivate the user
10. Filter by action type "DEACTIVATED"
11. Verify audit entry exists
```

## Automated Test Scenarios

### Unit Tests for Services

```typescript
// Example: UserService unit test
describe('UserService', () => {
  let service: UserService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [UserService, ApiService]
    });
    service = TestBed.inject(UserService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  it('should call correct endpoint for getUsers', () => {
    service.getUsers({ page: 0, size: 20 }).subscribe();
    const req = httpMock.expectOne(req => 
      req.url.includes('/api/admin/users') && 
      req.params.get('page') === '0'
    );
    expect(req.request.method).toBe('GET');
  });

  it('should call correct endpoint for createUser', () => {
    const user = { username: 'test', email: 'test@test.com', ... };
    service.createUser(user).subscribe();
    const req = httpMock.expectOne('/api/admin/users');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(user);
  });
});
```

### Integration Tests for Route Guards

```typescript
// Example: RoleGuard integration test
describe('RoleGuard', () => {
  let guard: RoleGuard;
  let authService: AuthService;
  let router: Router;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        RoleGuard,
        { provide: AuthService, useValue: mockAuthService },
        { provide: Router, useValue: mockRouter }
      ]
    });
    guard = TestBed.inject(RoleGuard);
    authService = TestBed.inject(AuthService);
    router = TestBed.inject(Router);
  });

  it('should allow access for admin to admin routes', () => {
    spyOn(authService, 'hasAnyRole').and.returnValue(true);
    const route = { data: { roles: ['ADMINISTRATOR'] } } as any;
    const result = guard.canActivate(route);
    expect(result).toBe(true);
  });

  it('should deny access for employee to admin routes', () => {
    spyOn(authService, 'hasAnyRole').and.returnValue(false);
    spyOn(router, 'createUrlTree');
    const route = { data: { roles: ['ADMINISTRATOR'] } } as any;
    guard.canActivate(route);
    expect(router.createUrlTree).toHaveBeenCalledWith(['/unauthorized']);
  });
});
```

## Expected Results

### All Tests Should Pass:
- ✅ All API calls use correct endpoints with `/api` prefix
- ✅ JWT token is included in all authenticated requests
- ✅ 401 errors trigger logout and redirect
- ✅ 403 errors show permission denied message
- ✅ Route guards prevent unauthorized access
- ✅ Sidebar shows/hides items based on roles
- ✅ All mutating operations create audit log entries
- ✅ Audit log entries contain correct information

### Common Issues to Watch For:
- ❌ Missing `/api` prefix in service calls
- ❌ JWT token not attached to requests
- ❌ Route guards not applied to protected routes
- ❌ Sidebar showing admin items to non-admin users
- ❌ Audit events not being published from services
- ❌ Audit log entries missing required fields

## Browser DevTools Verification

### Network Tab:
1. Open browser DevTools (F12)
2. Go to Network tab
3. Perform actions (login, create user, submit leave, etc.)
4. Verify:
   - Request URLs match expected endpoints
   - Authorization header is present: `Bearer <token>`
   - Response status codes are correct (200, 201, 401, 403, etc.)

### Console Tab:
1. Check for any JavaScript errors
2. Verify no 404 errors for API endpoints
3. Check for any CORS errors

### Application Tab:
1. Go to Storage → Session Storage
2. Verify `auth_token` is stored after login
3. Verify token is removed after logout

## Performance Checks

1. **Initial Load Time:**
   - Login page should load in < 1 second
   - Dashboard should load in < 2 seconds

2. **API Response Times:**
   - Simple GET requests: < 500ms
   - POST/PUT requests: < 1 second
   - Report generation: < 3 seconds

3. **Navigation:**
   - Route transitions: < 300ms
   - Lazy-loaded modules: < 1 second

## Security Verification

1. **Token Security:**
   - Token stored in sessionStorage (not localStorage)
   - Token cleared on logout
   - Token not visible in URL

2. **Route Protection:**
   - Cannot access protected routes without authentication
   - Cannot access admin routes without admin role
   - Proper error messages for unauthorized access

3. **API Security:**
   - Backend validates JWT on every request
   - Backend enforces role-based access control
   - Sensitive operations require admin role

## Conclusion

This testing guide covers all aspects of Task 22 integration:
- Service wiring and API endpoint correctness
- Route guard functionality and role-based access
- Audit logging for all mutating operations

Complete all tests to ensure the integration is working correctly.
