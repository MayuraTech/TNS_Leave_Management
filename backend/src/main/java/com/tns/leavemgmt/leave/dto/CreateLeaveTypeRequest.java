package com.tns.leavemgmt.leave.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Min;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateLeaveTypeRequest {

    @NotBlank
    private String name;

    private String description;

    @NotNull
    @Min(0)
    private Double accrualRate;

    @NotNull
    @Min(0)
    private Integer maxCarryOverDays;

    @NotNull
    @Min(0)
    private Integer minNoticeDays;
}
