package com.tns.leavemgmt.repository;

import com.tns.leavemgmt.entity.LeaveType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface LeaveTypeRepository extends JpaRepository<LeaveType, Long> {

    List<LeaveType> findByIsActive(Boolean isActive);

    Optional<LeaveType> findByName(String name);
}
