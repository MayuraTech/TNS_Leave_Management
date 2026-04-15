package com.tns.leavemgmt.repository;

import com.tns.leavemgmt.entity.PublicHoliday;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface PublicHolidayRepository extends JpaRepository<PublicHoliday, Long> {

    List<PublicHoliday> findByHolidayDateBetween(LocalDate startDate, LocalDate endDate);
}
