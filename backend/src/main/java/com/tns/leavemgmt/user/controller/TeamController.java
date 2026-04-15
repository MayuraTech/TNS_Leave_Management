package com.tns.leavemgmt.user.controller;

import com.tns.leavemgmt.user.dto.CreateTeamRequest;
import com.tns.leavemgmt.user.dto.TeamResponse;
import com.tns.leavemgmt.user.dto.UpdateTeamRequest;
import com.tns.leavemgmt.entity.User;
import com.tns.leavemgmt.user.repository.UserRepository;
import com.tns.leavemgmt.user.service.TeamService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST controller for team CRUD operations.
 * All endpoints require ADMINISTRATOR role (Requirement 4.1).
 */
@RestController
@RequestMapping("/api/admin/teams")
@PreAuthorize("hasRole('ADMINISTRATOR')")
public class TeamController {

    private final TeamService teamService;
    private final UserRepository userRepository;

    public TeamController(TeamService teamService,
                          UserRepository userRepository) {
        this.teamService = teamService;
        this.userRepository = userRepository;
    }

    /** POST /api/admin/teams — Create a new team */
    @PostMapping
    public ResponseEntity<TeamResponse> createTeam(
            @Valid @RequestBody CreateTeamRequest request,
            @AuthenticationPrincipal UserDetails principal) {
        User admin = resolveUser(principal);
        TeamResponse response = teamService.createTeam(request, admin);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /** GET /api/admin/teams — List teams, optionally filtered by department */
    @GetMapping
    public ResponseEntity<List<TeamResponse>> getTeams(
            @RequestParam(required = false) Long departmentId) {
        if (departmentId != null) {
            return ResponseEntity.ok(teamService.getTeamsByDepartment(departmentId));
        }
        // Return all teams by fetching each — delegate to a simple findAll via repository
        // TeamService exposes getTeamsByDepartment; for all teams we use a broad fetch
        return ResponseEntity.ok(teamService.getAllTeams());
    }

    /** PUT /api/admin/teams/{id} — Update a team */
    @PutMapping("/{id}")
    public ResponseEntity<TeamResponse> updateTeam(
            @PathVariable Long id,
            @Valid @RequestBody UpdateTeamRequest request,
            @AuthenticationPrincipal UserDetails principal) {
        User admin = resolveUser(principal);
        TeamResponse response = teamService.updateTeam(id, request, admin);
        return ResponseEntity.ok(response);
    }

    /** DELETE /api/admin/teams/{id} — Delete a team */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteTeam(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails principal) {
        User admin = resolveUser(principal);
        teamService.deleteTeam(id, admin);
        return ResponseEntity.noContent().build();
    }

    private User resolveUser(UserDetails principal) {
        return userRepository.findByUsername(principal.getUsername())
                .orElseThrow(() -> new IllegalStateException("Authenticated user not found: " + principal.getUsername()));
    }
}
