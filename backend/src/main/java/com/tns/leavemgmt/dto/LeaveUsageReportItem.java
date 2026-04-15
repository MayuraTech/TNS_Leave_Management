package com.tns.leavemgmt.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * DTO for leave usage grouped by leave type.
 * Requirements: 13.1
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LeaveUsageReportItem {
    private String leaveTypeName;
    private Long totalRequests;
    private BigDecimal totalDays;
}
