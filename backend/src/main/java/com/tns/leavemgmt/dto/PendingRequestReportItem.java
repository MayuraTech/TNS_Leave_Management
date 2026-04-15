package com.tns.leavemgmt.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * DTO for pending leave requests report.
 * Requirements: 13.3
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PendingRequestReportItem {
    private Long requestId;
    private String employeeName;
    private String department;
    private String leaveTypeName;
    private LocalDate startDate;
    private LocalDate endDate;
    private BigDecimal totalDays;
    private LocalDateTime submittedAt;
}
