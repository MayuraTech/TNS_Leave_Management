package com.tns.leavemgmt.leave.service;

import com.tns.leavemgmt.leave.entity.PublicHoliday;
import com.tns.leavemgmt.leave.repository.PublicHolidayRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.Collections;
import java.util.List;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

/**
 * Unit tests for WorkingDayCalculator.
 * Validates Requirements: 17.2 (public holidays excluded), 17.3 (weekends excluded)
 */
@ExtendWith(MockitoExtension.class)
class WorkingDayCalculatorTest {

    @Mock
    private PublicHolidayRepository publicHolidayRepository;

    @InjectMocks
    private WorkingDayCalculator calculator;

    @BeforeEach
    void setUp() {
        // Default: no public holidays unless overridden per test
        when(publicHolidayRepository.findByHolidayDateBetweenOrderByHolidayDateAsc(any(), any()))
                .thenReturn(Collections.emptyList());
    }

    // ── Requirement 17.3: Weekends excluded ──────────────────────────────────

    @Nested
    @DisplayName("Weekend exclusion (Req 17.3)")
    class WeekendExclusion {

        @Test
        @DisplayName("A full Mon–Fri week returns 5 working days")
        void fullWeek_returnsCorrectWorkingDays() {
            // 2024-01-08 (Mon) to 2024-01-12 (Fri)
            LocalDate start = LocalDate.of(2024, 1, 8);
            LocalDate end = LocalDate.of(2024, 1, 12);

            assertThat(calculator.calculateWorkingDays(start, end)).isEqualTo(5L);
        }

        @Test
        @DisplayName("A range spanning a weekend excludes Saturday and Sunday")
        void rangeSpanningWeekend_excludesSaturdayAndSunday() {
            // 2024-01-08 (Mon) to 2024-01-14 (Sun) → 5 working days
            LocalDate start = LocalDate.of(2024, 1, 8);
            LocalDate end = LocalDate.of(2024, 1, 14);

            assertThat(calculator.calculateWorkingDays(start, end)).isEqualTo(5L);
        }

        @Test
        @DisplayName("A range of only weekend days returns 0 working days")
        void weekendOnlyRange_returnsZero() {
            // 2024-01-13 (Sat) to 2024-01-14 (Sun)
            LocalDate start = LocalDate.of(2024, 1, 13);
            LocalDate end = LocalDate.of(2024, 1, 14);

            assertThat(calculator.calculateWorkingDays(start, end)).isEqualTo(0L);
        }

        @Test
        @DisplayName("A single Saturday returns 0 working days")
        void singleSaturday_returnsZero() {
            LocalDate saturday = LocalDate.of(2024, 1, 13);

            assertThat(calculator.calculateWorkingDays(saturday, saturday)).isEqualTo(0L);
        }

        @Test
        @DisplayName("A single weekday returns 1 working day")
        void singleWeekday_returnsOne() {
            LocalDate monday = LocalDate.of(2024, 1, 8);

            assertThat(calculator.calculateWorkingDays(monday, monday)).isEqualTo(1L);
        }
    }

    // ── Requirement 17.2: Public holidays excluded ───────────────────────────

    @Nested
    @DisplayName("Public holiday exclusion (Req 17.2)")
    class PublicHolidayExclusion {

        @Test
        @DisplayName("A weekday that is a public holiday is excluded from the count")
        void weekdayPublicHoliday_isExcluded() {
            // 2024-01-08 (Mon) to 2024-01-12 (Fri), holiday on Wednesday
            LocalDate start = LocalDate.of(2024, 1, 8);
            LocalDate end = LocalDate.of(2024, 1, 12);
            LocalDate holiday = LocalDate.of(2024, 1, 10); // Wednesday

            when(publicHolidayRepository.findByHolidayDateBetweenOrderByHolidayDateAsc(start, end))
                    .thenReturn(List.of(buildHoliday(holiday, "New Year Observed")));

            // 5 weekdays minus 1 holiday = 4
            assertThat(calculator.calculateWorkingDays(start, end)).isEqualTo(4L);
        }

        @Test
        @DisplayName("Multiple public holidays in range are all excluded")
        void multiplePublicHolidays_allExcluded() {
            // 2024-01-08 (Mon) to 2024-01-12 (Fri), holidays on Mon and Fri
            LocalDate start = LocalDate.of(2024, 1, 8);
            LocalDate end = LocalDate.of(2024, 1, 12);

            when(publicHolidayRepository.findByHolidayDateBetweenOrderByHolidayDateAsc(start, end))
                    .thenReturn(List.of(
                            buildHoliday(LocalDate.of(2024, 1, 8), "Holiday A"),
                            buildHoliday(LocalDate.of(2024, 1, 12), "Holiday B")
                    ));

            // 5 weekdays minus 2 holidays = 3
            assertThat(calculator.calculateWorkingDays(start, end)).isEqualTo(3L);
        }

        @Test
        @DisplayName("A public holiday falling on a weekend is not double-counted")
        void publicHolidayOnWeekend_notDoubleExcluded() {
            // 2024-01-08 (Mon) to 2024-01-14 (Sun), holiday on Saturday
            LocalDate start = LocalDate.of(2024, 1, 8);
            LocalDate end = LocalDate.of(2024, 1, 14);

            when(publicHolidayRepository.findByHolidayDateBetweenOrderByHolidayDateAsc(start, end))
                    .thenReturn(List.of(buildHoliday(LocalDate.of(2024, 1, 13), "Weekend Holiday")));

            // 5 weekdays, weekend holiday doesn't reduce further
            assertThat(calculator.calculateWorkingDays(start, end)).isEqualTo(5L);
        }

        @Test
        @DisplayName("Empty holiday list returns full weekday count")
        void emptyHolidayList_returnsFullWeekdayCount() {
            LocalDate start = LocalDate.of(2024, 1, 8);
            LocalDate end = LocalDate.of(2024, 1, 12);

            // setUp already stubs empty list
            assertThat(calculator.calculateWorkingDays(start, end)).isEqualTo(5L);
        }
    }

    // ── Combined: weekends AND public holidays excluded ──────────────────────

    @Nested
    @DisplayName("Combined weekend and public holiday exclusion (Req 17.2, 17.3)")
    class CombinedExclusion {

        @Test
        @DisplayName("A two-week range with weekends and holidays returns correct count")
        void twoWeekRange_weekendsAndHolidaysExcluded() {
            // 2024-01-08 (Mon) to 2024-01-19 (Fri) = 10 weekdays
            // Holidays: 2024-01-09 (Tue) and 2024-01-15 (Mon)
            LocalDate start = LocalDate.of(2024, 1, 8);
            LocalDate end = LocalDate.of(2024, 1, 19);

            when(publicHolidayRepository.findByHolidayDateBetweenOrderByHolidayDateAsc(start, end))
                    .thenReturn(List.of(
                            buildHoliday(LocalDate.of(2024, 1, 9), "Holiday A"),
                            buildHoliday(LocalDate.of(2024, 1, 15), "Holiday B")
                    ));

            // 10 weekdays - 2 holidays = 8
            assertThat(calculator.calculateWorkingDays(start, end)).isEqualTo(8L);
        }

        @Test
        @DisplayName("Start date after end date returns 0")
        void startAfterEnd_returnsZero() {
            LocalDate start = LocalDate.of(2024, 1, 12);
            LocalDate end = LocalDate.of(2024, 1, 8);

            assertThat(calculator.calculateWorkingDays(start, end)).isEqualTo(0L);
        }

        @Test
        @DisplayName("Null start date throws IllegalArgumentException")
        void nullStartDate_throwsIllegalArgumentException() {
            assertThatThrownBy(() -> calculator.calculateWorkingDays(null, LocalDate.of(2024, 1, 12)))
                    .isInstanceOf(IllegalArgumentException.class);
        }

        @Test
        @DisplayName("Null end date throws IllegalArgumentException")
        void nullEndDate_throwsIllegalArgumentException() {
            assertThatThrownBy(() -> calculator.calculateWorkingDays(LocalDate.of(2024, 1, 8), null))
                    .isInstanceOf(IllegalArgumentException.class);
        }
    }

    // ── isWorkingDay helper tests ─────────────────────────────────────────────

    @Nested
    @DisplayName("isWorkingDay helper")
    class IsWorkingDay {

        @Test
        @DisplayName("Monday with no holidays is a working day")
        void monday_noHolidays_isWorkingDay() {
            assertThat(calculator.isWorkingDay(LocalDate.of(2024, 1, 8), Set.of())).isTrue();
        }

        @Test
        @DisplayName("Saturday is not a working day")
        void saturday_isNotWorkingDay() {
            assertThat(calculator.isWorkingDay(LocalDate.of(2024, 1, 13), Set.of())).isFalse();
        }

        @Test
        @DisplayName("Sunday is not a working day")
        void sunday_isNotWorkingDay() {
            assertThat(calculator.isWorkingDay(LocalDate.of(2024, 1, 14), Set.of())).isFalse();
        }

        @Test
        @DisplayName("A weekday in the holiday set is not a working day")
        void weekdayInHolidaySet_isNotWorkingDay() {
            LocalDate wednesday = LocalDate.of(2024, 1, 10);
            assertThat(calculator.isWorkingDay(wednesday, Set.of(wednesday))).isFalse();
        }
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private PublicHoliday buildHoliday(LocalDate date, String name) {
        return PublicHoliday.builder()
                .id(null)
                .holidayDate(date)
                .name(name)
                .build();
    }
}
