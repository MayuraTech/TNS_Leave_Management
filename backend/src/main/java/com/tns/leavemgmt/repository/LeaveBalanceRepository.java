package com.tns.leavemgmt.repository;

import com.tns.leavemgmt.entity.LeaveBalance;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface LeaveBalanceRepository extends JpaRepository<LeaveBalance, Long> {

    Optional<LeaveBalance> findByUserIdAndLeaveTypeIdAndYear(Long userId, Long leaveTypeId, Integer year);

    List<LeaveBalance> findByUserIdAndYear(Long userId, Integer year);

    List<LeaveBalance> findByUserId(Long userId);
}
