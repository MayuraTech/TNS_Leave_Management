package com.tns.leavemgmt.event;

import com.tns.leavemgmt.entity.LeaveBalance;
import com.tns.leavemgmt.entity.User;
import lombok.Getter;
import org.springframework.context.ApplicationEvent;

import java.math.BigDecimal;

/**
 * Published when an administrator manually adjusts a leave balance.
 * Satisfies Requirement 18.3.
 */
@Getter
public class LeaveBalanceAdjustedEvent extends ApplicationEvent {

    private final LeaveBalance leaveBalance;
    private final BigDecimal previousAvailableDays;
    private final BigDecimal adjustment;
    private final String reason;
    private final User adjustedBy;

    public LeaveBalanceAdjustedEvent(Object source,
                                     LeaveBalance leaveBalance,
                                     BigDecimal previousAvailableDays,
                                     BigDecimal adjustment,
                                     String reason,
                                     User adjustedBy) {
        super(source);
        this.leaveBalance = leaveBalance;
        this.previousAvailableDays = previousAvailableDays;
        this.adjustment = adjustment;
        this.reason = reason;
        this.adjustedBy = adjustedBy;
    }
}
