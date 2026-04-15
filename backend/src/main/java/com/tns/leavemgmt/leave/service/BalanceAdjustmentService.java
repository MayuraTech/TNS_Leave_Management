package com.tns.leavemgmt.leave.service;

import com.tns.leavemgmt.exception.ResourceNotFoundException;
import com.tns.leavemgmt.leave.dto.AdjustBalanceRequest;
import com.tns.leavemgmt.leave.dto.AdjustBalanceResponse;
import com.tns.leavemgmt.leave.entity.LeaveAccrualTransaction;
import com.tns.leavemgmt.leave.entity.LeaveBalance;
import com.tns.leavemgmt.leave.entity.LeaveType;
import com.tns.leavemgmt.leave.repository.LeaveAccrualTransactionRepository;
import com.tns.leavemgmt.leave.repository.LeaveBalanceRepository;
import com.tns.leavemgmt.leave.repository.LeaveTypeRepository;
import com.tns.leavemgmt.user.entity.User;
import com.tns.leavemgmt.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Year;

/**
 * Service for manual leave balance adjustments.
 * Satisfies requirement 15.5: Administrators can manually adjust Leave_Balance with a reason.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class BalanceAdjustmentService {

    private static final String TRANSACTION_TYPE_MANUAL_ADJUSTMENT = "MANUAL_ADJUSTMENT";

    private final UserRepository userRepository;
    private final LeaveTypeRepository leaveTypeRepository;
    private final LeaveBalanceRepository leaveBalanceRepository;
    private final LeaveAccrualTransactionRepository leaveAccrualTransactionRepository;

    /**
     * Manually adjusts a user's leave balance for a given leave type.
     * The amount can be positive (credit) or negative (deduction).
     * Records a LeaveAccrualTransaction with type MANUAL_ADJUSTMENT and the provided reason.
     *
     * @param request contains userId, leaveTypeId, amount, and reason
     * @return the new available balance after adjustment
     */
    @Transactional
    public AdjustBalanceResponse adjustBalance(AdjustBalanceRequest request) {
        User user = userRepository.findById(request.getUserId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + request.getUserId()));

        LeaveType leaveType = leaveTypeRepository.findById(request.getLeaveTypeId())
                .orElseThrow(() -> new ResourceNotFoundException("LeaveType not found: " + request.getLeaveTypeId()));

        int currentYear = Year.now().getValue();

        LeaveBalance balance = leaveBalanceRepository
                .findByUserIdAndLeaveTypeIdAndYear(user.getId(), leaveType.getId(), currentYear)
                .orElseGet(() -> LeaveBalance.builder()
                        .user(user)
                        .leaveType(leaveType)
                        .year(currentYear)
                        .availableDays(BigDecimal.ZERO)
                        .accruedDays(BigDecimal.ZERO)
                        .usedDays(BigDecimal.ZERO)
                        .build());

        BigDecimal newBalance = balance.getAvailableDays().add(request.getAmount());
        balance.setAvailableDays(newBalance);
        leaveBalanceRepository.save(balance);

        // Resolve the administrator performing the adjustment
        User performedBy = resolveCurrentUser();

        LeaveAccrualTransaction transaction = LeaveAccrualTransaction.builder()
                .user(user)
                .leaveType(leaveType)
                .amount(request.getAmount())
                .transactionType(TRANSACTION_TYPE_MANUAL_ADJUSTMENT)
                .reason(request.getReason())
                .createdBy(performedBy)
                .build();
        leaveAccrualTransactionRepository.save(transaction);

        log.info("Manual balance adjustment: user={} leaveType={} amount={} newBalance={} by={}",
                user.getUsername(), leaveType.getName(), request.getAmount(), newBalance,
                performedBy != null ? performedBy.getUsername() : "unknown");

        return new AdjustBalanceResponse(newBalance);
    }

    private User resolveCurrentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || auth.getName() == null) {
            return null;
        }
        return userRepository.findByUsername(auth.getName()).orElse(null);
    }
}
