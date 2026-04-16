# User Edit Manager Dropdown Fix

## Problem

In the user edit page, even though a user has a manager assigned, the manager dropdown shows "No Manager" selected.

## Root Causes

### Issue 1: Frontend Using Wrong Field
The user edit component was using `user.teamId` to populate the manager dropdown instead of `user.managerId`.

**Location**: `frontend/src/app/features/user-management/user-edit/user-edit.component.ts`

**Before**:
```typescript
this.rolesForm.patchValue({
  departmentId: user.departmentId ?? '',
  managerId: user.teamId ?? ''  // ❌ Wrong field
});
```

**After**:
```typescript
this.rolesForm.patchValue({
  departmentId: user.departmentId ?? '',
  managerId: user.managerId ?? ''  // ✅ Correct field
});
```

### Issue 2: Backend Using Wrong Service
The backend `UserService.updateUser()` method was treating `managerId` as a `teamId` and trying to look it up in the `teams` table instead of using the `ManagerRelationshipService` to properly assign the manager.

**Location**: `backend/src/main/java/com/tns/leavemgmt/user/service/UserService.java`

**Before**:
```java
// Update team (manager) if provided
if (request.getManagerId() != null) {
    Team team = teamRepository.findById(request.getManagerId())
            .orElse(null);
    user.setTeam(team);  // ❌ Wrong - treating manager as team
    log.info("Updated user team: userId={}, managerId={}", userId, request.getManagerId());
}
```

**After**:
```java
// Update manager if provided - use ManagerRelationshipService
if (request.getManagerId() != null) {
    managerRelationshipService.assignManager(userId, request.getManagerId(), performedBy);  // ✅ Correct
    log.info("Updated user manager: userId={}, managerId={}", userId, request.getManagerId());
}
```

## Changes Made

### Backend Changes

#### UserService.java
- Changed manager assignment logic to use `ManagerRelationshipService.assignManager()`
- This properly creates/updates the `manager_employee` relationship
- Closes any existing manager relationship before creating a new one (enforces single-manager constraint)
- Records audit logs for manager assignments

### Frontend Changes

#### user-edit.component.ts
- Changed `patchForms()` method to use `user.managerId` instead of `user.teamId`
- This ensures the manager dropdown is populated with the correct value when editing a user

## How It Works Now

### When Loading User Edit Page:
1. Backend fetches user with `getUserById()`
2. `UserService.convertToUserResponse()` queries `manager_employee` table for active manager
3. Response includes `managerId` and `managerName`
4. Frontend populates the manager dropdown with `user.managerId`

### When Saving Manager Assignment:
1. Frontend sends `managerId` in the update request
2. Backend calls `managerRelationshipService.assignManager()`
3. Service closes any existing manager relationship
4. Service creates new manager-employee relationship
5. Audit log is recorded

## Testing

### Test Scenario 1: View User with Manager
1. Log in as administrator
2. Navigate to User Management
3. Click "Edit" on a user who has a manager assigned
4. Verify the Manager dropdown shows the correct manager selected

### Test Scenario 2: Change Manager
1. In the user edit page, select a different manager from the dropdown
2. Click "Save Roles & Organisation"
3. Verify success message appears
4. Refresh the page
5. Verify the new manager is selected in the dropdown

### Test Scenario 3: Remove Manager
1. In the user edit page, select "— No Manager —" from the dropdown
2. Click "Save Roles & Organisation"
3. Verify the manager relationship is removed
4. Check the database: `SELECT * FROM manager_employee WHERE employee_id = X AND effective_to IS NULL`
5. Should return no results

## Database Verification

After making changes, verify in the database:

```sql
-- Check active manager relationships
SELECT 
    e.username as employee,
    m.username as manager,
    me.effective_from,
    me.effective_to
FROM manager_employee me
JOIN users e ON me.employee_id = e.id
JOIN users m ON me.manager_id = m.id
WHERE me.effective_to IS NULL
ORDER BY e.username;
```

## Related Changes

This fix complements the previous changes:
- `MANAGER_COLUMN_ADDED.md` - Added manager column to user list
- `MANAGER_EMPLOYEE_MAPPING_FIX.md` - Fixed manager-employee relationships in database

## Notes

- The manager dropdown only shows users with the MANAGER role
- The current user is excluded from the manager list (can't be their own manager)
- Manager assignments are now properly tracked in the `manager_employee` table
- The old `team` relationship is no longer used for manager assignments
- Audit logs are automatically created for manager assignments

## Future Improvements

### Consider Adding:
1. **Validation**: Prevent circular manager relationships (A manages B, B manages A)
2. **Bulk Assignment**: Allow assigning the same manager to multiple employees at once
3. **Manager History**: Show historical manager assignments in the UI
4. **Notifications**: Notify managers when they're assigned new direct reports
