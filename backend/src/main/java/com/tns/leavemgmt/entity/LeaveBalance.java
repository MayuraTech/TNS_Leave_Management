package com.tns.leavemgmt.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "leave_balances")
@Getter
@Setter
public class LeaveBalance {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "user_id")
    private User user;

    @ManyToOne(optional = false)
    @JoinColumn(name = "leave_type_id")
    private LeaveType leaveType;

    @Column(nullable = false)
    private BigDecimal availableDays;

    private BigDecimal accruedDays;
    private BigDecimal usedDays;

    private BigDecimal availableHours;
    private BigDecimal usedHours;

    @Column(nullable = false)
    private Integer year;

    @UpdateTimestamp
    private LocalDateTime lastUpdated;
}
