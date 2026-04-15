package com.tns.leavemgmt.leave.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
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
public class CreateLeavePolicyRequest {

    @NotNull
    private Long leaveTypeId;

    @NotNull
    @DecimalMin(value = "0.0", inclusive = false)
    private BigDecimal accrualRate;

    @NotNull
    @Min(0)
    private Integer maxCarryOverDays;

    @NotNull
    @Min(0)
    private Integer minNoticeDays;

    @NotNull
    private LocalDate effectiveFrom;

    private LocalDate effectiveTo;
}
