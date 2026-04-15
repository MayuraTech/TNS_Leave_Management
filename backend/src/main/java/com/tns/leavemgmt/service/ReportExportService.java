package com.tns.leavemgmt.service;

import com.tns.leavemgmt.dto.LeaveBalanceReportItem;
import com.tns.leavemgmt.dto.LeaveTrendItem;
import com.tns.leavemgmt.dto.LeaveUsageReportItem;
import com.tns.leavemgmt.dto.PendingRequestReportItem;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.io.StringWriter;
import java.util.List;

/**
 * Service for serializing report data to CSV format.
 * Requirements: 13.4
 */
@Service
public class ReportExportService {

    // -------------------------------------------------------------------------
    // Leave Usage CSV
    // -------------------------------------------------------------------------

    /**
     * Serializes leave-usage report items to CSV.
     * Columns: Leave Type, Total Requests, Total Days
     */
    public String exportLeaveUsageToCsv(List<LeaveUsageReportItem> items) throws IOException {
        StringWriter sw = new StringWriter();
        sw.write("Leave Type,Total Requests,Total Days\n");
        for (LeaveUsageReportItem item : items) {
            sw.write(escapeCsv(item.getLeaveTypeName()));
            sw.write(",");
            sw.write(String.valueOf(item.getTotalRequests()));
            sw.write(",");
            sw.write(item.getTotalDays() != null ? item.getTotalDays().toPlainString() : "0");
            sw.write("\n");
        }
        return sw.toString();
    }

    // -------------------------------------------------------------------------
    // Leave Balances CSV
    // -------------------------------------------------------------------------

    /**
     * Serializes leave-balance report items to CSV.
     * Columns: Employee ID, Employee Name, Department, Leave Type, Available Days, Used Days, Accrued Days
     */
    public String exportLeaveBalancesToCsv(List<LeaveBalanceReportItem> items) throws IOException {
        StringWriter sw = new StringWriter();
        sw.write("Employee ID,Employee Name,Department,Leave Type,Available Days,Used Days,Accrued Days\n");
        for (LeaveBalanceReportItem item : items) {
            sw.write(String.valueOf(item.getEmployeeId()));
            sw.write(",");
            sw.write(escapeCsv(item.getEmployeeName()));
            sw.write(",");
            sw.write(escapeCsv(item.getDepartment()));
            sw.write(",");
            sw.write(escapeCsv(item.getLeaveTypeName()));
            sw.write(",");
            sw.write(item.getAvailableDays() != null ? item.getAvailableDays().toPlainString() : "0");
            sw.write(",");
            sw.write(item.getUsedDays() != null ? item.getUsedDays().toPlainString() : "0");
            sw.write(",");
            sw.write(item.getAccruedDays() != null ? item.getAccruedDays().toPlainString() : "0");
            sw.write("\n");
        }
        return sw.toString();
    }

    // -------------------------------------------------------------------------
    // Pending Requests CSV
    // -------------------------------------------------------------------------

    /**
     * Serializes pending-request report items to CSV.
     * Columns: Request ID, Employee Name, Department, Leave Type, Start Date, End Date, Total Days, Submitted At
     */
    public String exportPendingRequestsToCsv(List<PendingRequestReportItem> items) throws IOException {
        StringWriter sw = new StringWriter();
        sw.write("Request ID,Employee Name,Department,Leave Type,Start Date,End Date,Total Days,Submitted At\n");
        for (PendingRequestReportItem item : items) {
            sw.write(String.valueOf(item.getRequestId()));
            sw.write(",");
            sw.write(escapeCsv(item.getEmployeeName()));
            sw.write(",");
            sw.write(escapeCsv(item.getDepartment()));
            sw.write(",");
            sw.write(escapeCsv(item.getLeaveTypeName()));
            sw.write(",");
            sw.write(item.getStartDate() != null ? item.getStartDate().toString() : "");
            sw.write(",");
            sw.write(item.getEndDate() != null ? item.getEndDate().toString() : "");
            sw.write(",");
            sw.write(item.getTotalDays() != null ? item.getTotalDays().toPlainString() : "0");
            sw.write(",");
            sw.write(item.getSubmittedAt() != null ? item.getSubmittedAt().toString() : "");
            sw.write("\n");
        }
        return sw.toString();
    }

    // -------------------------------------------------------------------------
    // Leave Trends CSV
    // -------------------------------------------------------------------------

    /**
     * Serializes leave-trend items to CSV.
     * Columns: Group Name, Group Type, Total Requests, Total Days, Average Days Per Request
     */
    public String exportLeaveTrendsToCsv(List<LeaveTrendItem> items) throws IOException {
        StringWriter sw = new StringWriter();
        sw.write("Group Name,Group Type,Total Requests,Total Days,Average Days Per Request\n");
        for (LeaveTrendItem item : items) {
            sw.write(escapeCsv(item.getGroupName()));
            sw.write(",");
            sw.write(escapeCsv(item.getGroupType()));
            sw.write(",");
            sw.write(String.valueOf(item.getTotalRequests()));
            sw.write(",");
            sw.write(item.getTotalDays() != null ? item.getTotalDays().toPlainString() : "0");
            sw.write(",");
            sw.write(item.getAverageDaysPerRequest() != null
                    ? item.getAverageDaysPerRequest().toPlainString() : "0");
            sw.write("\n");
        }
        return sw.toString();
    }

    // -------------------------------------------------------------------------
    // Helper
    // -------------------------------------------------------------------------

    /**
     * Escapes a field value for CSV: wraps in double-quotes if it contains
     * a comma, double-quote, or newline, and doubles any embedded double-quotes.
     */
    private String escapeCsv(String value) {
        if (value == null) {
            return "";
        }
        if (value.contains(",") || value.contains("\"") || value.contains("\n")) {
            return "\"" + value.replace("\"", "\"\"") + "\"";
        }
        return value;
    }
}
