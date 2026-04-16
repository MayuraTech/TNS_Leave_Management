package com.tns.leavemgmt.service;

import com.tns.leavemgmt.dto.LeaveBalanceResponse;
import com.tns.leavemgmt.entity.LeaveAccrualTransaction;
import com.tns.leavemgmt.entity.LeaveBalance;
import com.tns.leavemgmt.entity.LeaveType;
import com.tns.leavemgmt.entity.User;
import com.tns.leavemgmt.exception.InsufficientLeaveBalanceException;
import com.tns.leavemgmt.exception.ResourceNotFoundException;
import com.tns.leavemgmt.leave.repository.LeaveAccrualTransactionRepository;
import com.tns.leavemgmt.leave.repository.LeaveBalanceRepository;
import com.tns.leavemgmt.leave.repository.LeaveTypeRepository;
import com.tns.leavemgmt.user.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Service for managing leave balances.
 * Supports fractional days (BigDecimal) for half-day and hourly deductions.
 *
 * Requirements: 7.1, 7.5, 7.6, 9.1, 9.2, 9.3, 15.5
 */
@Service
@Transactional
public class LeaveBalanceService {

    private static final String MANUAL_ADJUSTMENT = "MANUAL_ADJUSTMENT";

    private final LeaveBalanceRepository leaveBalanceRepository;
    private final LeaveAccrualTransactionRepository accrualTransactionRepository;
    private final UserRepository userRepository;
    private final LeaveTypeRepository leaveTypeRepository;

    public LeaveBalanceService(LeaveBalanceRepository leaveBalanceRepository,
                               LeaveAccrualTransactionRepository accrualTransactionRepository,
                               UserRepository userRepository,
                               LeaveTypeRepository leaveTypeRepository) {
        this.leaveBalanceRepository = leaveBalanceRepository;
        this.accrualTransactionRepository = accrualTransactionRepository;
        this.userRepository = userRepository;
        this.leaveTypeRepository = leaveTypeRepository;
    }

    /**
     * Returns the available days balance for the given user and leave type (current year).
     * Requirement 9.1
     */
    @Transactional(readOnly = true)
    public BigDecimal getAvailableBalance(User user, LeaveType leaveType) {
        LeaveBalance balance = getOrCreateBalance(user, leaveType);
        return balance.getAvailableDays();
    }

    /**
     * Returns the available hours balance for the given user and leave type (current year).
     * Requirement 7.6
     */
    @Transactional(readOnly = true)
    public BigDecimal getAvailableHours(User user, LeaveType leaveType) {
        LeaveBalance balance = getOrCreateBalance(user, leaveType);
        BigDecimal hours = balance.getAvailableHours();
        return hours != null ? hours : BigDecimal.ZERO;
    }

    /**
     * Deducts the specified number of days from the balance.
     * Supports fractional values (e.g., 0.5 for half-day).
     * Throws InsufficientLeaveBalanceException if balance is insufficient.
     * Requirements: 7.1, 7.5, 9.2
     */
    public void deductBalance(User user, LeaveType leaveType, BigDecimal days) {
        LeaveBalance balance = getOrCreateBalance(user, leaveType);

        if (balance.getAvailableDays().compareTo(days) < 0) {
            throw new InsufficientLeaveBalanceException(
                String.format("Insufficient leave balance. Available: %s days, Requested: %s days",
                    balance.getAvailableDays(), days));
        }

        balance.setAvailableDays(balance.getAvailableDays().subtract(days));
        BigDecimal usedDays = balance.getUsedDays() != null ? balance.getUsedDays() : BigDecimal.ZERO;
        balance.setUsedDays(usedDays.add(days));
        leaveBalanceRepository.save(balance);
    }

    /**
     * Deducts the specified number of hours from the hourly balance.
     * Throws InsufficientLeaveBalanceException if hourly balance is insufficient.
     * Requirement 7.6
     */
    public void deductHours(User user, LeaveType leaveType, BigDecimal hours) {
        LeaveBalance balance = getOrCreateBalance(user, leaveType);

        BigDecimal availableHours = balance.getAvailableHours() != null
            ? balance.getAvailableHours() : BigDecimal.ZERO;

        if (availableHours.compareTo(hours) < 0) {
            throw new InsufficientLeaveBalanceException(
                String.format("Insufficient hourly leave balance. Available: %s hours, Requested: %s hours",
                    availableHours, hours));
        }

        balance.setAvailableHours(availableHours.subtract(hours));
        BigDecimal usedHours = balance.getUsedHours() != null ? balance.getUsedHours() : BigDecimal.ZERO;
        balance.setUsedHours(usedHours.add(hours));
        leaveBalanceRepository.save(balance);
    }

    /**
     * Restores the specified number of days to the balance (e.g., on cancellation).
     * Requirement 9.3
     */
    public void restoreBalance(User user, LeaveType leaveType, BigDecimal days) {
        LeaveBalance balance = getOrCreateBalance(user, leaveType);

        balance.setAvailableDays(balance.getAvailableDays().add(days));
        BigDecimal usedDays = balance.getUsedDays() != null ? balance.getUsedDays() : BigDecimal.ZERO;
        BigDecimal newUsed = usedDays.subtract(days);
        balance.setUsedDays(newUsed.compareTo(BigDecimal.ZERO) < 0 ? BigDecimal.ZERO : newUsed);
        leaveBalanceRepository.save(balance);
    }

    /**
     * Restores the specified number of hours to the hourly balance (e.g., on cancellation).
     * Requirement 9.3
     */
    public void restoreHours(User user, LeaveType leaveType, BigDecimal hours) {
        LeaveBalance balance = getOrCreateBalance(user, leaveType);

        BigDecimal availableHours = balance.getAvailableHours() != null
            ? balance.getAvailableHours() : BigDecimal.ZERO;
        balance.setAvailableHours(availableHours.add(hours));

        BigDecimal usedHours = balance.getUsedHours() != null ? balance.getUsedHours() : BigDecimal.ZERO;
        BigDecimal newUsed = usedHours.subtract(hours);
        balance.setUsedHours(newUsed.compareTo(BigDecimal.ZERO) < 0 ? BigDecimal.ZERO : newUsed);
        leaveBalanceRepository.save(balance);
    }

    /**
     * Admin manual adjustment of leave balance with a reason.
     * Records a LeaveAccrualTransaction of type MANUAL_ADJUSTMENT.
     * Requirement 15.5
     */
    public BigDecimal adjustBalance(Long userId, Long leaveTypeId, BigDecimal amount,
                                    String reason, User performedBy) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));

        LeaveType leaveType = leaveTypeRepository.findById(leaveTypeId)
            .orElseThrow(() -> new ResourceNotFoundException("Leave type not found with id: " + leaveTypeId));

        LeaveBalance balance = getOrCreateBalance(user, leaveType);
        balance.setAvailableDays(balance.getAvailableDays().add(amount));
        leaveBalanceRepository.save(balance);

        // Record the accrual transaction
        LeaveAccrualTransaction transaction = new LeaveAccrualTransaction();
        transaction.setUser(user);
        transaction.setLeaveType(leaveType);
        transaction.setAmount(amount);
        transaction.setTransactionType(MANUAL_ADJUSTMENT);
        transaction.setReason(reason);
        transaction.setCreatedBy(performedBy);
        accrualTransactionRepository.save(transaction);

        return balance.getAvailableDays();
    }

    /**
     * Returns all leave balances for the given user in the current year.
     * Requirement 9.1
     */
    @Transactional(readOnly = true)
    public List<LeaveBalanceResponse> getBalancesForUser(User user) {
        int currentYear = LocalDate.now().getYear();
        List<LeaveBalance> balances = leaveBalanceRepository.findByUserAndYear(user, currentYear);

        return balances.stream()
            .map(this::toResponse)
            .collect(Collectors.toList());
    }

    /**
     * Finds or initializes a LeaveBalance record for the current year.
     * New records are initialized with zero values.
     */
    public LeaveBalance getOrCreateBalance(User user, LeaveType leaveType) {
        int currentYear = LocalDate.now().getYear();
        return leaveBalanceRepository
            .findByUserAndLeaveTypeAndYear(user, leaveType, currentYear)
            .orElseGet(() -> createNewBalance(user, leaveType, currentYear));
    }

    private LeaveBalance createNewBalance(User user, LeaveType leaveType, int year) {
        LeaveBalance balance = new LeaveBalance();
        balance.setUser(user);
        balance.setLeaveType(leaveType);
        balance.setYear(year);
        balance.setAvailableDays(BigDecimal.ZERO);
        balance.setAccruedDays(BigDecimal.ZERO);
        balance.setUsedDays(BigDecimal.ZERO);
        balance.setAvailableHours(BigDecimal.ZERO);
        balance.setUsedHours(BigDecimal.ZERO);
        return leaveBalanceRepository.save(balance);
    }

    private LeaveBalanceResponse toResponse(LeaveBalance balance) {
        LeaveBalanceResponse response = new LeaveBalanceResponse();
        response.setLeaveTypeId(balance.getLeaveType().getId());
        response.setLeaveTypeName(balance.getLeaveType().getName());
        response.setAvailableDays(balance.getAvailableDays());
        response.setAccruedDays(balance.getAccruedDays());
        response.setUsedDays(balance.getUsedDays());
        response.setAvailableHours(balance.getAvailableHours());
        response.setUsedHours(balance.getUsedHours());
        // accrualRate is populated from LeavePolicy in a later task
        return response;
    }
}
