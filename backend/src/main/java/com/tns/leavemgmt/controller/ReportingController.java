package com.tns.leavemgmt.controller;

import com.tns.leavemgmt.dto.LeaveBalanceReportItem;
import com.tns.leavemgmt.dto.LeaveTrendItem;
import com.tns.leavemgmt.dto.LeaveUsageReportItem;
import com.tns.leavemgmt.dto.PendingRequestReportItem;
import com.tns.leavemgmt.service.LeaveReportService;
import com.tns.leavemgmt.service.ReportExportService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.io.IOException;
import java.time.LocalDate;
import java.util.List;

/**
 * REST controller exposing admin reporting endpoints.
 * Requirements: 13.1, 13.2, 13.3, 13.4, 13.5
 */
@RestController
@RequestMapping("/api/admin/reports")
@PreAuthorize("hasRole('ADMINISTRATOR')")
public class ReportingController {

    private final LeaveReportService leaveReportService;
    private final ReportExportService reportExportService;

    public ReportingController(LeaveReportService leaveReportService,
                               ReportExportService reportExportService) {
        this.leaveReportService = leaveReportService;
        this.reportExportService = reportExportService;
    }

    /**
     * GET /api/admin/reports/leave-usage
     * Returns leave usage grouped by leave type for the given date range.
     * Requirement 13.1
     */
    @GetMapping("/leave-usage")
    public ResponseEntity<List<LeaveUsageReportItem>> getLeaveUsage(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(required = false) Long departmentId,
            @RequestParam(required = false) Long leaveTypeId) {

        List<LeaveUsageReportItem> data =
                leaveReportService.getLeaveUsageByType(startDate, endDate, departmentId, leaveTypeId);
        return ResponseEntity.ok(data);
    }

    /**
     * GET /api/admin/reports/leave-balances
     * Returns leave balances for all employees, optionally filtered by department.
     * Requirement 13.2
     */
    @GetMapping("/leave-balances")
    public ResponseEntity<List<LeaveBalanceReportItem>> getLeaveBalances(
            @RequestParam(required = false) Long departmentId) {

        List<LeaveBalanceReportItem> data =
                leaveReportService.getLeaveBalancesByDepartment(departmentId);
        return ResponseEntity.ok(data);
    }

    /**
     * GET /api/admin/reports/pending-requests
     * Returns all pending leave requests across the organization.
     * Requirement 13.3
     */
    @GetMapping("/pending-requests")
    public ResponseEntity<List<PendingRequestReportItem>> getPendingRequests() {
        List<PendingRequestReportItem> data = leaveReportService.getPendingRequests();
        return ResponseEntity.ok(data);
    }

    /**
     * GET /api/admin/reports/leave-trends
     * Returns leave trends grouped by department or team.
     * Requirement 13.5
     */
    @GetMapping("/leave-trends")
    public ResponseEntity<List<LeaveTrendItem>> getLeaveTrends(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(defaultValue = "DEPARTMENT") String groupBy) {

        List<LeaveTrendItem> data =
                leaveReportService.getLeaveTrends(startDate, endDate, groupBy);
        return ResponseEntity.ok(data);
    }

    /**
     * GET /api/admin/reports/export
     * Exports a report as a downloadable CSV file.
     * Supported reportType values: leave-usage, leave-balances, pending-requests, leave-trends
     * Requirement 13.4
     */
    @GetMapping("/export")
    public ResponseEntity<byte[]> exportReport(
            @RequestParam String reportType,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(required = false) Long departmentId,
            @RequestParam(required = false) Long leaveTypeId,
            @RequestParam(defaultValue = "DEPARTMENT") String groupBy) throws IOException {

        String csvContent;
        String filename;

        switch (reportType.toLowerCase()) {
            case "leave-usage": {
                LocalDate from = startDate != null ? startDate : LocalDate.now().withDayOfYear(1);
                LocalDate to = endDate != null ? endDate : LocalDate.now();
                List<LeaveUsageReportItem> data =
                        leaveReportService.getLeaveUsageByType(from, to, departmentId, leaveTypeId);
                csvContent = reportExportService.exportLeaveUsageToCsv(data);
                filename = "leave-usage-report.csv";
                break;
            }
            case "leave-balances": {
                List<LeaveBalanceReportItem> data =
                        leaveReportService.getLeaveBalancesByDepartment(departmentId);
                csvContent = reportExportService.exportLeaveBalancesToCsv(data);
                filename = "leave-balances-report.csv";
                break;
            }
            case "pending-requests": {
                List<PendingRequestReportItem> data = leaveReportService.getPendingRequests();
                csvContent = reportExportService.exportPendingRequestsToCsv(data);
                filename = "pending-requests-report.csv";
                break;
            }
            case "leave-trends": {
                LocalDate from = startDate != null ? startDate : LocalDate.now().withDayOfYear(1);
                LocalDate to = endDate != null ? endDate : LocalDate.now();
                List<LeaveTrendItem> data =
                        leaveReportService.getLeaveTrends(from, to, groupBy);
                csvContent = reportExportService.exportLeaveTrendsToCsv(data);
                filename = "leave-trends-report.csv";
                break;
            }
            default:
                return ResponseEntity.badRequest().build();
        }

        byte[] csvBytes = csvContent.getBytes(java.nio.charset.StandardCharsets.UTF_8);

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                .contentType(MediaType.parseMediaType("text/csv"))
                .contentLength(csvBytes.length)
                .body(csvBytes);
    }
}
