package com.tns.leavemgmt.leave.service;

import com.tns.leavemgmt.exception.ResourceNotFoundException;
import com.tns.leavemgmt.leave.dto.CreatePublicHolidayRequest;
import com.tns.leavemgmt.leave.dto.PublicHolidayResponse;
import com.tns.leavemgmt.entity.PublicHoliday;
import com.tns.leavemgmt.leave.repository.PublicHolidayRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
public class PublicHolidayService {

    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd");

    private final PublicHolidayRepository publicHolidayRepository;

    public PublicHolidayService(PublicHolidayRepository publicHolidayRepository) {
        this.publicHolidayRepository = publicHolidayRepository;
    }

    @Transactional
    public PublicHolidayResponse createHoliday(CreatePublicHolidayRequest request) {
        if (publicHolidayRepository.existsByHolidayDate(request.getDate())) {
            throw new IllegalArgumentException(
                    "A public holiday already exists on date: " + request.getDate());
        }

        PublicHoliday holiday = PublicHoliday.builder()
                .holidayDate(request.getDate())
                .name(request.getName())
                .build();

        holiday = publicHolidayRepository.save(holiday);
        log.info("Created public holiday: date={}, name={}", holiday.getHolidayDate(), holiday.getName());

        return toResponse(holiday);
    }

    @Transactional(readOnly = true)
    public List<PublicHolidayResponse> getAllHolidaysByYear(int year) {
        LocalDate start = LocalDate.of(year, 1, 1);
        LocalDate end = LocalDate.of(year, 12, 31);
        return publicHolidayRepository.findByHolidayDateBetweenOrderByHolidayDateAsc(start, end)
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public PublicHolidayResponse getHolidayById(Long id) {
        PublicHoliday holiday = publicHolidayRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Public holiday not found with id: " + id));
        return toResponse(holiday);
    }

    @Transactional
    public PublicHolidayResponse updateHoliday(Long id, CreatePublicHolidayRequest request) {
        PublicHoliday holiday = publicHolidayRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Public holiday not found with id: " + id));

        if (!holiday.getHolidayDate().equals(request.getDate())
                && publicHolidayRepository.existsByHolidayDate(request.getDate())) {
            throw new IllegalArgumentException(
                    "A public holiday already exists on date: " + request.getDate());
        }

        holiday.setHolidayDate(request.getDate());
        holiday.setName(request.getName());
        holiday = publicHolidayRepository.save(holiday);
        log.info("Updated public holiday: id={}", id);

        return toResponse(holiday);
    }

    @Transactional
    public void deleteHoliday(Long id) {
        if (!publicHolidayRepository.existsById(id)) {
            throw new ResourceNotFoundException("Public holiday not found with id: " + id);
        }
        publicHolidayRepository.deleteById(id);
        log.info("Deleted public holiday: id={}", id);
    }

    @Transactional
    public int importFromCsv(MultipartFile file) {
        if (file.isEmpty()) {
            throw new IllegalArgumentException("CSV file is empty");
        }

        List<PublicHoliday> toSave = new ArrayList<>();

        try (BufferedReader reader = new BufferedReader(new InputStreamReader(file.getInputStream()))) {
            String line;
            boolean firstLine = true;

            while ((line = reader.readLine()) != null) {
                line = line.trim();
                if (line.isEmpty()) {
                    continue;
                }
                // Skip header row if present
                if (firstLine) {
                    firstLine = false;
                    if (line.toLowerCase().startsWith("date")) {
                        continue;
                    }
                }

                String[] parts = line.split(",", 2);
                if (parts.length < 2) {
                    log.warn("Skipping invalid CSV row: {}", line);
                    continue;
                }

                String dateStr = parts[0].trim();
                String name = parts[1].trim();

                if (dateStr.isEmpty() || name.isEmpty()) {
                    log.warn("Skipping row with empty date or name: {}", line);
                    continue;
                }

                try {
                    LocalDate date = LocalDate.parse(dateStr, DATE_FORMATTER);
                    if (!publicHolidayRepository.existsByHolidayDate(date)) {
                        toSave.add(PublicHoliday.builder()
                                .holidayDate(date)
                                .name(name)
                                .build());
                    } else {
                        log.info("Skipping duplicate holiday date: {}", date);
                    }
                } catch (DateTimeParseException e) {
                    log.warn("Skipping row with invalid date format '{}': {}", dateStr, line);
                }
            }
        } catch (IOException e) {
            throw new RuntimeException("Failed to read CSV file: " + e.getMessage(), e);
        }

        List<PublicHoliday> saved = publicHolidayRepository.saveAll(toSave);
        log.info("Imported {} public holidays from CSV", saved.size());
        return saved.size();
    }

    PublicHolidayResponse toResponse(PublicHoliday holiday) {
        return PublicHolidayResponse.builder()
                .id(holiday.getId())
                .date(holiday.getHolidayDate())
                .name(holiday.getName())
                .createdAt(holiday.getCreatedAt())
                .build();
    }
}
