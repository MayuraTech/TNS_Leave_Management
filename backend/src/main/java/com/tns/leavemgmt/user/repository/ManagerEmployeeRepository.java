package com.tns.leavemgmt.user.repository;

import com.tns.leavemgmt.user.entity.ManagerEmployee;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ManagerEmployeeRepository extends JpaRepository<ManagerEmployee, Long> {

    /**
     * Find the active (effectiveTo is null) relationship for a given employee.
     */
    @Query("SELECT me FROM ManagerEmployee me WHERE me.employee.id = :employeeId AND me.effectiveTo IS NULL")
    Optional<ManagerEmployee> findActiveByEmployeeId(@Param("employeeId") Long employeeId);

    /**
     * Find all active direct reports for a given manager.
     */
    @Query("SELECT me FROM ManagerEmployee me WHERE me.manager.id = :managerId AND me.effectiveTo IS NULL")
    List<ManagerEmployee> findActiveByManagerId(@Param("managerId") Long managerId);
}
