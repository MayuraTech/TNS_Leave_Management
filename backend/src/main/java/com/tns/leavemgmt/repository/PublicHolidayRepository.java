package com.tns.leavemgmt.repository;

import com.tns.leavemgmt.entity.PublicHoliday;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface PublicHolidayRepository extends JpaRepository<PublicHoliday, Long> {

    List<PublicHoliday> findByHolidayDateBetween(LocalDate startDate, LocalDate endDate);

    @Query("SELECT h FROM PublicHoliday h WHERE YEAR(h.holidayDate) = :year")
    List<PublicHoliday> findByYear(@Param("year") int year);

    boolean existsByHolidayDate(LocalDate holidayDate);
}
