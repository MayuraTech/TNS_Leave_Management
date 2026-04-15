package com.tns.leavemgmt.repository;

import com.tns.leavemgmt.entity.ManagerEmployee;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ManagerEmployeeRepository extends JpaRepository<ManagerEmployee, Long> {

    List<ManagerEmployee> findByEmployeeId(Long employeeId);

    List<ManagerEmployee> findByManagerId(Long managerId);

    @Query("SELECT me FROM ManagerEmployee me WHERE me.employee.id = :employeeId AND me.effectiveTo IS NULL")
    Optional<ManagerEmployee> findActiveByEmployeeId(@Param("employeeId") Long employeeId);
}
