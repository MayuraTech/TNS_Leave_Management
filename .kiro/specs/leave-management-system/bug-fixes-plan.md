# Bug Fixes Plan

## Identified Bugs and Solutions

### 1. Edit User Not Working
**Issue**: User list component only has "Edit" link, but no "View" action
**Root Cause**: User list template has edit link but user-edit route might have issues
**Solution**: Verify routing and ensure edit functionality works properly

### 2. Missing Fields in Create User Form
**Issue**: Create user form is missing phone, address, and emergencyContact fields
**Root Cause**: user-create.component.ts only has username, email, firstName, lastName in form
**Solution**: Add phone, address, and emergencyContact fields to create form (matching edit form)

### 3. View User Not Available
**Issue**: No "View" button/link in user list
**Root Cause**: User list template only has "Edit" action, no "View" action
**Solution**: Add "View" action to user list or make edit form read-only view mode

### 4. Department Not Displayed After User Creation
**Issue**: Department name not showing in user list after creation
**Root Cause**: User list uses getDepartmentName() which looks up from departments array
**Solution**: Verify department is properly saved and loaded in user list

### 5. Edit Department Error on Save
**Issue**: Department edit form shows error when saving
**Root Cause**: API path mismatch - updateDepartment uses `/api/admin/departments/${id}` but should use `/admin/departments/${id}`
**Solution**: Fix API path in user.service.ts updateDepartment method

### 6. Employees Listed as Managers in Team Management
**Issue**: Manager dropdown shows all users instead of only managers
**Root Cause**: getManagers() API call filters by role='MANAGER' but might not be working correctly
**Solution**: Verify backend API returns only managers, or fix frontend filtering

### 7. Missing Department-Manager Relationship in Team Management
**Issue**: Team management doesn't show department-manager relationship properly
**Root Cause**: Team table shows departmentName and managerName but might not be populated
**Solution**: Verify backend returns departmentName and managerName in team response

### 8. Edit Team Management Error on Save
**Issue**: Team edit form shows error when saving
**Root Cause**: API path mismatch - updateTeam uses `/api/admin/teams/${id}` but should use `/admin/teams/${id}`
**Solution**: Fix API path in user.service.ts updateTeam method

### 9. Edit Leave Type Not Working
**Issue**: Leave type edit form doesn't work properly
**Root Cause**: Leave type component has edit functionality but might have API issues
**Solution**: Verify leave type update API and form submission

### 10. No Logout Option
**Issue**: User reports no logout option visible
**Root Cause**: Header component has logout functionality but might not be visible
**Solution**: Verify header component is included in layout and logout button is visible

### 11. Leave Types Showing Inactive Status
**Issue**: Leave types display as inactive when they should be active
**Root Cause**: Backend might not be setting isActive=true by default, or frontend display issue
**Solution**: Verify backend sets isActive=true for new leave types, check frontend display logic

### 12. Active Leave Type Shows as Inactive in UI
**Issue**: Leave type status badge shows incorrect status
**Root Cause**: Status badge logic might be inverted or backend returns wrong value
**Solution**: Verify status badge logic and backend response

## Priority Order

1. **High Priority** (Blocking user workflows):
   - Bug #2: Missing fields in create user form
   - Bug #5: Edit department error on save
   - Bug #8: Edit team management error on save
   - Bug #9: Edit leave type not working

2. **Medium Priority** (Usability issues):
   - Bug #1: Edit user not working
   - Bug #3: View user not available
   - Bug #4: Department not displayed after user creation
   - Bug #11: Leave types showing inactive status
   - Bug #12: Active leave type shows as inactive

3. **Low Priority** (Minor issues):
   - Bug #6: Employees listed as managers
   - Bug #7: Missing department-manager relationship
   - Bug #10: No logout option (already exists, just verify visibility)

## Implementation Plan

1. Fix API path mismatches in user.service.ts (Bugs #5, #8)
2. Add missing fields to user create form (Bug #2)
3. Investigate and fix leave type edit issues (Bug #9)
4. Fix leave type status display (Bugs #11, #12)
5. Add view user functionality (Bug #3)
6. Fix user edit routing (Bug #1)
7. Fix department display in user list (Bug #4)
8. Fix manager filtering in team management (Bug #6)
9. Verify logout button visibility (Bug #10)
10. Verify department-manager relationship (Bug #7)
