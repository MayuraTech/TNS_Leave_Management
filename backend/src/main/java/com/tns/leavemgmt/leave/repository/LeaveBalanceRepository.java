package com.tns.leavemgmt.leave.repository;

import com.tns.leavemgmt.entity.LeaveBalance;
import com.tns.leavemgmt.entity.LeaveType;
import com.tns.leavemgmt.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface LeaveBalanceRepository extends JpaRepository<LeaveBalance, Long> {

    Optional<LeaveBalance> findByUserIdAndLeaveTypeIdAndYear(Long userId, Long leaveTypeId, int year);

    List<LeaveBalance> findByUserIdAndYear(Long userId, int year);

    List<LeaveBalance> findByUserAndYear(User user, int year);

    Optional<LeaveBalance> findByUserAndLeaveTypeAndYear(User user, LeaveType leaveType, int year);

    @Query("SELECT lb FROM LeaveBalance lb WHERE lb.year = :year AND lb.user.department.id = :departmentId")
    List<LeaveBalance> findByYearAndDepartment(@Param("year") int year, @Param("departmentId") Long departmentId);
}
