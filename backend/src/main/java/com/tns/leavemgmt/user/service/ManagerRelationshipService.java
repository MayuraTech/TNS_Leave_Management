package com.tns.leavemgmt.user.service;

import com.tns.leavemgmt.service.AuditService;
import com.tns.leavemgmt.exception.ResourceNotFoundException;
import com.tns.leavemgmt.entity.ManagerEmployee;
import com.tns.leavemgmt.entity.User;
import com.tns.leavemgmt.user.repository.ManagerEmployeeRepository;
import com.tns.leavemgmt.user.repository.UserRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * Manages Manager-Employee relationships.
 * All mutating operations are restricted to Administrators (enforced at the controller level
 * via Spring Security's @PreAuthorize or URL-based security on /api/admin/**).
 *
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6
 */
@Slf4j
@Service
public class ManagerRelationshipService {

    private final ManagerEmployeeRepository managerEmployeeRepository;
    private final UserRepository userRepository;
    private final AuditService auditService;

    public ManagerRelationshipService(ManagerEmployeeRepository managerEmployeeRepository,
                                      UserRepository userRepository,
                                      AuditService auditService) {
        this.managerEmployeeRepository = managerEmployeeRepository;
        this.userRepository = userRepository;
        this.auditService = auditService;
    }

    /**
     * Assigns a manager to an employee.
     * If the employee already has an active manager, the existing relationship is closed
     * (effectiveTo set to now) before creating the new one, enforcing the single-manager
     * constraint (Requirement 5.3).
     *
     * @param employeeId       ID of the employee
     * @param managerId        ID of the manager to assign
     * @param assignedByAdmin  The administrator performing the action
     * @return the newly created ManagerEmployee relationship
     */
    @Transactional
    public ManagerEmployee assignManager(Long employeeId, Long managerId, User assignedByAdmin) {
        User employee = userRepository.findById(employeeId)
                .orElseThrow(() -> ResourceNotFoundException.forUser(employeeId));
        User manager = userRepository.findById(managerId)
                .orElseThrow(() -> ResourceNotFoundException.forUser(managerId));

        // Close any existing active relationship (single-manager constraint)
        Optional<ManagerEmployee> existing = managerEmployeeRepository.findActiveByEmployeeId(employeeId);
        existing.ifPresent(rel -> {
            rel.setEffectiveTo(LocalDateTime.now());
            managerEmployeeRepository.save(rel);
            log.info("Closed existing manager relationship: employeeId={} previousManagerId={} by={}",
                    employeeId, rel.getManager().getId(), assignedByAdmin.getUsername());
        });

        // Create new relationship
        ManagerEmployee relationship = ManagerEmployee.builder()
                .manager(manager)
                .employee(employee)
                .effectiveFrom(LocalDateTime.now())
                .createdBy(assignedByAdmin)
                .build();

        relationship = managerEmployeeRepository.save(relationship);
        log.info("Assigned manager: employeeId={} managerId={} by={}",
                employeeId, managerId, assignedByAdmin.getUsername());

        auditService.recordAudit("ManagerEmployee", relationship.getId(), "MANAGER_ASSIGNED",
                existing.map(r -> "managerId=" + r.getManager().getId()).orElse(null),
                "managerId=" + managerId,
                assignedByAdmin);

        return relationship;
    }

    /**
     * Removes the active manager relationship for an employee by closing it (sets effectiveTo).
     *
     * @param employeeId      ID of the employee
     * @param removedByAdmin  The administrator performing the action
     */
    @Transactional
    public void removeManager(Long employeeId, User removedByAdmin) {
        ManagerEmployee relationship = managerEmployeeRepository.findActiveByEmployeeId(employeeId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "No active manager relationship found for employee id: " + employeeId));

        Long previousManagerId = relationship.getManager().getId();
        relationship.setEffectiveTo(LocalDateTime.now());
        managerEmployeeRepository.save(relationship);

        log.info("Removed manager relationship: employeeId={} managerId={} by={}",
                employeeId, previousManagerId, removedByAdmin.getUsername());

        auditService.recordAudit("ManagerEmployee", relationship.getId(), "MANAGER_REMOVED",
                "managerId=" + previousManagerId, null, removedByAdmin);
    }

    /**
     * Returns the current active manager for an employee, or empty if none assigned.
     *
     * @param employeeId ID of the employee
     * @return Optional containing the active ManagerEmployee relationship
     */
    @Transactional(readOnly = true)
    public Optional<ManagerEmployee> getManagerForEmployee(Long employeeId) {
        return managerEmployeeRepository.findActiveByEmployeeId(employeeId);
    }

    /**
     * Returns all active direct reports for a manager.
     *
     * @param managerId ID of the manager
     * @return list of active ManagerEmployee relationships
     */
    @Transactional(readOnly = true)
    public List<ManagerEmployee> getDirectReports(Long managerId) {
        return managerEmployeeRepository.findActiveByManagerId(managerId);
    }
}
