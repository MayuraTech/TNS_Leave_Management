package com.tns.leavemgmt.leave.service;

import com.tns.leavemgmt.entity.LeaveAccrualTransaction;
import com.tns.leavemgmt.entity.LeaveBalance;
import com.tns.leavemgmt.entity.LeavePolicy;
import com.tns.leavemgmt.entity.LeaveType;
import com.tns.leavemgmt.leave.repository.LeaveAccrualTransactionRepository;
import com.tns.leavemgmt.leave.repository.LeaveBalanceRepository;
import com.tns.leavemgmt.leave.repository.LeavePolicyRepository;
import com.tns.leavemgmt.leave.repository.LeaveTypeRepository;
import com.tns.leavemgmt.entity.User;
import com.tns.leavemgmt.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.Year;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class AccrualService {

    private static final String ROLE_EMPLOYEE = "EMPLOYEE";
    private static final String TRANSACTION_TYPE_ACCRUAL = "ACCRUAL";

    private final UserRepository userRepository;
    private final LeaveTypeRepository leaveTypeRepository;
    private final LeavePolicyRepository leavePolicyRepository;
    private final LeaveBalanceRepository leaveBalanceRepository;
    private final LeaveAccrualTransactionRepository leaveAccrualTransactionRepository;

    /**
     * Processes monthly leave accrual for all active employees.
     * For each active employee with the EMPLOYEE role, accrues leave for every
     * active leave type that has an active policy. Caps the balance at the
     * policy's maxCarryOverDays and records a LeaveAccrualTransaction.
     *
     * Satisfies requirements 15.1, 15.2, 15.3, 15.4
     */
    @Transactional
    public int processAccrual() {
        log.info("Starting leave accrual processing");

        // Req 15.1: fetch all active users with EMPLOYEE role
        List<User> activeEmployees = userRepository.findAll().stream()
                .filter(u -> Boolean.TRUE.equals(u.getIsActive()))
                .filter(u -> u.getRoles().stream()
                        .anyMatch(r -> ROLE_EMPLOYEE.equalsIgnoreCase(r.getName())))
                .toList();

        List<LeaveType> activeLeaveTypes = leaveTypeRepository.findByIsActiveTrue();
        LocalDate today = LocalDate.now();
        int currentYear = Year.now().getValue();
        int processedCount = 0;

        for (User employee : activeEmployees) {
            for (LeaveType leaveType : activeLeaveTypes) {
                // Find the active policy for this leave type
                LeavePolicy policy = leavePolicyRepository
                        .findActivePolicy(leaveType.getId(), today)
                        .orElse(null);

                if (policy == null) {
                    log.debug("No active policy for leaveType={}, skipping", leaveType.getName());
                    continue;
                }

                BigDecimal accrualRate = policy.getAccrualRate();
                BigDecimal maxCarryOver = BigDecimal.valueOf(policy.getMaxCarryOverDays());

                // Req 15.2: find or create the balance record and add accrued amount
                LeaveBalance balance = leaveBalanceRepository
                        .findByUserIdAndLeaveTypeIdAndYear(employee.getId(), leaveType.getId(), currentYear)
                        .orElseGet(() -> LeaveBalance.builder()
                                .user(employee)
                                .leaveType(leaveType)
                                .year(currentYear)
                                .availableDays(BigDecimal.ZERO)
                                .accruedDays(BigDecimal.ZERO)
                                .usedDays(BigDecimal.ZERO)
                                .build());

                BigDecimal newAvailable = balance.getAvailableDays().add(accrualRate);
                BigDecimal newAccrued = balance.getAccruedDays().add(accrualRate);

                // Req 15.3: cap at maxCarryOverDays if exceeded
                if (newAvailable.compareTo(maxCarryOver) > 0) {
                    log.debug("Capping balance for user={} leaveType={}: {} -> {}",
                            employee.getUsername(), leaveType.getName(), newAvailable, maxCarryOver);
                    newAvailable = maxCarryOver;
                }

                balance.setAvailableDays(newAvailable);
                balance.setAccruedDays(newAccrued);
                leaveBalanceRepository.save(balance);

                // Req 15.4: record the accrual transaction with timestamp
                LeaveAccrualTransaction transaction = LeaveAccrualTransaction.builder()
                        .user(employee)
                        .leaveType(leaveType)
                        .amount(accrualRate)
                        .transactionType(TRANSACTION_TYPE_ACCRUAL)
                        .reason("Monthly accrual for " + today.getMonth() + " " + currentYear)
                        .build();
                leaveAccrualTransactionRepository.save(transaction);

                processedCount++;
                log.debug("Accrued {} days for user={} leaveType={}",
                        accrualRate, employee.getUsername(), leaveType.getName());
            }
        }

        log.info("Leave accrual processing complete: {} accrual records created for {} employees",
                processedCount, activeEmployees.size());
        return processedCount;
    }
}
