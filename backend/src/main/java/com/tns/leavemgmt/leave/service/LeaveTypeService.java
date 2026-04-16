package com.tns.leavemgmt.leave.service;

import com.tns.leavemgmt.exception.DuplicateLeaveTypeNameException;
import com.tns.leavemgmt.exception.ResourceNotFoundException;
import com.tns.leavemgmt.leave.dto.CreateLeaveTypeRequest;
import com.tns.leavemgmt.leave.dto.LeaveTypeResponse;
import com.tns.leavemgmt.leave.dto.UpdateLeaveTypeRequest;
import com.tns.leavemgmt.entity.LeaveType;
import com.tns.leavemgmt.leave.repository.LeaveTypeRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
public class LeaveTypeService {

    private final LeaveTypeRepository leaveTypeRepository;

    public LeaveTypeService(LeaveTypeRepository leaveTypeRepository) {
        this.leaveTypeRepository = leaveTypeRepository;
    }

    @Transactional
    public LeaveTypeResponse createLeaveType(CreateLeaveTypeRequest request) {
        if (leaveTypeRepository.existsByName(request.getName())) {
            throw new DuplicateLeaveTypeNameException(request.getName());
        }

        LeaveType leaveType = LeaveType.builder()
                .name(request.getName())
                .description(request.getDescription())
                .accrualRate(request.getAccrualRate())
                .maxCarryOverDays(request.getMaxCarryOverDays())
                .minNoticeDays(request.getMinNoticeDays())
                .isActive(true)
                .build();

        leaveType = leaveTypeRepository.save(leaveType);
        log.info("Created leave type: name={}", leaveType.getName());

        return toResponse(leaveType);
    }

    @Transactional
    public LeaveTypeResponse updateLeaveType(Long id, UpdateLeaveTypeRequest request) {
        LeaveType leaveType = leaveTypeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Leave type not found with id: " + id));

        if (request.getName() != null && !request.getName().equals(leaveType.getName())) {
            if (leaveTypeRepository.existsByName(request.getName())) {
                throw new DuplicateLeaveTypeNameException(request.getName());
            }
            leaveType.setName(request.getName());
        }
        if (request.getDescription() != null) {
            leaveType.setDescription(request.getDescription());
        }
        if (request.getAccrualRate() != null) {
            leaveType.setAccrualRate(request.getAccrualRate());
        }
        if (request.getMaxCarryOverDays() != null) {
            leaveType.setMaxCarryOverDays(request.getMaxCarryOverDays());
        }
        if (request.getMinNoticeDays() != null) {
            leaveType.setMinNoticeDays(request.getMinNoticeDays());
        }
        if (request.getIsActive() != null) {
            leaveType.setActive(request.getIsActive());
        }

        leaveType = leaveTypeRepository.save(leaveType);
        log.info("Updated leave type: id={}", id);

        return toResponse(leaveType);
    }

    @Transactional(readOnly = true)
    public LeaveTypeResponse getLeaveTypeById(Long id) {
        LeaveType leaveType = leaveTypeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Leave type not found with id: " + id));
        return toResponse(leaveType);
    }

    @Transactional(readOnly = true)
    public List<LeaveTypeResponse> getAllLeaveTypes() {
        return leaveTypeRepository.findAll().stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<LeaveTypeResponse> getActiveLeaveTypes() {
        return leaveTypeRepository.findByIsActiveTrue().stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public void deleteLeaveType(Long id) {
        LeaveType leaveType = leaveTypeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Leave type not found with id: " + id));

        leaveType.setActive(false);
        leaveTypeRepository.save(leaveType);
        log.info("Soft-deleted leave type: id={}", id);
    }

    LeaveTypeResponse toResponse(LeaveType leaveType) {
        return LeaveTypeResponse.builder()
                .id(leaveType.getId())
                .name(leaveType.getName())
                .description(leaveType.getDescription())
                .accrualRate(leaveType.getAccrualRate())
                .maxCarryOverDays(leaveType.getMaxCarryOverDays())
                .minNoticeDays(leaveType.getMinNoticeDays())
                .isActive(leaveType.isActive())
                .createdAt(leaveType.getCreatedAt())
                .build();
    }
}
