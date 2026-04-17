package com.tns.leavemgmt.leave.controller;

import com.tns.leavemgmt.leave.dto.CreateLeaveTypeRequest;
import com.tns.leavemgmt.leave.dto.LeaveTypeResponse;
import com.tns.leavemgmt.leave.dto.UpdateLeaveTypeRequest;
import com.tns.leavemgmt.leave.service.LeaveTypeService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * REST controller for leave type management.
 * Admin endpoints require ADMINISTRATOR role (Requirements 10.1).
 */
@RestController
public class LeavePolicyController {

    private final LeaveTypeService leaveTypeService;

    public LeavePolicyController(LeaveTypeService leaveTypeService) {
        this.leaveTypeService = leaveTypeService;
    }

    /** POST /api/admin/leave-types — Create a new leave type (Req 10.1) */
    @PostMapping("/api/admin/leave-types")
    @PreAuthorize("hasRole('ADMINISTRATOR')")
    public ResponseEntity<Map<String, LeaveTypeResponse>> createLeaveType(
            @Valid @RequestBody CreateLeaveTypeRequest request) {
        LeaveTypeResponse leaveType = leaveTypeService.createLeaveType(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of("leaveType", leaveType));
    }

    /** PUT /api/admin/leave-types/{id} — Update an existing leave type (Req 10.1) */
    @PutMapping("/api/admin/leave-types/{id}")
    @PreAuthorize("hasRole('ADMINISTRATOR')")
    public ResponseEntity<Map<String, LeaveTypeResponse>> updateLeaveType(
            @PathVariable Long id,
            @Valid @RequestBody UpdateLeaveTypeRequest request) {
        LeaveTypeResponse leaveType = leaveTypeService.updateLeaveType(id, request);
        return ResponseEntity.ok(Map.of("leaveType", leaveType));
    }

    /** DELETE /api/admin/leave-types/{id} — Delete (soft) a leave type (Req 10.1) */
    @DeleteMapping("/api/admin/leave-types/{id}")
    @PreAuthorize("hasRole('ADMINISTRATOR')")
    public ResponseEntity<Void> deleteLeaveType(@PathVariable Long id) {
        leaveTypeService.deleteLeaveType(id);
        return ResponseEntity.noContent().build();
    }

    /** PATCH /api/admin/leave-types/{id}/status — Toggle active/inactive status (Req 10.1) */
    @PatchMapping("/api/admin/leave-types/{id}/status")
    @PreAuthorize("hasRole('ADMINISTRATOR')")
    public ResponseEntity<Map<String, LeaveTypeResponse>> toggleStatus(
            @PathVariable Long id,
            @RequestBody Map<String, Boolean> body) {
        Boolean isActive = body.get("isActive");
        if (isActive == null) {
            return ResponseEntity.badRequest().build();
        }
        LeaveTypeResponse leaveType = leaveTypeService.setActiveStatus(id, isActive);
        return ResponseEntity.ok(Map.of("leaveType", leaveType));
    }

    /** GET /api/leave-types — List all active leave types (Req 10.1) */
    @GetMapping("/api/leave-types")
    public ResponseEntity<Map<String, List<LeaveTypeResponse>>> getLeaveTypes() {
        List<LeaveTypeResponse> leaveTypes = leaveTypeService.getAllLeaveTypes();
        return ResponseEntity.ok(Map.of("leaveTypes", leaveTypes));
    }
}
