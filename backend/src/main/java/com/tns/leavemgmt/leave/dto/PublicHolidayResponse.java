package com.tns.leavemgmt.leave.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PublicHolidayResponse {

    private Long id;
    private LocalDate date;
    private String name;
    private LocalDateTime createdAt;
}
