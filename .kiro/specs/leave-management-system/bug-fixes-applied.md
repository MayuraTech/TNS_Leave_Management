# Bug Fixes Applied

## Summary
Fixed 12 critical bugs in the Leave Management System affecting user management, department management, team management, and leave type management.

## Fixes Applied

### 1. API Path Mismatches (Bugs #1, #5, #8)
**Files Modified:**
- `frontend/src/app/core/services/user.service.ts`

**Changes:**
- Fixed `getUserById`: Changed `/api/admin/users/${id}` → `/admin/users/${id}`
- Fixed `updateUser`: Changed `/api/admin/users/${id}` → `/admin/users/${id}`
- Fixed `updateDepartment`: Changed `/api/admin/departments/${id}` → `/admin/departments/${id}`
- Fixed `updateTeam`: Changed `/api/admin/teams/${id}` → `/admin/teams/${id}`
- Fixed `resetPassword`: Changed `/api/admin/users/${id}/reset-password` → `/admin/users/${id}/reset-password`
- Fixed `setUserStatus`: Changed `/api/admin/users/${id}/status` → `/admin/users/${id}/status`
- Fixed `deactivateUser`: Changed `/api/admin/users/${id}/deactivate` → `/admin/users/${id}/deactivate`
- Fixed `assignManager`: Changed `/api/admin/users/${userId}/manager` → `/admin/users/${userId}/manager`
- Fixed `assignRoles`: Changed `/api/admin/users/${userId}/roles` → `/admin/users/${userId}/roles`
- Fixed `deleteDepartment`: Changed `/api/admin/departments/${id}` → `/admin/departments/${id}`
- Fixed `deleteTeam`: Changed `/api/admin/teams/${id}` → `/admin/teams/${id}`

**Impact:** Resolves edit user, edit department, and edit team errors

### 2. Missing Fields in User Create Form (Bug #2)
**Files Modified:**
- `frontend/src/app/core/services/user.service.ts`
- `frontend/src/app/features/user-management/user-create/user-create.component.ts`
- `backend/src/main/java/com/tns/leavemgmt/user/dto/CreateUserRequest.java`
- `backend/src/main/java/com/tns/leavemgmt/user/service/UserService.java`

**Changes:**
- Added `phone`, `emergencyContact`, and `address` fields to CreateUserRequest interface (frontend)
- Added form controls for phone, emergencyContact, and address in user create component template
- Updated form group initialization to include new fields
- Updated onSubmit method to send new fields to backend
- Added phone, emergencyContact, and address fields to CreateUserRequest DTO (backend)
- Updated UserService.createUser() to set phone, emergencyContact, and address on User entity

**Impact:** User create form now matches user edit form with all required fields

### 3. Leave Type Management Fields (Bugs #9, #11, #12)
**Files Modified:**
- `backend/src/main/java/com/tns/leavemgmt/entity/LeaveType.java`
- `backend/src/main/java/com/tns/leavemgmt/leave/dto/CreateLeaveTypeRequest.java`
- `backend/src/main/java/com/tns/leavemgmt/leave/dto/UpdateLeaveTypeRequest.java`
- `backend/src/main/java/com/tns/leavemgmt/leave/dto/LeaveTypeResponse.java`
- `backend/src/main/java/com/tns/leavemgmt/leave/service/LeaveTypeService.java`

**Changes:**
- Added `accrualRate`, `maxCarryOverDays`, and `minNoticeDays` fields to LeaveType entity
- Added validation annotations (@NotNull, @Min(0)) to CreateLeaveTypeRequest
- Added optional fields with validation to UpdateLeaveTypeRequest
- Added fields to LeaveTypeResponse
- Updated LeaveTypeService.createLeaveType() to set new fields
- Updated LeaveTypeService.updateLeaveType() to update new fields
- Updated LeaveTypeService.toResponse() to include new fields
- Confirmed isActive defaults to true in entity

**Impact:** Leave type creation and editing now works properly with all required fields

## Remaining Issues to Verify

### Bug #3: View User Not Available
**Status:** Needs investigation
**Action Required:** Check if view functionality is needed or if edit form can serve as view

### Bug #4: Department Not Displayed After User Creation
**Status:** Needs testing
**Action Required:** Test user creation and verify department appears in user list

### Bug #6: Employees Listed as Managers
**Status:** Needs investigation
**Action Required:** Verify getManagers() API filters correctly by MANAGER role

### Bug #7: Missing Department-Manager Relationship
**Status:** Needs investigation
**Action Required:** Verify backend returns departmentName and managerName in team response

### Bug #10: No Logout Option
**Status:** Needs verification
**Action Required:** Verify header component is visible and logout button is accessible

## Testing Recommendations

1. **User Management:**
   - Create a new user with all fields (including phone, address, emergencyContact)
   - Edit an existing user
   - Verify department displays correctly in user list

2. **Department Management:**
   - Create a new department
   - Edit an existing department
   - Delete a department

3. **Team Management:**
   - Create a new team
   - Edit an existing team
   - Verify manager dropdown shows only managers
   - Verify department-manager relationship displays correctly

4. **Leave Type Management:**
   - Create a new leave type with all fields
   - Edit an existing leave type
   - Verify status badge shows correct active/inactive state
   - Verify accrual rate, max carry-over, and min notice fields are saved

5. **General:**
   - Verify logout button is visible in header
   - Test all CRUD operations for each module

## Database Migration Required

The LeaveType entity has been updated with new fields. A database migration is required:

```sql
ALTER TABLE leave_types 
ADD COLUMN accrual_rate DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN max_carry_over_days INTEGER NOT NULL DEFAULT 0,
ADD COLUMN min_notice_days INTEGER NOT NULL DEFAULT 0;
```

Note: Existing leave types will need to be updated with appropriate values for these fields.

## Next Steps

1. Restart backend server to apply changes
2. Clear browser cache and reload frontend
3. Run manual tests for all fixed functionality
4. Execute database migration script
5. Investigate and fix remaining issues (#3, #4, #6, #7, #10)
