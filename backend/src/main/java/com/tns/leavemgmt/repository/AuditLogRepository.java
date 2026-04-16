package com.tns.leavemgmt.repository;

import com.tns.leavemgmt.entity.AuditLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, Long>, JpaSpecificationExecutor<AuditLog> {

    List<AuditLog> findByPerformedById(Long userId);

    List<AuditLog> findByEntityTypeAndEntityId(String entityType, Long entityId);

    List<AuditLog> findByPerformedAtBetween(LocalDateTime from, LocalDateTime to);

    List<AuditLog> findByActionType(String actionType);

    /**
     * Finds all audit logs matching the specification with performedBy User eagerly fetched.
     * This prevents LazyInitializationException when serializing audit logs to JSON.
     * Using standard findAll method name with EntityGraph to avoid Spring Data JPA query derivation.
     * Also eagerly fetches the user's department to prevent nested lazy loading issues.
     */
    @EntityGraph(attributePaths = {"performedBy", "performedBy.department"})
    Page<AuditLog> findAll(Specification<AuditLog> spec, Pageable pageable);
}
