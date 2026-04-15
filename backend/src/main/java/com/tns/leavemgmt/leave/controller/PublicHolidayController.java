package com.tns.leavemgmt.leave.controller;

import com.tns.leavemgmt.leave.dto.CreatePublicHolidayRequest;
import com.tns.leavemgmt.leave.dto.PublicHolidayResponse;
import com.tns.leavemgmt.leave.service.PublicHolidayService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

/**
 * REST controller for public holiday management.
 * Admin endpoints require ADMINISTRATOR role (Requirements 17.1, 17.5).
 */
@RestController
public class PublicHolidayController {

    private final PublicHolidayService publicHolidayService;

    public PublicHolidayController(PublicHolidayService publicHolidayService) {
        this.publicHolidayService = publicHolidayService;
    }

    /** POST /api/admin/public-holidays — Create a public holiday (Req 17.1) */
    @PostMapping("/api/admin/public-holidays")
    @PreAuthorize("hasRole('ADMINISTRATOR')")
    public ResponseEntity<Map<String, PublicHolidayResponse>> createHoliday(
            @Valid @RequestBody CreatePublicHolidayRequest request) {
        PublicHolidayResponse holiday = publicHolidayService.createHoliday(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of("holiday", holiday));
    }

    /** POST /api/admin/public-holidays/import — Import public holidays from CSV (Req 17.5) */
    @PostMapping("/api/admin/public-holidays/import")
    @PreAuthorize("hasRole('ADMINISTRATOR')")
    public ResponseEntity<Map<String, Integer>> importHolidays(
            @RequestParam("file") MultipartFile file) {
        int importedCount = publicHolidayService.importFromCsv(file);
        return ResponseEntity.ok(Map.of("importedCount", importedCount));
    }

    /** GET /api/public-holidays — List public holidays for a given year (Req 17.1) */
    @GetMapping("/api/public-holidays")
    public ResponseEntity<Map<String, List<PublicHolidayResponse>>> getHolidays(
            @RequestParam(required = false) Integer year) {
        int targetYear = (year != null) ? year : LocalDate.now().getYear();
        List<PublicHolidayResponse> holidays = publicHolidayService.getAllHolidaysByYear(targetYear);
        return ResponseEntity.ok(Map.of("holidays", holidays));
    }
}
