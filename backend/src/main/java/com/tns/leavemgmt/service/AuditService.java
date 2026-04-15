package com.tns.leavemgmt.service;

import com.tns.leavemgmt.entity.AuditLog;
import com.tns.leavemgmt.entity.User;
import com.tns.leavemgmt.repository.AuditLogRepository;
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuditService {

    private final AuditLogRepository auditLogRepository;

    /**
     * Records an audit log entry with entity type, action, old/new values, performer, and timestamp.
     * Runs in a new transaction so audit records are persisted even if the caller rolls back.
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public AuditLog recordAudit(String entityType,
                                Long entityId,
                                String actionType,
                                String oldValue,
                                String newValue,
                                User performedBy) {
        AuditLog auditLog = AuditLog.builder()
                .entityType(entityType)
                .entityId(entityId)
                .actionType(actionType)
                .oldValue(oldValue)
                .newValue(newValue)
                .performedBy(performedBy)
                .performedAt(LocalDateTime.now())
                .build();

        AuditLog saved = auditLogRepository.save(auditLog);
        log.debug("Audit recorded: entity={} id={} action={} by={}",
                entityType, entityId, actionType,
                performedBy != null ? performedBy.getUsername() : "system");
        return saved;
    }

    /**
     * Queries audit logs with optional filters. Supports pagination.
     * Covers Requirement 18.5.
     */
    @Transactional(readOnly = true)
    public Page<AuditLog> queryAuditLogs(Long userId,
                                         String actionType,
                                         LocalDateTime startDate,
                                         LocalDateTime endDate,
                                         Pageable pageable) {
        Specification<AuditLog> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            if (userId != null) {
                predicates.add(cb.equal(root.get("performedBy").get("id"), userId));
            }
            if (actionType != null && !actionType.isBlank()) {
                predicates.add(cb.equal(root.get("actionType"), actionType));
            }
            if (startDate != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("performedAt"), startDate));
            }
            if (endDate != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("performedAt"), endDate));
            }
            return cb.and(predicates.toArray(new Predicate[0]));
        };
        return auditLogRepository.findAll(spec, pageable);
    }
}
