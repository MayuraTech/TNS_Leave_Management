package com.tns.leavemgmt.leave.controller;

import com.tns.leavemgmt.dto.LeaveBalanceResponse;
import com.tns.leavemgmt.entity.User;
import com.tns.leavemgmt.exception.ResourceNotFoundException;
import com.tns.leavemgmt.leave.dto.AdjustBalanceRequest;
import com.tns.leavemgmt.leave.dto.AdjustBalanceResponse;
import com.tns.leavemgmt.leave.service.AccrualService;
import com.tns.leavemgmt.leave.service.BalanceAdjustmentService;
import com.tns.leavemgmt.service.LeaveBalanceService;
import com.tns.leavemgmt.user.repository.UserRepository;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
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
    private final LeaveBalanceService leaveBalanceService;
    private final UserRepository userRepository;

    /**
     * GET /api/admin/users/{userId}/leave-balance
     * Get leave balances for a specific user (Admin only).
     */
    @GetMapping("/api/admin/users/{userId}/leave-balance")
    @PreAuthorize("hasRole('ADMINISTRATOR')")
    public ResponseEntity<List<LeaveBalanceResponse>> getUserBalances(@PathVariable Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));
        List<LeaveBalanceResponse> balances = leaveBalanceService.getBalancesForUser(user);
        return ResponseEntity.ok(balances);
    }

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

    /**
     * POST /api/admin/users/{userId}/initialize-balances
     * Initializes leave balances for a user based on monthly accrual rates.
     * This is useful for users who don't have any leave balances yet.
     */
    @PostMapping("/api/admin/users/{userId}/initialize-balances")
    @PreAuthorize("hasRole('ADMINISTRATOR')")
    public ResponseEntity<Map<String, Object>> initializeUserBalances(@PathVariable Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));
        
        leaveBalanceService.initializeBalancesForNewUser(user);
        
        // Return the newly created balances
        List<LeaveBalanceResponse> balances = leaveBalanceService.getBalancesForUser(user);
        return ResponseEntity.ok(Map.of(
            "message", "Leave balances initialized successfully",
            "balances", balances
        ));
    }
}
