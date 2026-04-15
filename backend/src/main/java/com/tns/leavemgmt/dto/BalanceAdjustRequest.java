package com.tns.leavemgmt.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
public class BalanceAdjustRequest {

    @NotNull
    private Long userId;

    @NotNull
    private Long leaveTypeId;

    @NotNull
    private BigDecimal amount;

    @NotBlank
    private String reason;
}
