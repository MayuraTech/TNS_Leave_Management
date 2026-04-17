# Add Monthly Accrual Button Feature

## Summary

Added an "Add Monthly Accrual" button that appears when a user doesn't have any leave balances. This button initializes leave balances for the user based on the monthly accrual rates configured for each active leave type.

## Changes Made

### Backend Changes

#### AccrualController.java (`backend/src/main/java/com/tns/leavemgmt/leave/controller/AccrualController.java`)

Added new endpoint:
```java
POST /api/admin/users/{userId}/initialize-balances
```

**Purpose**: Initializes leave balances for a user based on monthly accrual rates

**Authorization**: Requires ADMINISTRATOR role

**Response**:
```json
{
  "message": "Leave balances initialized successfully",
  "balances": [
    {
      "leaveTypeId": 1,
      "leaveTypeName": "Annual Leave",
      "availableDays": 1.67,
      "usedDays": 0,
      "accruedDays": 1.67
    }
  ]
}
```

**How it works**:
- Calls `leaveBalanceService.initializeBalancesForNewUser(user)`
- Creates balance records for all active leave types
- Calculates initial balance based on monthly accrual rate
- Returns the newly created balances

### Frontend Changes

#### LeaveBalanceService (`frontend/src/app/core/services/leave-balance.service.ts`)

Added new method:
```typescript
initializeUserBalances(userId: number): Observable<{ message: string; balances: LeaveBalance[] }>
```

**Purpose**: Calls the backend endpoint to initialize balances for a user

#### UserBalanceAdjustmentComponent (`frontend/src/app/features/user-management/user-balance-adjustment/user-balance-adjustment.component.ts`)

**UI Changes**:
1. **Enhanced Empty State**: When no balances exist, shows:
   - Icon indicating no balances
   - Title: "No Leave Balances"
   - Description explaining what the button does
   - "Add Monthly Accrual" button (green, prominent)

2. **Button Behavior**:
   - Disabled state while initializing (shows "Initializing...")
   - Success notification after initialization
   - Error handling with user-friendly messages
   - Automatically displays the newly created balances

**Code Changes**:
- Added `isInitializing` state variable
- Added `initializeBalances()` method
- Updated template with enhanced empty state UI
- Added styles for the new button and empty state

## How It Works

### Monthly Accrual Calculation

The `initializeBalancesForNewUser()` method in `LeaveBalanceService`:

1. Gets all active leave types
2. For each leave type:
   - Retrieves the monthly accrual rate from the leave type configuration
   - Creates a `LeaveBalance` record for the current year
   - Sets `availableDays` = monthly accrual rate
   - Sets `accruedDays` = monthly accrual rate
   - Sets `usedDays` = 0

**Example**:
- If Annual Leave has a monthly accrual rate of 1.67 days/month
- Initial balance will be 1.67 days available

### User Flow

1. **Admin opens user edit page**
2. **Scrolls to Leave Balances section**
3. **If user has no balances**:
   - Sees empty state with icon and description
   - Clicks "Add Monthly Accrual" button
4. **System initializes balances**:
   - Creates balance records for all active leave types
   - Calculates initial balance based on monthly accrual rates
5. **Success notification appears**
6. **Balance list updates** to show the newly created balances
7. **Admin can now adjust balances** using the existing "Adjust" buttons

## Testing

### Test Scenario 1: User Without Balances
1. Log in as administrator
2. Navigate to User Management
3. Edit a user who has no leave balances
4. Scroll to "Leave Balances" section
5. Verify empty state is displayed with:
   - Icon
   - "No Leave Balances" title
   - Description text
   - "Add Monthly Accrual" button (green)
6. Click "Add Monthly Accrual"
7. Verify button shows "Initializing..." while processing
8. Verify success notification appears
9. Verify balance list updates with new balances
10. Verify each balance shows the monthly accrual amount

### Test Scenario 2: User With Existing Balances
1. Edit a user who already has leave balances
2. Verify the balance list is displayed normally
3. Verify "Add Monthly Accrual" button is NOT shown
4. Verify "Adjust" buttons are available for each balance

### Test Scenario 3: Error Handling
1. Simulate a network error or backend failure
2. Click "Add Monthly Accrual"
3. Verify error message is displayed
4. Verify button returns to normal state
5. Verify user can retry the operation

## Database Verification

After initializing balances, verify in the database:

```sql
-- Check newly created balances
SELECT 
    lb.id,
    u.username,
    lt.name as leave_type,
    lb.year,
    lb.available_days,
    lb.accrued_days,
    lb.used_days
FROM leave_balances lb
JOIN users u ON lb.user_id = u.id
JOIN leave_types lt ON lb.leave_type_id = lt.id
WHERE u.id = <user_id>
ORDER BY lt.name;
```

Expected results:
- One record per active leave type
- `available_days` = monthly accrual rate
- `accrued_days` = monthly accrual rate
- `used_days` = 0
- `year` = current year

## UI Design

### Empty State Design
- **Icon**: Document icon (SVG) in gray color
- **Title**: Bold, dark text
- **Description**: Smaller, gray text explaining the action
- **Button**: Green background (#10b981) to indicate a positive action
- **Layout**: Centered, with generous padding

### Button States
- **Normal**: Green background, white text, "Add Monthly Accrual"
- **Hover**: Darker green (#059669)
- **Disabled**: Gray background, "Initializing..."
- **Size**: Prominent, easy to click

## Related Files

- `backend/src/main/java/com/tns/leavemgmt/service/LeaveBalanceService.java` - Contains `initializeBalancesForNewUser()` method
- `backend/src/main/java/com/tns/leavemgmt/entity/LeaveType.java` - Contains monthly accrual rate configuration
- `backend/src/main/java/com/tns/leavemgmt/entity/LeaveBalance.java` - Balance entity

## Notes

- The monthly accrual rate is configured per leave type in the `leave_types` table
- Balances are created for the current year only
- If a user already has balances, the button is not shown
- The operation is idempotent - calling it multiple times won't create duplicate balances (existing balances are preserved)
- Only administrators can initialize balances
- The feature uses the same logic as automatic user creation balance initialization

## Future Improvements

### Consider Adding:
1. **Confirmation Dialog**: Ask admin to confirm before initializing balances
2. **Preview**: Show what balances will be created before confirming
3. **Bulk Initialization**: Initialize balances for multiple users at once
4. **Custom Initial Amount**: Allow admin to specify a different initial amount
5. **Historical Balances**: Option to create balances for previous years
6. **Audit Trail**: Log when balances are manually initialized
