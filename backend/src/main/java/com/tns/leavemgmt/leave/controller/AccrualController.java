package com.tns.leavemgmt.leave.controller;

import com.tns.leavemgmt.leave.dto.AdjustBalanceRequest;
import com.tns.leavemgmt.leave.dto.AdjustBalanceResponse;
import com.tns.leavemgmt.leave.service.AccrualService;
import com.tns.leavemgmt.leave.service.BalanceAdjustmentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

/**
 * REST controller for leave accrual and balance adjustment admin operations.
 * All endpoints require ADMINISTRATOR role (Requirement 15.5).
 */
@RestController
@RequiredArgsConstructor
public class AccrualController {

    private final BalanceAdjustmentService balanceAdjustmentService;
    private final AccrualService accrualService;

    /**
     * POST /api/admin/leave-balance/adjust
     * Manually adjusts a user's leave balance with a reason (Req 15.5).
     */
    @PostMapping("/api/admin/leave-balance/adjust")
    @PreAuthorize("hasRole('ADMINISTRATOR')")
    public ResponseEntity<Map<String, Object>> adjustBalance(
            @Valid @RequestBody AdjustBalanceRequest request) {
        AdjustBalanceResponse response = balanceAdjustmentService.adjustBalance(request);
        return ResponseEntity.ok(Map.of("newBalance", response.getNewBalance()));
    }

    /**
     * POST /api/admin/accrual/process
     * Manually triggers leave accrual processing for all active employees.
     */
    @PostMapping("/api/admin/accrual/process")
    @PreAuthorize("hasRole('ADMINISTRATOR')")
    public ResponseEntity<Map<String, Integer>> processAccrual() {
        int processedCount = accrualService.processAccrual();
        return ResponseEntity.ok(Map.of("processedCount", processedCount));
    }
}
