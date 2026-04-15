package com.tns.leavemgmt.leave.service;

import com.tns.leavemgmt.leave.repository.PublicHolidayRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.util.Set;
import java.util.stream.Collectors;

@Slf4j
@Component
public class WorkingDayCalculator {

    private final PublicHolidayRepository publicHolidayRepository;

    public WorkingDayCalculator(PublicHolidayRepository publicHolidayRepository) {
        this.publicHolidayRepository = publicHolidayRepository;
    }

    /**
     * Calculates the number of working days in the inclusive range [startDate, endDate],
     * excluding weekends (Saturday, Sunday) and public holidays.
     *
     * @param startDate the first day of the range (inclusive)
     * @param endDate   the last day of the range (inclusive)
     * @return the count of working days
     */
    public long calculateWorkingDays(LocalDate startDate, LocalDate endDate) {
        if (startDate == null || endDate == null) {
            throw new IllegalArgumentException("Start date and end date must not be null");
        }
        if (startDate.isAfter(endDate)) {
            return 0L;
        }

        Set<LocalDate> publicHolidays = publicHolidayRepository
                .findByHolidayDateBetweenOrderByHolidayDateAsc(startDate, endDate)
                .stream()
                .map(ph -> ph.getHolidayDate())
                .collect(Collectors.toSet());

        long count = 0L;
        LocalDate current = startDate;
        while (!current.isAfter(endDate)) {
            if (isWorkingDay(current, publicHolidays)) {
                count++;
            }
            current = current.plusDays(1);
        }

        log.debug("Working days from {} to {}: {}", startDate, endDate, count);
        return count;
    }

    /**
     * Returns true if the given date is a working day (not a weekend and not a public holiday).
     *
     * @param date           the date to check
     * @param publicHolidays the set of public holiday dates to exclude
     * @return true if the date is a working day
     */
    public boolean isWorkingDay(LocalDate date, Set<LocalDate> publicHolidays) {
        DayOfWeek dow = date.getDayOfWeek();
        if (dow == DayOfWeek.SATURDAY || dow == DayOfWeek.SUNDAY) {
            return false;
        }
        return !publicHolidays.contains(date);
    }
}
