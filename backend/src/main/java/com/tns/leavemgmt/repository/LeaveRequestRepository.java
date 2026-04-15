package com.tns.leavemgmt.repository;

import com.tns.leavemgmt.entity.LeaveRequest;
import com.tns.leavemgmt.entity.enums.LeaveRequestStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface LeaveRequestRepository extends JpaRepository<LeaveRequest, Long> {

    List<LeaveRequest> findByEmployeeId(Long employeeId);

    List<LeaveRequest> findByEmployeeIdAndStatus(Long employeeId, LeaveRequestStatus status);

    List<LeaveRequest> findByStatus(LeaveRequestStatus status);

    @Query("""
            SELECT r FROM LeaveRequest r
            WHERE r.employee.id = :employeeId
            AND r.status != com.tns.leavemgmt.entity.enums.LeaveRequestStatus.CANCELLED
            AND r.startDate <= :endDate AND r.endDate >= :startDate
            """)
    List<LeaveRequest> findOverlappingRequests(
            @Param("employeeId") Long employeeId,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate);

    @Query("""
            SELECT r FROM LeaveRequest r
            JOIN ManagerEmployee me ON me.employee.id = r.employee.id
            WHERE me.manager.id = :managerId AND me.effectiveTo IS NULL
            """)
    List<LeaveRequest> findByManagerId(@Param("managerId") Long managerId);

    @Query("""
            SELECT r FROM LeaveRequest r
            JOIN ManagerEmployee me ON me.employee.id = r.employee.id
            WHERE me.manager.id = :managerId AND me.effectiveTo IS NULL
            AND r.status = com.tns.leavemgmt.entity.enums.LeaveRequestStatus.PENDING
            """)
    List<LeaveRequest> findPendingByManagerId(@Param("managerId") Long managerId);
}
