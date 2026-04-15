package com.tns.leavemgmt.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "leave_balances",
        uniqueConstraints = @UniqueConstraint(
                name = "uq_leave_balance_user_type_year",
                columnNames = {"user_id", "leave_type_id", "year"}))
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
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

    @Column(name = "available_days", nullable = false, precision = 10, scale = 2)
    private BigDecimal availableDays;

    @Column(name = "accrued_days", precision = 10, scale = 2)
    private BigDecimal accruedDays;

    @Column(name = "used_days", precision = 10, scale = 2)
    private BigDecimal usedDays;

    @Column(name = "available_hours", precision = 10, scale = 2)
    private BigDecimal availableHours;

    @Column(name = "used_hours", precision = 10, scale = 2)
    private BigDecimal usedHours;

    @Column(nullable = false)
    private Integer year;

    @UpdateTimestamp
    @Column(name = "last_updated")
    private LocalDateTime lastUpdated;
}
