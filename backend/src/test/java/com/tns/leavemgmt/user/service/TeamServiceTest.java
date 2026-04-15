package com.tns.leavemgmt.user.service;

import com.tns.leavemgmt.audit.service.AuditService;
import com.tns.leavemgmt.exception.ResourceNotFoundException;
import com.tns.leavemgmt.entity.Department;
import com.tns.leavemgmt.entity.Team;
import com.tns.leavemgmt.entity.User;
import com.tns.leavemgmt.user.repository.DepartmentRepository;
import com.tns.leavemgmt.user.repository.TeamRepository;
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

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * Unit tests for TeamService.
 * Validates Requirements: 4.5 (single-team constraint), 4.4 (auto-assign department)
 */
@ExtendWith(MockitoExtension.class)
class TeamServiceTest {

    @Mock private TeamRepository teamRepository;
    @Mock private DepartmentRepository departmentRepository;
    @Mock private UserRepository userRepository;
    @Mock private AuditService auditService;

    @InjectMocks
    private TeamService teamService;

    private User adminUser;
    private Department engineeringDept;
    private Department marketingDept;
    private Team engineeringTeam;
    private Team marketingTeam;

    @BeforeEach
    void setUp() {
        adminUser = User.builder()
                .id(1L)
                .username("admin")
                .email("admin@example.com")
                .passwordHash("hash")
                .isActive(true)
                .build();

        engineeringDept = Department.builder().id(10L).name("Engineering").build();
        marketingDept   = Department.builder().id(20L).name("Marketing").build();

        engineeringTeam = Team.builder().id(100L).name("Backend Team").department(engineeringDept).build();
        marketingTeam   = Team.builder().id(200L).name("Growth Team").department(marketingDept).build();
    }

    // ── Requirement 4.5: Single-team constraint ──────────────────────────────

    @Nested
    @DisplayName("Single-team constraint enforcement (Req 4.5)")
    class SingleTeamConstraint {

        @Test
        @DisplayName("Should assign user to team when user has no existing team")
        void assignUserToTeam_noExistingTeam_assignsTeam() {
            User employee = employeeWithTeam(null, null);
            when(teamRepository.findById(100L)).thenReturn(Optional.of(engineeringTeam));
            when(userRepository.findById(50L)).thenReturn(Optional.of(employee));
            when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));

            teamService.assignUserToTeam(100L, 50L, adminUser);

            ArgumentCaptor<User> captor = ArgumentCaptor.forClass(User.class);
            verify(userRepository).save(captor.capture());
            assertThat(captor.getValue().getTeam()).isEqualTo(engineeringTeam);
        }

        @Test
        @DisplayName("Should replace existing team assignment (single-team constraint)")
        void assignUserToTeam_existingTeam_replacesWithNewTeam() {
            // User is already in engineeringTeam — should be moved to marketingTeam
            User employee = employeeWithTeam(engineeringTeam, engineeringDept);
            when(teamRepository.findById(200L)).thenReturn(Optional.of(marketingTeam));
            when(userRepository.findById(50L)).thenReturn(Optional.of(employee));
            when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));

            teamService.assignUserToTeam(200L, 50L, adminUser);

            ArgumentCaptor<User> captor = ArgumentCaptor.forClass(User.class);
            verify(userRepository).save(captor.capture());
            assertThat(captor.getValue().getTeam()).isEqualTo(marketingTeam);
            assertThat(captor.getValue().getTeam()).isNotEqualTo(engineeringTeam);
        }

        @Test
        @DisplayName("Should auto-assign user to team's department (Req 4.4)")
        void assignUserToTeam_autoAssignsDepartment() {
            User employee = employeeWithTeam(null, null);
            when(teamRepository.findById(100L)).thenReturn(Optional.of(engineeringTeam));
            when(userRepository.findById(50L)).thenReturn(Optional.of(employee));
            when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));

            teamService.assignUserToTeam(100L, 50L, adminUser);

            ArgumentCaptor<User> captor = ArgumentCaptor.forClass(User.class);
            verify(userRepository).save(captor.capture());
            assertThat(captor.getValue().getDepartment()).isEqualTo(engineeringDept);
        }

        @Test
        @DisplayName("Should update department when user moves to a different team's department")
        void assignUserToTeam_differentDepartment_updatesDepartment() {
            User employee = employeeWithTeam(engineeringTeam, engineeringDept);
            when(teamRepository.findById(200L)).thenReturn(Optional.of(marketingTeam));
            when(userRepository.findById(50L)).thenReturn(Optional.of(employee));
            when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));

            teamService.assignUserToTeam(200L, 50L, adminUser);

            ArgumentCaptor<User> captor = ArgumentCaptor.forClass(User.class);
            verify(userRepository).save(captor.capture());
            assertThat(captor.getValue().getDepartment()).isEqualTo(marketingDept);
        }

        @Test
        @DisplayName("Should record audit log on team assignment")
        void assignUserToTeam_recordsAuditLog() {
            User employee = employeeWithTeam(null, null);
            when(teamRepository.findById(100L)).thenReturn(Optional.of(engineeringTeam));
            when(userRepository.findById(50L)).thenReturn(Optional.of(employee));
            when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));

            teamService.assignUserToTeam(100L, 50L, adminUser);

            verify(auditService).recordAudit(
                    eq("User"), eq(50L), eq("TEAM_ASSIGNED"),
                    anyString(), anyString(), eq(adminUser));
        }

        @Test
        @DisplayName("Should throw ResourceNotFoundException when team does not exist")
        void assignUserToTeam_teamNotFound_throwsResourceNotFoundException() {
            when(teamRepository.findById(999L)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> teamService.assignUserToTeam(999L, 50L, adminUser))
                    .isInstanceOf(ResourceNotFoundException.class);
        }

        @Test
        @DisplayName("Should throw ResourceNotFoundException when user does not exist")
        void assignUserToTeam_userNotFound_throwsResourceNotFoundException() {
            when(teamRepository.findById(100L)).thenReturn(Optional.of(engineeringTeam));
            when(userRepository.findById(999L)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> teamService.assignUserToTeam(100L, 999L, adminUser))
                    .isInstanceOf(ResourceNotFoundException.class);
        }
    }

    @Nested
    @DisplayName("Remove user from team")
    class RemoveUserFromTeam {

        @Test
        @DisplayName("Should set team to null when removing user from their team")
        void removeUserFromTeam_clearsTeamAssignment() {
            User employee = employeeWithTeam(engineeringTeam, engineeringDept);
            when(teamRepository.findById(100L)).thenReturn(Optional.of(engineeringTeam));
            when(userRepository.findById(50L)).thenReturn(Optional.of(employee));
            when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));

            teamService.removeUserFromTeam(100L, 50L, adminUser);

            ArgumentCaptor<User> captor = ArgumentCaptor.forClass(User.class);
            verify(userRepository).save(captor.capture());
            assertThat(captor.getValue().getTeam()).isNull();
        }

        @Test
        @DisplayName("Should throw IllegalStateException when user is not in the specified team")
        void removeUserFromTeam_userNotInTeam_throwsIllegalStateException() {
            User employee = employeeWithTeam(marketingTeam, marketingDept);
            when(teamRepository.findById(100L)).thenReturn(Optional.of(engineeringTeam));
            when(userRepository.findById(50L)).thenReturn(Optional.of(employee));

            assertThatThrownBy(() -> teamService.removeUserFromTeam(100L, 50L, adminUser))
                    .isInstanceOf(IllegalStateException.class);
        }
    }

    // ── Helper ───────────────────────────────────────────────────────────────

    private User employeeWithTeam(Team team, Department department) {
        return User.builder()
                .id(50L)
                .username("employee")
                .email("employee@example.com")
                .passwordHash("hash")
                .isActive(true)
                .team(team)
                .department(department)
                .build();
    }
}
