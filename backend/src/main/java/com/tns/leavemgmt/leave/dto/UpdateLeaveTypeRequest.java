package com.tns.leavemgmt.leave.dto;

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
    private Boolean isActive;
}
