# Leave Type Status Fix

## Issue
Leave types were showing as "Inactive" in the frontend even though they were created with `isActive = true` in the database.

## Root Cause
**Java Bean Naming Convention Issue with Jackson JSON Serialization**

In Java, when you have a boolean field named `isActive`, the Lombok `@Data` annotation generates:
- Getter: `isActive()` (not `getIsActive()`)
- Setter: `setActive()` (not `setIsActive()`)

Jackson (the JSON serializer) follows Java Bean conventions and serializes the field as `"active"` instead of `"isActive"` because it removes the "is" prefix from the getter method name.

**What was happening:**
1. Backend entity had: `private boolean isActive = true;`
2. Jackson serialized it as: `"active": true` (removing "is" prefix)
3. Frontend model expected: `isActive: boolean`
4. Frontend received: `active: true` but looked for `isActive`
5. Result: `isActive` was `undefined`, which is falsy, so status showed as "Inactive"

## Solution
Added `@JsonProperty("isActive")` annotation to explicitly tell Jackson to serialize the field as `"isActive"` instead of `"active"`.

## Files Modified

### backend/src/main/java/com/tns/leavemgmt/leave/dto/LeaveTypeResponse.java
```java
import com.fasterxml.jackson.annotation.JsonProperty;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LeaveTypeResponse {
    private Long id;
    private String name;
    private String description;
    private Double accrualRate;
    private Integer maxCarryOverDays;
    private Integer minNoticeDays;
    
    @JsonProperty("isActive")  // ← Added this annotation
    private boolean isActive;
    
    private LocalDateTime createdAt;
}
```

## Verification
After restarting the backend:
1. Create a new leave type
2. Verify it shows as "Active" in the leave types list
3. Verify you can now apply for leave using this leave type

## Technical Details
- **Before**: JSON response had `"active": true`
- **After**: JSON response has `"isActive": true`
- Frontend model matches backend response
- Status badge now displays correctly

## Related Files
- Backend DTO: `backend/src/main/java/com/tns/leavemgmt/leave/dto/LeaveTypeResponse.java`
- Frontend Model: `frontend/src/app/core/models/leave-balance.model.ts`
- Frontend Component: `frontend/src/app/features/leave-policy/leave-type-management/leave-type-management.component.ts`
