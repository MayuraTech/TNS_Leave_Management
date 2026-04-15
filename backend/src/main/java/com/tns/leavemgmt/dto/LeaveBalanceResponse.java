package com.tns.leavemgmt.dto;

import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
public class LeaveBalanceResponse {

    private Long leaveTypeId;
    private String leaveTypeName;
    private BigDecimal availableDays;
    private BigDecimal accruedDays;
    private BigDecimal usedDays;
    private BigDecimal accrualRate;
    private BigDecimal availableHours;
    private BigDecimal usedHours;
}
