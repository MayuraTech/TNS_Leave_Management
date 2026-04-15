package com.tns.leavemgmt.repository;

import com.tns.leavemgmt.entity.LeaveAccrualTransaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface LeaveAccrualTransactionRepository extends JpaRepository<LeaveAccrualTransaction, Long> {

    List<LeaveAccrualTransaction> findByUserId(Long userId);

    List<LeaveAccrualTransaction> findByUserIdAndLeaveTypeId(Long userId, Long leaveTypeId);
}
