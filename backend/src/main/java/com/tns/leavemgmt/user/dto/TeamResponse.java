package com.tns.leavemgmt.user.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TeamResponse {

    private Long id;
    private String name;
    private Long departmentId;
    private String departmentName;
    private Long managerId;
    private String managerName;
    private LocalDateTime createdAt;
}
