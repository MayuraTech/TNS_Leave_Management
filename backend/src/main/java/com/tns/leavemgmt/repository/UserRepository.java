package com.tns.leavemgmt.repository;

import com.tns.leavemgmt.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByUsername(String username);

    Optional<User> findByEmail(String email);

    Optional<User> findByUsernameOrEmail(String username, String email);

    List<User> findAllByIsActive(Boolean isActive);

    List<User> findByDepartmentId(Long departmentId);

    List<User> findByTeamId(Long teamId);

    boolean existsByUsername(String username);

    boolean existsByEmail(String email);
}
