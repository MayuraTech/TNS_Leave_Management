package com.tns.leavemgmt.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TeamCapacityResponse {
    private int totalEmployees;
    private int onLeaveToday;
    private int available;
    private int capacityPercent;
}
