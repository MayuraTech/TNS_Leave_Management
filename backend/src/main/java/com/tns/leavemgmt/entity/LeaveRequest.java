package com.tns.leavemgmt.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import com.tns.leavemgmt.entity.enums.LeaveDurationType;
import com.tns.leavemgmt.entity.enums.LeaveRequestStatus;
import com.tns.leavemgmt.entity.enums.SessionType;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "leave_requests")
@Getter
@Setter
public class LeaveRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "employee_id")
    private User employee;

    @ManyToOne(optional = false)
    @JoinColumn(name = "leave_type_id")
    private LeaveType leaveType;

    @Column(nullable = false)
    private LocalDate startDate;

    @Column(nullable = false)
    private LocalDate endDate;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private LeaveDurationType durationType;

    @Enumerated(EnumType.STRING)
    private SessionType sessionType;

    private BigDecimal durationInHours;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal totalDays;

    @Column(nullable = false, length = 1000)
    private String reason;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private LeaveRequestStatus status;

    @ManyToOne
    @JoinColumn(name = "approved_by")
    private User approvedBy;

    @Column(length = 1000)
    private String approvalComments;

    @ManyToOne
    @JoinColumn(name = "assigned_manager_id")
    private User assignedManager;

    @CreationTimestamp
    private LocalDateTime submittedAt;

    private LocalDateTime processedAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;
}
