package com.tns.leavemgmt.leave.service;

import com.tns.leavemgmt.exception.ResourceNotFoundException;
import com.tns.leavemgmt.leave.dto.CreateLeavePolicyRequest;
import com.tns.leavemgmt.leave.dto.LeavePolicyResponse;
import com.tns.leavemgmt.leave.entity.LeavePolicy;
import com.tns.leavemgmt.leave.entity.LeaveType;
import com.tns.leavemgmt.leave.repository.LeavePolicyRepository;
import com.tns.leavemgmt.leave.repository.LeaveTypeRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
public class LeavePolicyService {

    private final LeavePolicyRepository leavePolicyRepository;
    private final LeaveTypeRepository leaveTypeRepository;

    public LeavePolicyService(LeavePolicyRepository leavePolicyRepository,
                              LeaveTypeRepository leaveTypeRepository) {
        this.leavePolicyRepository = leavePolicyRepository;
        this.leaveTypeRepository = leaveTypeRepository;
    }

    @Transactional
    public LeavePolicyResponse createPolicy(CreateLeavePolicyRequest request) {
        LeaveType leaveType = leaveTypeRepository.findById(request.getLeaveTypeId())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Leave type not found with id: " + request.getLeaveTypeId()));

        LeavePolicy policy = LeavePolicy.builder()
                .leaveType(leaveType)
                .accrualRate(request.getAccrualRate())
                .maxCarryOverDays(request.getMaxCarryOverDays())
                .minNoticeDays(request.getMinNoticeDays())
                .effectiveFrom(request.getEffectiveFrom())
                .effectiveTo(request.getEffectiveTo())
                .build();

        policy = leavePolicyRepository.save(policy);
        log.info("Created leave policy: id={} for leaveTypeId={}", policy.getId(), leaveType.getId());

        return toResponse(policy);
    }

    @Transactional
    public LeavePolicyResponse updatePolicy(Long id, CreateLeavePolicyRequest request) {
        LeavePolicy policy = leavePolicyRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Leave policy not found with id: " + id));

        LeaveType leaveType = leaveTypeRepository.findById(request.getLeaveTypeId())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Leave type not found with id: " + request.getLeaveTypeId()));

        policy.setLeaveType(leaveType);
        policy.setAccrualRate(request.getAccrualRate());
        policy.setMaxCarryOverDays(request.getMaxCarryOverDays());
        policy.setMinNoticeDays(request.getMinNoticeDays());
        policy.setEffectiveFrom(request.getEffectiveFrom());
        policy.setEffectiveTo(request.getEffectiveTo());

        policy = leavePolicyRepository.save(policy);
        log.info("Updated leave policy: id={}", id);

        return toResponse(policy);
    }

    @Transactional(readOnly = true)
    public LeavePolicyResponse getPolicyByLeaveType(Long leaveTypeId) {
        return leavePolicyRepository.findActivePolicy(leaveTypeId, LocalDate.now())
                .map(this::toResponse)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "No active policy found for leave type id: " + leaveTypeId));
    }

    @Transactional(readOnly = true)
    public List<LeavePolicyResponse> getAllPolicies() {
        return leavePolicyRepository.findAll().stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    LeavePolicyResponse toResponse(LeavePolicy policy) {
        return LeavePolicyResponse.builder()
                .id(policy.getId())
                .leaveTypeId(policy.getLeaveType().getId())
                .leaveTypeName(policy.getLeaveType().getName())
                .accrualRate(policy.getAccrualRate())
                .maxCarryOverDays(policy.getMaxCarryOverDays())
                .minNoticeDays(policy.getMinNoticeDays())
                .effectiveFrom(policy.getEffectiveFrom())
                .effectiveTo(policy.getEffectiveTo())
                .build();
    }
}
