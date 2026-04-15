package com.tns.leavemgmt.leave.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LeavePolicyResponse {

    private Long id;
    private Long leaveTypeId;
    private String leaveTypeName;
    private BigDecimal accrualRate;
    private Integer maxCarryOverDays;
    private Integer minNoticeDays;
    private LocalDate effectiveFrom;
    private LocalDate effectiveTo;
}
