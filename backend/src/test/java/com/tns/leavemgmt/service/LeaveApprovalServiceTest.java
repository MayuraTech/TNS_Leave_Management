package com.tns.leavemgmt.service;

import com.tns.leavemgmt.entity.LeaveRequest;
import com.tns.leavemgmt.entity.LeaveType;
import com.tns.leavemgmt.entity.Role;
import com.tns.leavemgmt.entity.User;
import com.tns.leavemgmt.entity.enums.LeaveDurationType;
import com.tns.leavemgmt.entity.enums.LeaveRequestStatus;
import com.tns.leavemgmt.entity.enums.SessionType;
import com.tns.leavemgmt.repository.LeaveRequestRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.context.ApplicationEventPublisher;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Optional;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/**
 * Unit tests for LeaveApprovalService.
 * Requirements: 8.1, 8.2, 8.3
 */
@ExtendWith(MockitoExtension.class)
class LeaveApprovalServiceTest {

    @Mock
    private LeaveRequestRepository leaveRequestRepository;

    @Mock
    private LeaveBalanceService leaveBalanceService;

    @Mock
    private ApplicationEventPublisher eventPublisher;

    @InjectMocks
    private LeaveApprovalService leaveApprovalService;

    // -------------------------------------------------------------------------
    // Helpers
    // -------------------------------------------------------------------------

    private User buildUser(Long id) {
        User u = new User();
        u.setId(id);
        u.setUsername("user" + id);
        u.setEmail("user" + id + "@test.com");
        u.setPasswordHash("hash");
        u.setIsActive(true);
        return u;
    }

    private User buildAdminUser(Long id) {
        User u = buildUser(id);
        Role adminRole = new Role();
        adminRole.setId(1L);
        adminRole.setName("ADMINISTRATOR");
        u.setRoles(Set.of(adminRole));
        return u;
    }

    private LeaveType buildLeaveType(Long id) {
        LeaveType lt = new LeaveType();
        lt.setId(id);
        lt.setName("Annual Leave");
        lt.setActive(true);
        return lt;
    }

    private LeaveRequest buildPendingRequest(Long id, User employee, User assignedManager,
                                             LeaveDurationType durationType, BigDecimal totalDays) {
        LeaveRequest request = new LeaveRequest();
        request.setId(id);
        request.setEmployee(employee);
        request.setLeaveType(buildLeaveType(10L));
        request.setStartDate(LocalDate.now().plusDays(5));
        request.setEndDate(LocalDate.now().plusDays(6));
        request.setDurationType(durationType);
        request.setTotalDays(totalDays);
        request.setStatus(LeaveRequestStatus.PENDING);
        request.setReason("Test reason");
        request.setAssignedManager(assignedManager);
        return request;
    }

    // -------------------------------------------------------------------------
    // Tests
    // -------------------------------------------------------------------------

    /**
     * Validates: Requirements 7.5
     * Approving a HALF_DAY request deducts exactly 0.5 days from the balance.
     */
    @Test
    void approveRequest_halfDayLeave_deductsHalfDayFromBalance() {
        User employee = buildUser(1L);
        User manager = buildAdminUser(2L);
        LeaveType leaveType = buildLeaveType(10L);
        LocalDate date = LocalDate.now().plusDays(5);

        LeaveRequest request = new LeaveRequest();
        request.setId(55L);
        request.setEmployee(employee);
        request.setLeaveType(leaveType);
        request.setStartDate(date);
        request.setEndDate(date);
        request.setDurationType(LeaveDurationType.HALF_DAY);
        request.setSessionType(SessionType.MORNING);
        request.setTotalDays(new BigDecimal("0.5"));
        request.setStatus(LeaveRequestStatus.PENDING);
        request.setReason("Personal");
        request.setAssignedManager(manager);

        when(leaveRequestRepository.findById(55L)).thenReturn(Optional.of(request));
        when(leaveRequestRepository.save(any(LeaveRequest.class)))
                .thenAnswer(inv -> inv.getArgument(0));

        LeaveRequest result = leaveApprovalService.approveRequest(55L, manager, "Approved");

        assertThat(result.getStatus()).isEqualTo(LeaveRequestStatus.APPROVED);
        verify(leaveBalanceService).deductBalance(employee, leaveType, new BigDecimal("0.5"));
        verify(leaveBalanceService, never()).deductHours(any(), any(), any());
    }

    /**
     * Validates: Requirements 8.2
     * Approving a FULL_DAY request deducts the correct number of days and sets status to APPROVED.
     */
    @Test
    void approveRequest_fullDayLeave_deductsCorrectBalanceAndSetsApprovedStatus() {
        User employee = buildUser(1L);
        User manager = buildUser(2L);
        LeaveRequest request = buildPendingRequest(10L, employee, manager,
                LeaveDurationType.FULL_DAY, new BigDecimal("2"));

        when(leaveRequestRepository.findById(10L)).thenReturn(Optional.of(request));
        when(leaveRequestRepository.save(any(LeaveRequest.class)))
                .thenAnswer(inv -> inv.getArgument(0));

        LeaveRequest result = leaveApprovalService.approveRequest(10L, manager, "Looks good");

        assertThat(result.getStatus()).isEqualTo(LeaveRequestStatus.APPROVED);
        verify(leaveBalanceService).deductBalance(employee, request.getLeaveType(), new BigDecimal("2"));
        verify(leaveBalanceService, never()).deductHours(any(), any(), any());
    }

    /**
     * Validates: Requirements 8.2
     * Approving an HOURLY request deducts hours (not days) and sets status to APPROVED.
     */
    @Test
    void approveRequest_hourlyLeave_deductsHoursAndSetsApprovedStatus() {
        User employee = buildUser(1L);
        User manager = buildUser(2L);
        LeaveRequest request = buildPendingRequest(20L, employee, manager,
                LeaveDurationType.HOURLY, new BigDecimal("0.5"));
        request.setDurationInHours(new BigDecimal("4"));

        when(leaveRequestRepository.findById(20L)).thenReturn(Optional.of(request));
        when(leaveRequestRepository.save(any(LeaveRequest.class)))
                .thenAnswer(inv -> inv.getArgument(0));

        LeaveRequest result = leaveApprovalService.approveRequest(20L, manager, "Approved");

        assertThat(result.getStatus()).isEqualTo(LeaveRequestStatus.APPROVED);
        verify(leaveBalanceService).deductHours(employee, request.getLeaveType(), new BigDecimal("4"));
        verify(leaveBalanceService, never()).deductBalance(any(), any(), any());
    }

    /**
     * Validates: Requirements 8.3
     * Denying a request with a blank reason throws IllegalArgumentException.
     */
    @Test
    void denyRequest_withoutReason_throwsIllegalArgumentException() {
        User employee = buildUser(1L);
        User manager = buildUser(2L);
        LeaveRequest request = buildPendingRequest(30L, employee, manager,
                LeaveDurationType.FULL_DAY, new BigDecimal("1"));

        when(leaveRequestRepository.findById(30L)).thenReturn(Optional.of(request));

        assertThatThrownBy(() -> leaveApprovalService.denyRequest(30L, manager, ""))
                .isInstanceOf(IllegalArgumentException.class);

        verify(leaveRequestRepository, never()).save(any());
    }

    /**
     * Validates: Requirements 8.3
     * Denying a request with a null reason throws IllegalArgumentException.
     */
    @Test
    void denyRequest_withNullReason_throwsIllegalArgumentException() {
        User employee = buildUser(1L);
        User manager = buildUser(2L);
        LeaveRequest request = buildPendingRequest(31L, employee, manager,
                LeaveDurationType.FULL_DAY, new BigDecimal("1"));

        when(leaveRequestRepository.findById(31L)).thenReturn(Optional.of(request));

        assertThatThrownBy(() -> leaveApprovalService.denyRequest(31L, manager, null))
                .isInstanceOf(IllegalArgumentException.class);
    }

    /**
     * Validates: Requirements 8.1
     * A manager who is not the assigned manager and not an ADMINISTRATOR cannot approve.
     */
    @Test
    void approveRequest_byUnauthorizedManager_throwsIllegalStateException() {
        User employee = buildUser(1L);
        User someOtherManager = buildUser(99L);
        User unauthorizedManager = buildUser(2L); // no ADMINISTRATOR role, not assigned

        LeaveRequest request = buildPendingRequest(40L, employee, someOtherManager,
                LeaveDurationType.FULL_DAY, new BigDecimal("1"));

        when(leaveRequestRepository.findById(40L)).thenReturn(Optional.of(request));

        assertThatThrownBy(() -> leaveApprovalService.approveRequest(40L, unauthorizedManager, "Approved"))
                .isInstanceOf(IllegalStateException.class);

        verify(leaveBalanceService, never()).deductBalance(any(), any(), any());
    }

    /**
     * Validates: Requirements 8.1
     * The assigned manager can approve their own assigned request.
     */
    @Test
    void approveRequest_byAssignedManager_succeeds() {
        User employee = buildUser(1L);
        User manager = buildUser(2L);
        LeaveRequest request = buildPendingRequest(50L, employee, manager,
                LeaveDurationType.FULL_DAY, new BigDecimal("1"));

        when(leaveRequestRepository.findById(50L)).thenReturn(Optional.of(request));
        when(leaveRequestRepository.save(any(LeaveRequest.class)))
                .thenAnswer(inv -> inv.getArgument(0));

        LeaveRequest result = leaveApprovalService.approveRequest(50L, manager, "Approved");

        assertThat(result.getStatus()).isEqualTo(LeaveRequestStatus.APPROVED);
    }

    /**
     * Validates: Requirements 8.1
     * An ADMINISTRATOR can approve any request, even if not the assigned manager.
     */
    @Test
    void approveRequest_byAdministrator_succeedsEvenIfNotAssignedManager() {
        User employee = buildUser(1L);
        User someOtherManager = buildUser(99L);
        User admin = buildAdminUser(2L);

        LeaveRequest request = buildPendingRequest(60L, employee, someOtherManager,
                LeaveDurationType.FULL_DAY, new BigDecimal("1"));

        when(leaveRequestRepository.findById(60L)).thenReturn(Optional.of(request));
        when(leaveRequestRepository.save(any(LeaveRequest.class)))
                .thenAnswer(inv -> inv.getArgument(0));

        LeaveRequest result = leaveApprovalService.approveRequest(60L, admin, "Admin approved");

        assertThat(result.getStatus()).isEqualTo(LeaveRequestStatus.APPROVED);
    }
}
