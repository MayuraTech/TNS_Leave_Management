package com.tns.leavemgmt.service;

import com.tns.leavemgmt.dto.LeaveRequestDTO;
import com.tns.leavemgmt.entity.*;
import com.tns.leavemgmt.exception.InsufficientLeaveBalanceException;
import com.tns.leavemgmt.exception.OverlappingLeaveRequestException;
import com.tns.leavemgmt.repository.LeaveRequestRepository;
import com.tns.leavemgmt.repository.LeaveTypeRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.context.ApplicationEventPublisher;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * Unit tests for LeaveRequestService.
 * Requirements: 7.1, 7.5, 7.6, 7.7, 12.2
 */
@ExtendWith(MockitoExtension.class)
class LeaveRequestServiceTest {

    @Mock
    private LeaveTypeRepository leaveTypeRepository;

    @Mock
    private LeaveRequestRepository leaveRequestRepository;

    @Mock
    private LeaveBalanceService leaveBalanceService;

    @Mock
    private ManagerRelationshipService managerRelationshipService;

    @Mock
    private ApplicationEventPublisher eventPublisher;

    @InjectMocks
    private LeaveRequestService leaveRequestService;

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

    private LeaveType buildLeaveType(Long id) {
        LeaveType lt = new LeaveType();
        lt.setId(id);
        lt.setName("Annual Leave");
        lt.setIsActive(true);
        return lt;
    }

    private LeaveRequestDTO buildFullDayDto(Long leaveTypeId, LocalDate start, LocalDate end) {
        LeaveRequestDTO dto = new LeaveRequestDTO();
        dto.setLeaveTypeId(leaveTypeId);
        dto.setStartDate(start);
        dto.setEndDate(end);
        dto.setDurationType(LeaveDurationType.FULL_DAY);
        dto.setReason("Vacation");
        return dto;
    }

    // -------------------------------------------------------------------------
    // Tests
    // -------------------------------------------------------------------------

    /**
     * Requirement 7.1: Submission with sufficient balance succeeds and sets PENDING status.
     */
    @Test
    void submitLeaveRequest_withSufficientBalance_returnsPendingRequest() {
        User employee = buildUser(1L);
        LeaveType leaveType = buildLeaveType(10L);
        LocalDate start = LocalDate.now().plusDays(5);
        LocalDate end = start.plusDays(2);
        LeaveRequestDTO dto = buildFullDayDto(10L, start, end);

        when(leaveTypeRepository.findById(10L)).thenReturn(Optional.of(leaveType));
        when(leaveBalanceService.getAvailableBalance(employee, leaveType))
                .thenReturn(new BigDecimal("10"));
        when(leaveRequestRepository.findOverlappingRequests(employee.getId(), start, end))
                .thenReturn(Collections.emptyList());
        when(managerRelationshipService.findManagerForEmployee(employee))
                .thenReturn(Optional.empty());
        when(leaveRequestRepository.save(any(LeaveRequest.class)))
                .thenAnswer(inv -> inv.getArgument(0));

        LeaveRequest result = leaveRequestService.submitLeaveRequest(employee, dto);

        assertThat(result.getStatus()).isEqualTo(LeaveRequestStatus.PENDING);
        assertThat(result.getEmployee()).isEqualTo(employee);
        assertThat(result.getLeaveType()).isEqualTo(leaveType);
        assertThat(result.getStartDate()).isEqualTo(start);
        assertThat(result.getEndDate()).isEqualTo(end);
        verify(leaveRequestRepository).save(any(LeaveRequest.class));
        verify(eventPublisher).publishEvent(any());
    }

    /**
     * Requirement 7.1: Submission with insufficient balance throws InsufficientLeaveBalanceException.
     */
    @Test
    void submitLeaveRequest_withInsufficientBalance_throwsInsufficientLeaveBalanceException() {
        User employee = buildUser(1L);
        LeaveType leaveType = buildLeaveType(10L);
        LocalDate start = LocalDate.now().plusDays(5);
        LocalDate end = start.plusDays(4); // 5 days requested
        LeaveRequestDTO dto = buildFullDayDto(10L, start, end);

        when(leaveTypeRepository.findById(10L)).thenReturn(Optional.of(leaveType));
        when(leaveBalanceService.getAvailableBalance(employee, leaveType))
                .thenReturn(new BigDecimal("2")); // only 2 days available

        assertThatThrownBy(() -> leaveRequestService.submitLeaveRequest(employee, dto))
                .isInstanceOf(InsufficientLeaveBalanceException.class);

        verify(leaveRequestRepository, never()).save(any());
    }

    /**
     * Requirement 7.7: Submission with overlapping request throws OverlappingLeaveRequestException.
     */
    @Test
    void submitLeaveRequest_withOverlappingRequest_throwsOverlappingLeaveRequestException() {
        User employee = buildUser(1L);
        LeaveType leaveType = buildLeaveType(10L);
        LocalDate start = LocalDate.now().plusDays(5);
        LocalDate end = start.plusDays(2);
        LeaveRequestDTO dto = buildFullDayDto(10L, start, end);

        LeaveRequest existing = new LeaveRequest();
        existing.setId(99L);

        when(leaveTypeRepository.findById(10L)).thenReturn(Optional.of(leaveType));
        when(leaveBalanceService.getAvailableBalance(employee, leaveType))
                .thenReturn(new BigDecimal("10"));
        when(leaveRequestRepository.findOverlappingRequests(employee.getId(), start, end))
                .thenReturn(List.of(existing));

        assertThatThrownBy(() -> leaveRequestService.submitLeaveRequest(employee, dto))
                .isInstanceOf(OverlappingLeaveRequestException.class);

        verify(leaveRequestRepository, never()).save(any());
    }

    /**
     * Requirement 7.6: HOURLY leave with durationInHours outside 0.5–8.0 throws IllegalArgumentException.
     */
    @Test
    void submitLeaveRequest_hourlyWithInvalidHours_throwsIllegalArgumentException() {
        User employee = buildUser(1L);
        LeaveType leaveType = buildLeaveType(10L);
        LocalDate today = LocalDate.now().plusDays(3);

        LeaveRequestDTO dto = new LeaveRequestDTO();
        dto.setLeaveTypeId(10L);
        dto.setStartDate(today);
        dto.setEndDate(today);
        dto.setDurationType(LeaveDurationType.HOURLY);
        dto.setDurationInHours(new BigDecimal("9.0")); // exceeds max of 8.0
        dto.setReason("Doctor appointment");

        when(leaveTypeRepository.findById(10L)).thenReturn(Optional.of(leaveType));

        assertThatThrownBy(() -> leaveRequestService.submitLeaveRequest(employee, dto))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("0.5 and 8.0");

        verify(leaveRequestRepository, never()).save(any());
    }

    /**
     * Requirement 12.2: Cancellation before leave starts restores balance.
     */
    @Test
    void cancelRequest_beforeLeaveStarts_restoresBalance() {
        User employee = buildUser(1L);
        LeaveType leaveType = buildLeaveType(10L);
        LocalDate start = LocalDate.now().plusDays(1); // tomorrow — not yet started
        LocalDate end = start.plusDays(1);

        LeaveRequest request = new LeaveRequest();
        request.setId(42L);
        request.setEmployee(employee);
        request.setLeaveType(leaveType);
        request.setStartDate(start);
        request.setEndDate(end);
        request.setDurationType(LeaveDurationType.FULL_DAY);
        request.setTotalDays(new BigDecimal("2"));
        request.setStatus(LeaveRequestStatus.PENDING);
        request.setReason("Vacation");

        when(leaveRequestRepository.findById(42L)).thenReturn(Optional.of(request));
        when(leaveRequestRepository.save(any(LeaveRequest.class)))
                .thenAnswer(inv -> inv.getArgument(0));

        LeaveRequest result = leaveRequestService.cancelRequest(42L, employee);

        assertThat(result.getStatus()).isEqualTo(LeaveRequestStatus.CANCELLED);
        verify(leaveBalanceService).restoreBalance(employee, leaveType, new BigDecimal("2"));
        verify(eventPublisher).publishEvent(any());
    }
}
