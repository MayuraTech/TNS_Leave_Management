package com.tns.leavemgmt.audit.service;

import com.tns.leavemgmt.audit.entity.AuditLog;
import com.tns.leavemgmt.audit.repository.AuditLogRepository;
import com.tns.leavemgmt.user.entity.User;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Slf4j
@Service
public class AuditService {

    private final AuditLogRepository auditLogRepository;

    public AuditService(AuditLogRepository auditLogRepository) {
        this.auditLogRepository = auditLogRepository;
    }

    @Transactional(propagation = Propagation.REQUIRED)
    public void recordAudit(String entityType, Long entityId, String actionType,
                            String oldValue, String newValue, User performedBy) {
        AuditLog entry = AuditLog.builder()
                .entityType(entityType)
                .entityId(entityId)
                .actionType(actionType)
                .oldValue(oldValue)
                .newValue(newValue)
                .performedBy(performedBy)
                .performedAt(LocalDateTime.now())
                .build();

        auditLogRepository.save(entry);
        log.info("AUDIT [{}] entity={} id={} by={}",
                actionType, entityType, entityId,
                performedBy != null ? performedBy.getUsername() : "system");
    }
}
