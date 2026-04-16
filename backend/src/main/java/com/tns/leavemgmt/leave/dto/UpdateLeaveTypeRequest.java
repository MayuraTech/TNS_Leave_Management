package com.tns.leavemgmt.leave.dto;

import jakarta.validation.constraints.Min;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateLeaveTypeRequest {

    private String name;
    private String description;
    
    @Min(0)
    private Double accrualRate;
    
    @Min(0)
    private Integer maxCarryOverDays;
    
    @Min(0)
    private Integer minNoticeDays;
    
    private Boolean isActive;
}
