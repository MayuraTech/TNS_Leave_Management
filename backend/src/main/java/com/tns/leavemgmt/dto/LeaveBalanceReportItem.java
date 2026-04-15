package com.tns.leavemgmt.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * DTO for leave balance per employee per leave type.
 * Requirements: 13.2
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LeaveBalanceReportItem {
    private Long employeeId;
    private String employeeName;
    private String department;
    private String leaveTypeName;
    private BigDecimal availableDays;
    private BigDecimal usedDays;
    private BigDecimal accruedDays;
}
