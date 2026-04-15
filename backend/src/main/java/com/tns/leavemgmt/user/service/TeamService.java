package com.tns.leavemgmt.user.service;

import com.tns.leavemgmt.audit.service.AuditService;
import com.tns.leavemgmt.exception.ResourceNotFoundException;
import com.tns.leavemgmt.user.dto.*;
import com.tns.leavemgmt.entity.Department;
import com.tns.leavemgmt.entity.Team;
import com.tns.leavemgmt.entity.User;
import com.tns.leavemgmt.user.repository.DepartmentRepository;
import com.tns.leavemgmt.user.repository.TeamRepository;
import com.tns.leavemgmt.user.repository.UserRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
public class TeamService {

    private final TeamRepository teamRepository;
    private final DepartmentRepository departmentRepository;
    private final UserRepository userRepository;
    private final AuditService auditService;

    public TeamService(TeamRepository teamRepository,
                       DepartmentRepository departmentRepository,
                       UserRepository userRepository,
                       AuditService auditService) {
        this.teamRepository = teamRepository;
        this.departmentRepository = departmentRepository;
        this.userRepository = userRepository;
        this.auditService = auditService;
    }

    @Transactional
    public TeamResponse createTeam(CreateTeamRequest request, User performedBy) {
        Department department = departmentRepository.findById(request.getDepartmentId())
                .orElseThrow(() -> new ResourceNotFoundException("Department not found with id: " + request.getDepartmentId()));

        User manager = null;
        if (request.getManagerId() != null) {
            manager = userRepository.findById(request.getManagerId())
                    .orElseThrow(() -> ResourceNotFoundException.forUser(request.getManagerId()));
        }

        Team team = Team.builder()
                .name(request.getName())
                .department(department)
                .manager(manager)
                .build();

        team = teamRepository.save(team);
        log.info("Created team: name={} departmentId={} by={}", team.getName(), department.getId(), performedBy.getUsername());

        auditService.recordAudit("Team", team.getId(), "TEAM_CREATED",
                null, "name=" + team.getName() + ",departmentId=" + department.getId(), performedBy);

        return toResponse(team);
    }

    @Transactional
    public TeamResponse updateTeam(Long id, UpdateTeamRequest request, User performedBy) {
        Team team = teamRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Team not found with id: " + id));

        String oldValue = "name=" + team.getName() + ",departmentId=" + team.getDepartment().getId();

        if (request.getName() != null) {
            team.setName(request.getName());
        }
        if (request.getDepartmentId() != null) {
            Department department = departmentRepository.findById(request.getDepartmentId())
                    .orElseThrow(() -> new ResourceNotFoundException("Department not found with id: " + request.getDepartmentId()));
            team.setDepartment(department);
        }
        if (request.getManagerId() != null) {
            User manager = userRepository.findById(request.getManagerId())
                    .orElseThrow(() -> ResourceNotFoundException.forUser(request.getManagerId()));
            team.setManager(manager);
        }

        team = teamRepository.save(team);
        log.info("Updated team: id={} by={}", id, performedBy.getUsername());

        String newValue = "name=" + team.getName() + ",departmentId=" + team.getDepartment().getId();
        auditService.recordAudit("Team", id, "TEAM_UPDATED", oldValue, newValue, performedBy);

        return toResponse(team);
    }

    @Transactional
    public void deleteTeam(Long id, User performedBy) {
        Team team = teamRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Team not found with id: " + id));

        teamRepository.delete(team);
        log.info("Deleted team: id={} by={}", id, performedBy.getUsername());

        auditService.recordAudit("Team", id, "TEAM_DELETED",
                "name=" + team.getName(), null, performedBy);
    }

    @Transactional(readOnly = true)
    public TeamResponse getTeamById(Long id) {
        Team team = teamRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Team not found with id: " + id));
        return toResponse(team);
    }

    @Transactional(readOnly = true)
    public List<TeamResponse> getAllTeams() {
        return teamRepository.findAll().stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<TeamResponse> getTeamsByDepartment(Long departmentId) {
        if (!departmentRepository.existsById(departmentId)) {
            throw new ResourceNotFoundException("Department not found with id: " + departmentId);
        }
        return teamRepository.findByDepartmentId(departmentId).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    /**
     * Assigns a user to a team. Automatically assigns the user to the team's department (Req 4.4).
     * Enforces single-team constraint: removes user from any existing team first (Req 4.5).
     */
    @Transactional
    public void assignUserToTeam(Long teamId, Long userId, User performedBy) {
        Team team = teamRepository.findById(teamId)
                .orElseThrow(() -> new ResourceNotFoundException("Team not found with id: " + teamId));

        User user = userRepository.findById(userId)
                .orElseThrow(() -> ResourceNotFoundException.forUser(userId));

        String oldTeam = user.getTeam() != null ? String.valueOf(user.getTeam().getId()) : "null";
        String oldDept = user.getDepartment() != null ? String.valueOf(user.getDepartment().getId()) : "null";

        // Req 4.5: single-team constraint — replace any existing team assignment
        user.setTeam(team);

        // Req 4.4: auto-assign to team's department
        user.setDepartment(team.getDepartment());

        userRepository.save(user);
        log.info("Assigned userId={} to teamId={} (departmentId={}) by={}",
                userId, teamId, team.getDepartment().getId(), performedBy.getUsername());

        auditService.recordAudit("User", userId, "TEAM_ASSIGNED",
                "teamId=" + oldTeam + ",departmentId=" + oldDept,
                "teamId=" + teamId + ",departmentId=" + team.getDepartment().getId(),
                performedBy);
    }

    @Transactional
    public void removeUserFromTeam(Long teamId, Long userId, User performedBy) {
        Team team = teamRepository.findById(teamId)
                .orElseThrow(() -> new ResourceNotFoundException("Team not found with id: " + teamId));

        User user = userRepository.findById(userId)
                .orElseThrow(() -> ResourceNotFoundException.forUser(userId));

        if (user.getTeam() == null || !user.getTeam().getId().equals(teamId)) {
            throw new IllegalStateException("User " + userId + " is not a member of team " + teamId);
        }

        user.setTeam(null);
        userRepository.save(user);
        log.info("Removed userId={} from teamId={} by={}", userId, teamId, performedBy.getUsername());

        auditService.recordAudit("User", userId, "TEAM_REMOVED",
                "teamId=" + teamId, "teamId=null", performedBy);
    }

    private TeamResponse toResponse(Team team) {
        return TeamResponse.builder()
                .id(team.getId())
                .name(team.getName())
                .departmentId(team.getDepartment().getId())
                .departmentName(team.getDepartment().getName())
                .managerId(team.getManager() != null ? team.getManager().getId() : null)
                .managerName(team.getManager() != null
                        ? team.getManager().getFirstName() + " " + team.getManager().getLastName()
                        : null)
                .createdAt(team.getCreatedAt())
                .build();
    }
}
