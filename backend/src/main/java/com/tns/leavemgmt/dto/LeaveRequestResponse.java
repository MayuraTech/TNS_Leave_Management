package com.tns.leavemgmt.dto;

import com.tns.leavemgmt.entity.enums.LeaveDurationType;
import com.tns.leavemgmt.entity.enums.LeaveRequestStatus;
import com.tns.leavemgmt.entity.enums.SessionType;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter
@Setter
public class LeaveRequestResponse {

    private Long id;
    private Long employeeId;
    private String employeeName;
    private Long leaveTypeId;
    private String leaveTypeName;
    private LocalDate startDate;
    private LocalDate endDate;
    private LeaveDurationType durationType;
    private SessionType sessionType;
    private BigDecimal durationInHours;
    private BigDecimal totalDays;
    private String reason;
    private LeaveRequestStatus status;
    private Long assignedManagerId;
    private String assignedManagerName;
    private LocalDateTime submittedAt;
    private LocalDateTime processedAt;
    private Long approvedById;
    private String approvalComments;
}
