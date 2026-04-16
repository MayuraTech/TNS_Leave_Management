package com.tns.leavemgmt.leave.service;

import com.tns.leavemgmt.entity.LeaveAccrualTransaction;
import com.tns.leavemgmt.entity.LeaveBalance;
import com.tns.leavemgmt.entity.LeavePolicy;
import com.tns.leavemgmt.entity.LeaveType;
import com.tns.leavemgmt.leave.repository.LeaveAccrualTransactionRepository;
import com.tns.leavemgmt.leave.repository.LeaveBalanceRepository;
import com.tns.leavemgmt.leave.repository.LeavePolicyRepository;
import com.tns.leavemgmt.leave.repository.LeaveTypeRepository;
import com.tns.leavemgmt.entity.Role;
import com.tns.leavemgmt.entity.User;
import com.tns.leavemgmt.user.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.*;

/**
 * Unit tests for AccrualService.
 * Validates Requirements: 15.2 (accrued leave added to balance),
 *                         15.3 (balance capped at max carry-over),
 *                         15.4 (accrual transactions recorded with timestamp)
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class AccrualServiceTest {

    @Mock private UserRepository userRepository;
    @Mock private LeaveTypeRepository leaveTypeRepository;
    @Mock private LeavePolicyRepository leavePolicyRepository;
    @Mock private LeaveBalanceRepository leaveBalanceRepository;
    @Mock private LeaveAccrualTransactionRepository leaveAccrualTransactionRepository;

    @InjectMocks
    private AccrualService accrualService;

    private User employee;
    private LeaveType annualLeave;
    private LeavePolicy policy;

    @BeforeEach
    void setUp() {
        Role employeeRole = Role.builder().id(1L).name("EMPLOYEE").build();

        employee = User.builder()
                .id(1L)
                .username("jdoe")
                .email("jdoe@example.com")
                .passwordHash("hash")
                .isActive(true)
                .roles(Set.of(employeeRole))
                .build();

        annualLeave = LeaveType.builder()
                .id(10L)
                .name("Annual Leave")
                .isActive(true)
                .build();

        policy = LeavePolicy.builder()
                .id(100L)
                .leaveType(annualLeave)
                .accrualRate(new BigDecimal("1.75"))
                .maxCarryOverDays(30)
                .minNoticeDays(1)
                .effectiveFrom(LocalDate.of(2024, 1, 1))
                .build();

        // Common stubs
        when(userRepository.findAll()).thenReturn(List.of(employee));
        when(leaveTypeRepository.findByIsActiveTrue()).thenReturn(List.of(annualLeave));
        when(leavePolicyRepository.findActivePolicy(eq(annualLeave.getId()), any(LocalDate.class)))
                .thenReturn(Optional.of(policy));
        when(leaveBalanceRepository.save(any(LeaveBalance.class)))
                .thenAnswer(inv -> inv.getArgument(0));
        when(leaveAccrualTransactionRepository.save(any(LeaveAccrualTransaction.class)))
                .thenAnswer(inv -> inv.getArgument(0));
    }

    // ── Requirement 15.2: Accrued leave added to balance ─────────────────────

    @Nested
    @DisplayName("Accrual adds correct amount to balance (Req 15.2)")
    class AccrualAddsCorrectAmount {

        @Test
        @DisplayName("Should add accrual rate to an existing balance")
        void processAccrual_existingBalance_addsAccrualRate() {
            LeaveBalance existing = LeaveBalance.builder()
                    .id(1L)
                    .user(employee)
                    .leaveType(annualLeave)
                    .year(2024)
                    .availableDays(new BigDecimal("5.00"))
                    .accruedDays(new BigDecimal("5.00"))
                    .usedDays(BigDecimal.ZERO)
                    .build();

            when(leaveBalanceRepository.findByUserIdAndLeaveTypeIdAndYear(
                    eq(employee.getId()), eq(annualLeave.getId()), anyInt()))
                    .thenReturn(Optional.of(existing));

            accrualService.processAccrual();

            ArgumentCaptor<LeaveBalance> captor = ArgumentCaptor.forClass(LeaveBalance.class);
            verify(leaveBalanceRepository).save(captor.capture());

            LeaveBalance saved = captor.getValue();
            // 5.00 + 1.75 = 6.75
            assertThat(saved.getAvailableDays()).isEqualByComparingTo(new BigDecimal("6.75"));
            assertThat(saved.getAccruedDays()).isEqualByComparingTo(new BigDecimal("6.75"));
        }

        @Test
        @DisplayName("Should create a new balance record when none exists and add accrual rate")
        void processAccrual_noExistingBalance_createsAndAddsAccrualRate() {
            when(leaveBalanceRepository.findByUserIdAndLeaveTypeIdAndYear(
                    anyLong(), anyLong(), anyInt()))
                    .thenReturn(Optional.empty());

            accrualService.processAccrual();

            ArgumentCaptor<LeaveBalance> captor = ArgumentCaptor.forClass(LeaveBalance.class);
            verify(leaveBalanceRepository).save(captor.capture());

            LeaveBalance saved = captor.getValue();
            assertThat(saved.getAvailableDays()).isEqualByComparingTo(new BigDecimal("1.75"));
            assertThat(saved.getAccruedDays()).isEqualByComparingTo(new BigDecimal("1.75"));
            assertThat(saved.getUser()).isEqualTo(employee);
            assertThat(saved.getLeaveType()).isEqualTo(annualLeave);
        }

        @Test
        @DisplayName("Should return the count of processed accrual records")
        void processAccrual_returnsProcessedCount() {
            when(leaveBalanceRepository.findByUserIdAndLeaveTypeIdAndYear(
                    anyLong(), anyLong(), anyInt()))
                    .thenReturn(Optional.empty());

            int count = accrualService.processAccrual();

            assertThat(count).isEqualTo(1); // 1 employee × 1 leave type
        }

        @Test
        @DisplayName("Should skip leave types with no active policy")
        void processAccrual_noActivePolicy_skipsLeaveType() {
            when(leavePolicyRepository.findActivePolicy(eq(annualLeave.getId()), any(LocalDate.class)))
                    .thenReturn(Optional.empty());

            int count = accrualService.processAccrual();

            assertThat(count).isZero();
            verify(leaveBalanceRepository, never()).save(any());
        }

        @Test
        @DisplayName("Should skip inactive users")
        void processAccrual_inactiveUser_isSkipped() {
            User inactive = User.builder()
                    .id(2L)
                    .username("inactive")
                    .email("inactive@example.com")
                    .passwordHash("hash")
                    .isActive(false)
                    .roles(Set.of(Role.builder().id(1L).name("EMPLOYEE").build()))
                    .build();

            when(userRepository.findAll()).thenReturn(List.of(inactive));

            int count = accrualService.processAccrual();

            assertThat(count).isZero();
            verify(leaveBalanceRepository, never()).save(any());
        }

        @Test
        @DisplayName("Should skip users without EMPLOYEE role")
        void processAccrual_nonEmployeeUser_isSkipped() {
            User manager = User.builder()
                    .id(3L)
                    .username("manager")
                    .email("manager@example.com")
                    .passwordHash("hash")
                    .isActive(true)
                    .roles(Set.of(Role.builder().id(2L).name("MANAGER").build()))
                    .build();

            when(userRepository.findAll()).thenReturn(List.of(manager));

            int count = accrualService.processAccrual();

            assertThat(count).isZero();
            verify(leaveBalanceRepository, never()).save(any());
        }
    }

    // ── Requirement 15.3: Balance capped at max carry-over ───────────────────

    @Nested
    @DisplayName("Balance capped at max carry-over limit (Req 15.3)")
    class BalanceCappedAtMaxCarryOver {

        @Test
        @DisplayName("Should cap availableDays at maxCarryOverDays when accrual would exceed it")
        void processAccrual_balanceExceedsMax_capsAtMax() {
            // Current balance is 29.50, accrual rate 1.75 → would be 31.25, max is 30
            LeaveBalance nearMax = LeaveBalance.builder()
                    .id(1L)
                    .user(employee)
                    .leaveType(annualLeave)
                    .year(2024)
                    .availableDays(new BigDecimal("29.50"))
                    .accruedDays(new BigDecimal("29.50"))
                    .usedDays(BigDecimal.ZERO)
                    .build();

            when(leaveBalanceRepository.findByUserIdAndLeaveTypeIdAndYear(
                    anyLong(), anyLong(), anyInt()))
                    .thenReturn(Optional.of(nearMax));

            accrualService.processAccrual();

            ArgumentCaptor<LeaveBalance> captor = ArgumentCaptor.forClass(LeaveBalance.class);
            verify(leaveBalanceRepository).save(captor.capture());

            assertThat(captor.getValue().getAvailableDays())
                    .isEqualByComparingTo(new BigDecimal("30"));
        }

        @Test
        @DisplayName("Should not cap availableDays when accrual stays within max carry-over")
        void processAccrual_balanceBelowMax_doesNotCap() {
            LeaveBalance belowMax = LeaveBalance.builder()
                    .id(1L)
                    .user(employee)
                    .leaveType(annualLeave)
                    .year(2024)
                    .availableDays(new BigDecimal("10.00"))
                    .accruedDays(new BigDecimal("10.00"))
                    .usedDays(BigDecimal.ZERO)
                    .build();

            when(leaveBalanceRepository.findByUserIdAndLeaveTypeIdAndYear(
                    anyLong(), anyLong(), anyInt()))
                    .thenReturn(Optional.of(belowMax));

            accrualService.processAccrual();

            ArgumentCaptor<LeaveBalance> captor = ArgumentCaptor.forClass(LeaveBalance.class);
            verify(leaveBalanceRepository).save(captor.capture());

            // 10.00 + 1.75 = 11.75, well below max of 30
            assertThat(captor.getValue().getAvailableDays())
                    .isEqualByComparingTo(new BigDecimal("11.75"));
        }

        @Test
        @DisplayName("Should cap when balance is exactly at max carry-over after accrual")
        void processAccrual_balanceExactlyAtMax_capsCorrectly() {
            // 28.25 + 1.75 = 30.00 exactly — no cap needed
            LeaveBalance atBoundary = LeaveBalance.builder()
                    .id(1L)
                    .user(employee)
                    .leaveType(annualLeave)
                    .year(2024)
                    .availableDays(new BigDecimal("28.25"))
                    .accruedDays(new BigDecimal("28.25"))
                    .usedDays(BigDecimal.ZERO)
                    .build();

            when(leaveBalanceRepository.findByUserIdAndLeaveTypeIdAndYear(
                    anyLong(), anyLong(), anyInt()))
                    .thenReturn(Optional.of(atBoundary));

            accrualService.processAccrual();

            ArgumentCaptor<LeaveBalance> captor = ArgumentCaptor.forClass(LeaveBalance.class);
            verify(leaveBalanceRepository).save(captor.capture());

            assertThat(captor.getValue().getAvailableDays())
                    .isEqualByComparingTo(new BigDecimal("30.00"));
        }
    }

    // ── Requirement 15.4: Accrual transaction recorded with timestamp ─────────

    @Nested
    @DisplayName("Accrual transaction recorded with timestamp (Req 15.4)")
    class AccrualTransactionRecorded {

        @Test
        @DisplayName("Should save a LeaveAccrualTransaction for each processed accrual")
        void processAccrual_savesAccrualTransaction() {
            when(leaveBalanceRepository.findByUserIdAndLeaveTypeIdAndYear(
                    anyLong(), anyLong(), anyInt()))
                    .thenReturn(Optional.empty());

            accrualService.processAccrual();

            verify(leaveAccrualTransactionRepository, times(1))
                    .save(any(LeaveAccrualTransaction.class));
        }

        @Test
        @DisplayName("Should record transaction with correct user, leave type, amount and type")
        void processAccrual_transactionHasCorrectFields() {
            when(leaveBalanceRepository.findByUserIdAndLeaveTypeIdAndYear(
                    anyLong(), anyLong(), anyInt()))
                    .thenReturn(Optional.empty());

            accrualService.processAccrual();

            ArgumentCaptor<LeaveAccrualTransaction> captor =
                    ArgumentCaptor.forClass(LeaveAccrualTransaction.class);
            verify(leaveAccrualTransactionRepository).save(captor.capture());

            LeaveAccrualTransaction tx = captor.getValue();
            assertThat(tx.getUser()).isEqualTo(employee);
            assertThat(tx.getLeaveType()).isEqualTo(annualLeave);
            assertThat(tx.getAmount()).isEqualByComparingTo(new BigDecimal("1.75"));
            assertThat(tx.getTransactionType()).isEqualTo("ACCRUAL");
            assertThat(tx.getReason()).isNotBlank();
        }

        @Test
        @DisplayName("Should record one transaction per employee per leave type")
        void processAccrual_multipleEmployees_recordsTransactionForEach() {
            Role employeeRole = Role.builder().id(1L).name("EMPLOYEE").build();
            User employee2 = User.builder()
                    .id(2L)
                    .username("jsmith")
                    .email("jsmith@example.com")
                    .passwordHash("hash")
                    .isActive(true)
                    .roles(Set.of(employeeRole))
                    .build();

            when(userRepository.findAll()).thenReturn(List.of(employee, employee2));
            when(leaveBalanceRepository.findByUserIdAndLeaveTypeIdAndYear(
                    anyLong(), anyLong(), anyInt()))
                    .thenReturn(Optional.empty());

            int count = accrualService.processAccrual();

            assertThat(count).isEqualTo(2);
            verify(leaveAccrualTransactionRepository, times(2))
                    .save(any(LeaveAccrualTransaction.class));
        }

        @Test
        @DisplayName("Should not save a transaction when no active policy exists")
        void processAccrual_noPolicy_noTransactionSaved() {
            when(leavePolicyRepository.findActivePolicy(anyLong(), any(LocalDate.class)))
                    .thenReturn(Optional.empty());

            accrualService.processAccrual();

            verify(leaveAccrualTransactionRepository, never())
                    .save(any(LeaveAccrualTransaction.class));
        }
    }
}
