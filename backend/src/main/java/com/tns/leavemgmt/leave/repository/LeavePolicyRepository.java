package com.tns.leavemgmt.leave.repository;

import com.tns.leavemgmt.leave.entity.LeavePolicy;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface LeavePolicyRepository extends JpaRepository<LeavePolicy, Long> {

    List<LeavePolicy> findByLeaveTypeId(Long leaveTypeId);

    @Query("SELECT p FROM LeavePolicy p WHERE p.leaveType.id = :leaveTypeId " +
           "AND (p.effectiveTo IS NULL OR p.effectiveTo >= :today)")
    Optional<LeavePolicy> findActivePolicy(@Param("leaveTypeId") Long leaveTypeId,
                                           @Param("today") LocalDate today);
}
