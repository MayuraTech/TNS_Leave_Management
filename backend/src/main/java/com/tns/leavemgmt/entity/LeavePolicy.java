package com.tns.leavemgmt.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "leave_policies")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LeavePolicy {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "leave_type_id")
    private LeaveType leaveType;

    @Column(name = "accrual_rate", nullable = false, precision = 10, scale = 2)
    private BigDecimal accrualRate;

    @Column(name = "max_carry_over_days", nullable = false)
    private int maxCarryOverDays;

    @Column(name = "min_notice_days", nullable = false)
    private int minNoticeDays;

    @Column(name = "effective_from", nullable = false)
    private LocalDateTime effectiveFrom;

    @Column(name = "effective_to")
    private LocalDateTime effectiveTo;
}
