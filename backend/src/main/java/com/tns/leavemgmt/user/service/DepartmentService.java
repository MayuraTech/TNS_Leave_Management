package com.tns.leavemgmt.user.service;

import com.tns.leavemgmt.service.AuditService;
import com.tns.leavemgmt.exception.DuplicateDepartmentNameException;
import com.tns.leavemgmt.exception.ResourceNotFoundException;
import com.tns.leavemgmt.user.dto.*;
import com.tns.leavemgmt.entity.Department;
import com.tns.leavemgmt.entity.User;
import com.tns.leavemgmt.user.repository.DepartmentRepository;
import com.tns.leavemgmt.user.repository.UserRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
public class DepartmentService {

    private final DepartmentRepository departmentRepository;
    private final UserRepository userRepository;
    private final AuditService auditService;

    public DepartmentService(DepartmentRepository departmentRepository,
                             UserRepository userRepository,
                             AuditService auditService) {
        this.departmentRepository = departmentRepository;
        this.userRepository = userRepository;
        this.auditService = auditService;
    }

    @Transactional
    public DepartmentResponse createDepartment(CreateDepartmentRequest request, User performedBy) {
        if (departmentRepository.existsByName(request.getName())) {
            throw new DuplicateDepartmentNameException(request.getName());
        }

        Department department = Department.builder()
                .name(request.getName())
                .description(request.getDescription())
                .build();

        department = departmentRepository.save(department);
        log.info("Created department: name={} by={}", department.getName(), performedBy.getUsername());

        auditService.recordAudit("Department", department.getId(), "DEPARTMENT_CREATED",
                null, "name=" + department.getName(), performedBy);

        return toResponse(department);
    }

    @Transactional
    public DepartmentResponse updateDepartment(Long id, UpdateDepartmentRequest request, User performedBy) {
        Department department = departmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Department not found with id: " + id));

        String oldValue = "name=" + department.getName() + ",description=" + department.getDescription();

        if (request.getName() != null && !request.getName().equals(department.getName())) {
            if (departmentRepository.existsByName(request.getName())) {
                throw new DuplicateDepartmentNameException(request.getName());
            }
            department.setName(request.getName());
        }
        if (request.getDescription() != null) {
            department.setDescription(request.getDescription());
        }

        department = departmentRepository.save(department);
        log.info("Updated department: id={} by={}", id, performedBy.getUsername());

        String newValue = "name=" + department.getName() + ",description=" + department.getDescription();
        auditService.recordAudit("Department", id, "DEPARTMENT_UPDATED", oldValue, newValue, performedBy);

        return toResponse(department);
    }

    @Transactional
    public void deleteDepartment(Long id, User performedBy) {
        Department department = departmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Department not found with id: " + id));

        departmentRepository.delete(department);
        log.info("Deleted department: id={} by={}", id, performedBy.getUsername());

        auditService.recordAudit("Department", id, "DEPARTMENT_DELETED",
                "name=" + department.getName(), null, performedBy);
    }

    @Transactional(readOnly = true)
    public DepartmentResponse getDepartmentById(Long id) {
        Department department = departmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Department not found with id: " + id));
        return toResponse(department);
    }

    @Transactional(readOnly = true)
    public List<DepartmentResponse> getAllDepartments() {
        return departmentRepository.findAll().stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public void assignUserToDepartment(Long departmentId, Long userId, User performedBy) {
        Department department = departmentRepository.findById(departmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Department not found with id: " + departmentId));

        User user = userRepository.findById(userId)
                .orElseThrow(() -> ResourceNotFoundException.forUser(userId));

        String oldDept = user.getDepartment() != null ? String.valueOf(user.getDepartment().getId()) : "null";
        user.setDepartment(department);
        userRepository.save(user);

        log.info("Assigned userId={} to departmentId={} by={}", userId, departmentId, performedBy.getUsername());

        auditService.recordAudit("User", userId, "DEPARTMENT_ASSIGNED",
                "departmentId=" + oldDept, "departmentId=" + departmentId, performedBy);
    }

    private DepartmentResponse toResponse(Department department) {
        return DepartmentResponse.builder()
                .id(department.getId())
                .name(department.getName())
                .description(department.getDescription())
                .createdAt(department.getCreatedAt())
                .build();
    }
}
