# Manager Column Added to Users Page

## Summary

Added a "Manager" column to the Users page that displays the manager name for each employee based on the active manager-employee relationship.

## Changes Made

### Backend Changes

#### 1. UserResponse DTO (`backend/src/main/java/com/tns/leavemgmt/user/dto/UserResponse.java`)
- Added `managerId` field (Long)
- Added `managerName` field (String)

#### 2. UserService (`backend/src/main/java/com/tns/leavemgmt/user/service/UserService.java`)
- Injected `ManagerRelationshipService` dependency
- Updated `convertToUserResponse()` method to fetch and populate manager information
- Uses `managerRelationshipService.getManagerForEmployee()` to get the active manager relationship
- Gracefully handles cases where no manager is assigned (displays "—")

### Frontend Changes

#### 1. User Model (`frontend/src/app/core/models/user.model.ts`)
- Added `managerId?: number` field
- Added `managerName?: string` field

#### 2. User List Component (`frontend/src/app/features/user-management/user-list/user-list.component.ts`)
- Added "Manager" column header in the table
- Displays `user.managerName` or "—" if no manager is assigned
- Updated empty state colspan from 7 to 8 to account for the new column

## How It Works

1. **Backend**: When the user list is fetched, the `UserService` queries the `manager_employee` table for each user to find their active manager relationship (where `effective_to IS NULL`)

2. **Manager Information**: If a manager is found, the manager's ID and full name (firstName + lastName) are included in the UserResponse

3. **Frontend Display**: The user list table displays the manager name in a new column, showing "—" for users without an assigned manager

## Testing

### Test Scenario 1: View Users with Managers
1. Log in as an administrator
2. Navigate to User Management page
3. Verify the "Manager" column is displayed
4. Verify employees show their manager's name

### Test Scenario 2: View Users without Managers
1. Check users who don't have a manager assigned
2. Verify they display "—" in the Manager column

### Test Scenario 3: After Running Manager Setup Script
1. Run the `setup_manager_employee_relationships.sql` script
2. Refresh the Users page
3. Verify all employees now show their assigned managers

## Related Files

- `setup_manager_employee_relationships.sql` - Script to set up proper manager-employee relationships
- `MANAGER_EMPLOYEE_MAPPING_FIX.md` - Documentation of the manager-employee mapping issue and fix

## Notes

- The manager information is fetched from the `manager_employee` table based on active relationships
- Only active relationships (where `effective_to IS NULL`) are considered
- The backend gracefully handles cases where the manager relationship query fails
- Performance: Each user in the list triggers a separate query to fetch manager information. For large user lists, consider optimizing with a JOIN query or caching.

## Future Improvements

### Performance Optimization
Consider optimizing the manager lookup by:
1. Adding a JOIN in the repository query to fetch managers in a single query
2. Using a DTO projection that includes manager information
3. Implementing caching for manager relationships

Example optimized query:
```java
@Query("SELECT u FROM User u " +
       "LEFT JOIN ManagerEmployee me ON me.employee.id = u.id AND me.effectiveTo IS NULL " +
       "LEFT JOIN User m ON me.manager.id = m.id")
Page<User> findAllWithManagers(Pageable pageable);
```
