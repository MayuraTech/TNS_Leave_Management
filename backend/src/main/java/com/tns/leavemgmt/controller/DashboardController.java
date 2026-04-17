package com.tns.leavemgmt.controller;

import com.tns.leavemgmt.dto.TeamCapacityResponse;
import com.tns.leavemgmt.entity.LeaveRequest;
import com.tns.leavemgmt.entity.User;
import com.tns.leavemgmt.repository.LeaveRequestRepository;
import com.tns.leavemgmt.user.repository.ManagerEmployeeRepository;
import com.tns.leavemgmt.user.repository.UserRepository;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Dashboard endpoints for manager/admin team capacity widget.
 */
@RestController
@RequestMapping("/api/dashboard")
@PreAuthorize("hasAnyRole('MANAGER', 'ADMINISTRATOR')")
public class DashboardController {

    private final UserRepository userRepository;
    private final ManagerEmployeeRepository managerEmployeeRepository;
    private final LeaveRequestRepository leaveRequestRepository;

    @PersistenceContext
    private EntityManager entityManager;

    public DashboardController(UserRepository userRepository,
                               ManagerEmployeeRepository managerEmployeeRepository,
                               LeaveRequestRepository leaveRequestRepository) {
        this.userRepository = userRepository;
        this.managerEmployeeRepository = managerEmployeeRepository;
        this.leaveRequestRepository = leaveRequestRepository;
    }

    /**
     * GET /api/dashboard/team-capacity
     * Returns team capacity for today based on the current user's department (admin)
     * or direct reports (manager).
     */
    @GetMapping("/team-capacity")
    @Transactional(readOnly = true)
    public ResponseEntity<TeamCapacityResponse> getTeamCapacity(
            @AuthenticationPrincipal UserDetails userDetails) {

        User currentUser = userRepository.findByUsername(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException("User not found"));

        boolean isAdmin = userDetails.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMINISTRATOR"));

        Set<Long> employeeIds;

        if (isAdmin) {
            Long deptId = currentUser.getDepartment() != null ? currentUser.getDepartment().getId() : null;
            if (deptId == null) {
                // No department — count all active users
                List<Long> ids = entityManager.createQuery(
                        "SELECT u.id FROM User u WHERE u.isActive = true", Long.class)
                        .getResultList();
                employeeIds = Set.copyOf(ids);
            } else {
                List<Long> ids = entityManager.createQuery(
                        "SELECT u.id FROM User u WHERE u.isActive = true AND u.department.id = :deptId", Long.class)
                        .setParameter("deptId", deptId)
                        .getResultList();
                employeeIds = Set.copyOf(ids);
            }
        } else {
            // Manager: direct reports only
            employeeIds = managerEmployeeRepository.findActiveByManagerId(currentUser.getId())
                    .stream()
                    .map(me -> me.getEmployee().getId())
                    .collect(Collectors.toSet());
        }

        int total = employeeIds.size();

        // Count how many are on approved leave today
        LocalDate today = LocalDate.now();
        List<LeaveRequest> todayLeaves = leaveRequestRepository
                .findApprovedByDateRangeAndFilters(today, today, null, null);

        long onLeave = todayLeaves.stream()
                .filter(lr -> employeeIds.contains(lr.getEmployee().getId()))
                .map(lr -> lr.getEmployee().getId())
                .distinct()
                .count();

        int available = total - (int) onLeave;
        int capacityPercent = total == 0 ? 100 : (int) Math.round((available * 100.0) / total);

        return ResponseEntity.ok(TeamCapacityResponse.builder()
                .totalEmployees(total)
                .onLeaveToday((int) onLeave)
                .available(available)
                .capacityPercent(capacityPercent)
                .build());
    }
}
