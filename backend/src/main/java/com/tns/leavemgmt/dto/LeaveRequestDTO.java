package com.tns.leavemgmt.dto;

import com.tns.leavemgmt.entity.enums.LeaveDurationType;
import com.tns.leavemgmt.entity.enums.SessionType;
import jakarta.validation.constraints.*;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * DTO for submitting a leave request.
 * Requirements: 7.2, 7.3, 7.4
 */
@Getter
@Setter
public class LeaveRequestDTO {

    @NotNull(message = "Leave type is required")
    private Long leaveTypeId;

    @NotNull(message = "Start date is required")
    private LocalDate startDate;

    @NotNull(message = "End date is required")
    private LocalDate endDate;

    @NotNull(message = "Duration type is required")
    private LeaveDurationType durationType;

    // Required when durationType is HALF_DAY
    private SessionType sessionType;

    // Required when durationType is HOURLY; min 0.5, max 8
    @DecimalMin(value = "0.5", message = "Duration in hours must be at least 0.5")
    @DecimalMax(value = "8.0", message = "Duration in hours must not exceed 8.0")
    private BigDecimal durationInHours;

    @NotBlank(message = "Reason is required")
    @Size(max = 1000, message = "Reason must not exceed 1000 characters")
    private String reason;

    /**
     * Validates that sessionType is provided when durationType is HALF_DAY.
     * Requirement 7.3
     */
    @AssertTrue(message = "Session type (MORNING/AFTERNOON) is required for half-day leave")
    public boolean isSessionTypeValid() {
        if (durationType == LeaveDurationType.HALF_DAY) {
            return sessionType != null;
        }
        return true;
    }

    /**
     * Validates that durationInHours is provided and positive when durationType is HOURLY.
     * Requirement 7.4
     */
    @AssertTrue(message = "Duration in hours is required and must be greater than 0 for hourly leave")
    public boolean isDurationInHoursValid() {
        if (durationType == LeaveDurationType.HOURLY) {
            return durationInHours != null && durationInHours.compareTo(BigDecimal.ZERO) > 0;
        }
        return true;
    }

    /**
     * Validates that start and end date are the same for hourly leave.
     * Requirement 7.4
     */
    @AssertTrue(message = "Start date and end date must be the same for hourly leave")
    public boolean isHourlyDateRangeValid() {
        if (durationType == LeaveDurationType.HOURLY && startDate != null && endDate != null) {
            return startDate.equals(endDate);
        }
        return true;
    }

    /**
     * Validates that start and end date are the same for half-day leave.
     * Requirement 7.3
     */
    @AssertTrue(message = "Start date and end date must be the same for half-day leave")
    public boolean isHalfDayDateRangeValid() {
        if (durationType == LeaveDurationType.HALF_DAY && startDate != null && endDate != null) {
            return startDate.equals(endDate);
        }
        return true;
    }
}
