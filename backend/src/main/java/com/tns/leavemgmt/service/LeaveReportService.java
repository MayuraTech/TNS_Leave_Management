package com.tns.leavemgmt.service;

import com.tns.leavemgmt.dto.LeaveBalanceReportItem;
import com.tns.leavemgmt.dto.LeaveTrendItem;
import com.tns.leavemgmt.dto.LeaveUsageReportItem;
import com.tns.leavemgmt.dto.PendingRequestReportItem;
import com.tns.leavemgmt.entity.LeaveBalance;
import com.tns.leavemgmt.entity.LeaveRequest;
import com.tns.leavemgmt.entity.enums.LeaveRequestStatus;
import com.tns.leavemgmt.entity.User;
import com.tns.leavemgmt.leave.repository.LeaveBalanceRepository;
import com.tns.leavemgmt.repository.LeaveRequestRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Service for generating leave reports and analytics.
 * Requirements: 13.1, 13.2, 13.3, 13.5
 */
@Service
@Transactional(readOnly = true)
public class LeaveReportService {

    private final LeaveRequestRepository leaveRequestRepository;
    private final LeaveBalanceRepository leaveBalanceRepository;

    public LeaveReportService(LeaveRequestRepository leaveRequestRepository,
                              LeaveBalanceRepository leaveBalanceRepository) {
        this.leaveRequestRepository = leaveRequestRepository;
        this.leaveBalanceRepository = leaveBalanceRepository;
    }

    /**
     * Returns leave usage grouped by leave type for approved requests within the date range.
     * Optionally filters by department and/or leave type.
     * Requirement 13.1
     */
    public List<LeaveUsageReportItem> getLeaveUsageByType(LocalDate startDate, LocalDate endDate,
                                                          Long departmentId, Long leaveTypeId) {
        List<LeaveRequest> requests = leaveRequestRepository
                .findApprovedByDateRangeAndFilters(startDate, endDate, departmentId, leaveTypeId);

        Map<String, List<LeaveRequest>> byType = requests.stream()
                .collect(Collectors.groupingBy(lr -> lr.getLeaveType().getName(),
                        LinkedHashMap::new, Collectors.toList()));

        List<LeaveUsageReportItem> result = new ArrayList<>();
        for (Map.Entry<String, List<LeaveRequest>> entry : byType.entrySet()) {
            BigDecimal totalDays = entry.getValue().stream()
                    .map(LeaveRequest::getTotalDays)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
            result.add(LeaveUsageReportItem.builder()
                    .leaveTypeName(entry.getKey())
                    .totalRequests((long) entry.getValue().size())
                    .totalDays(totalDays)
                    .build());
        }
        return result;
    }

    /**
     * Returns leave balances for all employees, optionally filtered by department.
     * Requirement 13.2
     */
    public List<LeaveBalanceReportItem> getLeaveBalancesByDepartment(Long departmentId) {
        int currentYear = LocalDate.now().getYear();
        List<LeaveBalance> balances = leaveBalanceRepository
                .findByYearAndDepartment(currentYear, departmentId);

        return balances.stream()
                .map(lb -> {
                    User user = lb.getUser();
                    String fullName = buildFullName(user);
                    String deptName = user.getDepartment() != null
                            ? user.getDepartment().getName() : null;
                    return LeaveBalanceReportItem.builder()
                            .employeeId(user.getId())
                            .employeeName(fullName)
                            .department(deptName)
                            .leaveTypeName(lb.getLeaveType().getName())
                            .availableDays(lb.getAvailableDays())
                            .usedDays(lb.getUsedDays() != null ? lb.getUsedDays() : BigDecimal.ZERO)
                            .accruedDays(lb.getAccruedDays() != null ? lb.getAccruedDays() : BigDecimal.ZERO)
                            .build();
                })
                .collect(Collectors.toList());
    }

    /**
     * Returns all pending leave requests across the organization.
     * Requirement 13.3
     */
    public List<PendingRequestReportItem> getPendingRequests() {
        List<LeaveRequest> pending = leaveRequestRepository.findByStatus(LeaveRequestStatus.PENDING);

        return pending.stream()
                .map(lr -> {
                    User employee = lr.getEmployee();
                    String deptName = employee.getDepartment() != null
                            ? employee.getDepartment().getName() : null;
                    return PendingRequestReportItem.builder()
                            .requestId(lr.getId())
                            .employeeName(buildFullName(employee))
                            .department(deptName)
                            .leaveTypeName(lr.getLeaveType().getName())
                            .startDate(lr.getStartDate())
                            .endDate(lr.getEndDate())
                            .totalDays(lr.getTotalDays())
                            .submittedAt(lr.getSubmittedAt())
                            .build();
                })
                .collect(Collectors.toList());
    }

    /**
     * Returns leave trends grouped by department or team for the given period.
     * Requirement 13.5
     *
     * @param groupBy "DEPARTMENT" or "TEAM"
     */
    public List<LeaveTrendItem> getLeaveTrends(LocalDate startDate, LocalDate endDate, String groupBy) {
        List<LeaveRequest> approved = leaveRequestRepository.findApprovedByDateRange(startDate, endDate);

        Map<String, List<LeaveRequest>> grouped;
        String resolvedGroupType;

        if ("TEAM".equalsIgnoreCase(groupBy)) {
            resolvedGroupType = "TEAM";
            grouped = approved.stream()
                    .filter(lr -> lr.getEmployee().getTeam() != null)
                    .collect(Collectors.groupingBy(
                            lr -> lr.getEmployee().getTeam().getName(),
                            LinkedHashMap::new, Collectors.toList()));
        } else {
            resolvedGroupType = "DEPARTMENT";
            grouped = approved.stream()
                    .filter(lr -> lr.getEmployee().getDepartment() != null)
                    .collect(Collectors.groupingBy(
                            lr -> lr.getEmployee().getDepartment().getName(),
                            LinkedHashMap::new, Collectors.toList()));
        }

        List<LeaveTrendItem> result = new ArrayList<>();
        for (Map.Entry<String, List<LeaveRequest>> entry : grouped.entrySet()) {
            List<LeaveRequest> group = entry.getValue();
            BigDecimal totalDays = group.stream()
                    .map(LeaveRequest::getTotalDays)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
            long count = group.size();
            BigDecimal average = count > 0
                    ? totalDays.divide(BigDecimal.valueOf(count), 2, RoundingMode.HALF_UP)
                    : BigDecimal.ZERO;
            result.add(LeaveTrendItem.builder()
                    .groupName(entry.getKey())
                    .groupType(resolvedGroupType)
                    .totalRequests(count)
                    .totalDays(totalDays)
                    .averageDaysPerRequest(average)
                    .build());
        }
        return result;
    }

    private String buildFullName(User user) {
        String first = user.getFirstName() != null ? user.getFirstName() : "";
        String last = user.getLastName() != null ? user.getLastName() : "";
        String full = (first + " " + last).trim();
        return full.isEmpty() ? user.getUsername() : full;
    }
}
