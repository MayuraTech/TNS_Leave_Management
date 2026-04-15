package com.tns.leavemgmt.dto;

import com.tns.leavemgmt.entity.LeaveDurationType;
import com.tns.leavemgmt.entity.SessionType;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * Represents a single entry in the leave calendar response.
 * Can be either an approved leave request or a public holiday.
 * Requirements: 11.1, 11.2, 11.3, 11.4, 11.5, 17.4
 */
@Getter
@Setter
public class CalendarEntryResponse {

    /** Discriminator: "LEAVE" or "PUBLIC_HOLIDAY" */
    private String entryType;

    // --- Leave request fields (populated when entryType = "LEAVE") ---
    private Long leaveRequestId;
    private Long employeeId;
    private String employeeName;
    private Long leaveTypeId;
    private String leaveTypeName;
    private LocalDate startDate;
    private LocalDate endDate;
    private LeaveDurationType durationType;
    private SessionType sessionType;
    private BigDecimal durationInHours;
    private BigDecimal totalDays;

    // --- Public holiday fields (populated when entryType = "PUBLIC_HOLIDAY") ---
    private Long holidayId;
    private LocalDate holidayDate;
    private String holidayName;
}
