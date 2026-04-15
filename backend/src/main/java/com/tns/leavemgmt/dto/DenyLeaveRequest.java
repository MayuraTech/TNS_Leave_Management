package com.tns.leavemgmt.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class DenyLeaveRequest {
    @NotBlank(message = "Denial reason is required")
    private String reason;
}
