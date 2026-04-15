package com.tns.leavemgmt.event;

import com.tns.leavemgmt.entity.User;
import lombok.Getter;
import org.springframework.context.ApplicationEvent;

/**
 * Published when a user account is created, modified, or deactivated/reactivated.
 * Satisfies Requirement 18.4.
 */
@Getter
public class UserAccountChangedEvent extends ApplicationEvent {

    public enum ChangeType {
        CREATED, MODIFIED, DEACTIVATED, REACTIVATED
    }

    private final User affectedUser;
    private final ChangeType changeType;
    private final String oldValue;
    private final String newValue;
    private final User performedBy;

    public UserAccountChangedEvent(Object source,
                                   User affectedUser,
                                   ChangeType changeType,
                                   String oldValue,
                                   String newValue,
                                   User performedBy) {
        super(source);
        this.affectedUser = affectedUser;
        this.changeType = changeType;
        this.oldValue = oldValue;
        this.newValue = newValue;
        this.performedBy = performedBy;
    }
}
