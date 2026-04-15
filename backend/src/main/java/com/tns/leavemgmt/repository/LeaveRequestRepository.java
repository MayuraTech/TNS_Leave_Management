package com.tns.leavemgmt.repository;

import com.tns.leavemgmt.entity.LeaveRequest;
import com.tns.leavemgmt.entity.LeaveRequestStatus;
import com.tns.leavemgmt.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface LeaveRequestRepository extends JpaRepository<LeaveRequest, Long> {

    /**
     * Finds overlapping leave requests for an employee.
     * A request overlaps if: existing.startDate <= newEndDate AND existing.endDate >= newStartDate
     * Only considers PENDING or APPROVED requests (excludes CANCELLED/DENIED).
     */
    @Query("SELECT lr FROM LeaveRequest lr WHERE lr.employee.id = :employeeId " +
           "AND lr.status IN (com.tns.leavemgmt.entity.LeaveRequestStatus.PENDING, " +
           "                  com.tns.leavemgmt.entity.LeaveRequestStatus.APPROVED) " +
           "AND lr.startDate <= :endDate AND lr.endDate >= :startDate")
    List<LeaveRequest> findOverlappingRequests(@Param("employeeId") Long employeeId,
                                               @Param("startDate") LocalDate startDate,
                                               @Param("endDate") LocalDate endDate);

    List<LeaveRequest> findByEmployee(User employee);

    List<LeaveRequest> findByEmployeeAndStatus(User employee, LeaveRequestStatus status);

    List<LeaveRequest> findByAssignedManagerAndStatus(User manager, LeaveRequestStatus status);

    /**
     * Returns APPROVED leave requests for all members of a given team within a date range.
     * Optionally filtered by leave type when leaveTypeId is provided.
     * Requirements: 11.1, 11.2, 11.3, 11.4
     */
    @Query("SELECT lr FROM LeaveRequest lr " +
           "WHERE lr.employee.team.id = :teamId " +
           "AND lr.status = com.tns.leavemgmt.entity.LeaveRequestStatus.APPROVED " +
           "AND lr.startDate <= :endDate AND lr.endDate >= :startDate " +
           "AND (:leaveTypeId IS NULL OR lr.leaveType.id = :leaveTypeId)")
    List<LeaveRequest> findApprovedByTeamAndDateRange(@Param("teamId") Long teamId,
                                                      @Param("startDate") LocalDate startDate,
                                                      @Param("endDate") LocalDate endDate,
                                                      @Param("leaveTypeId") Long leaveTypeId);

    /**
     * Returns APPROVED leave requests within a date range, optionally filtered by department and leave type.
     * Requirements: 13.1
     */
    @Query("SELECT lr FROM LeaveRequest lr " +
           "WHERE lr.status = com.tns.leavemgmt.entity.LeaveRequestStatus.APPROVED " +
           "AND lr.startDate <= :endDate AND lr.endDate >= :startDate " +
           "AND (:departmentId IS NULL OR lr.employee.department.id = :departmentId) " +
           "AND (:leaveTypeId IS NULL OR lr.leaveType.id = :leaveTypeId)")
    List<LeaveRequest> findApprovedByDateRangeAndFilters(@Param("startDate") LocalDate startDate,
                                                         @Param("endDate") LocalDate endDate,
                                                         @Param("departmentId") Long departmentId,
                                                         @Param("leaveTypeId") Long leaveTypeId);

    /**
     * Returns all PENDING leave requests across the organization.
     * Requirements: 13.3
     */
    List<LeaveRequest> findByStatus(LeaveRequestStatus status);

    /**
     * Returns APPROVED leave requests within a date range grouped by department.
     * Requirements: 13.5
     */
    @Query("SELECT lr FROM LeaveRequest lr " +
           "WHERE lr.status = com.tns.leavemgmt.entity.LeaveRequestStatus.APPROVED " +
           "AND lr.startDate <= :endDate AND lr.endDate >= :startDate")
    List<LeaveRequest> findApprovedByDateRange(@Param("startDate") LocalDate startDate,
                                               @Param("endDate") LocalDate endDate);
}
