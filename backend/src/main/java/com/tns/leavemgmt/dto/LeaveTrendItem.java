package com.tns.leavemgmt.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * DTO for leave trends grouped by department or team.
 * Requirements: 13.5
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LeaveTrendItem {
    private String groupName;
    private String groupType;
    private Long totalRequests;
    private BigDecimal totalDays;
    private BigDecimal averageDaysPerRequest;
}
