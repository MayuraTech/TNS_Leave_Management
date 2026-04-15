package com.tns.leavemgmt.user.controller;

import com.tns.leavemgmt.user.dto.CreateDepartmentRequest;
import com.tns.leavemgmt.user.dto.DepartmentResponse;
import com.tns.leavemgmt.user.dto.UpdateDepartmentRequest;
import com.tns.leavemgmt.entity.User;
import com.tns.leavemgmt.user.repository.UserRepository;
import com.tns.leavemgmt.user.service.DepartmentService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST controller for department CRUD operations.
 * All endpoints require ADMINISTRATOR role (Requirement 4.1).
 */
@RestController
@RequestMapping("/api/admin/departments")
@PreAuthorize("hasRole('ADMINISTRATOR')")
public class DepartmentController {

    private final DepartmentService departmentService;
    private final UserRepository userRepository;

    public DepartmentController(DepartmentService departmentService,
                                UserRepository userRepository) {
        this.departmentService = departmentService;
        this.userRepository = userRepository;
    }

    /** POST /api/admin/departments — Create a new department (Req 4.1) */
    @PostMapping
    public ResponseEntity<DepartmentResponse> createDepartment(
            @Valid @RequestBody CreateDepartmentRequest request,
            @AuthenticationPrincipal UserDetails principal) {
        User admin = resolveUser(principal);
        DepartmentResponse response = departmentService.createDepartment(request, admin);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /** GET /api/admin/departments — List all departments */
    @GetMapping
    public ResponseEntity<List<DepartmentResponse>> getAllDepartments() {
        return ResponseEntity.ok(departmentService.getAllDepartments());
    }

    /** PUT /api/admin/departments/{id} — Update a department */
    @PutMapping("/{id}")
    public ResponseEntity<DepartmentResponse> updateDepartment(
            @PathVariable Long id,
            @Valid @RequestBody UpdateDepartmentRequest request,
            @AuthenticationPrincipal UserDetails principal) {
        User admin = resolveUser(principal);
        DepartmentResponse response = departmentService.updateDepartment(id, request, admin);
        return ResponseEntity.ok(response);
    }

    /** DELETE /api/admin/departments/{id} — Delete a department */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteDepartment(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails principal) {
        User admin = resolveUser(principal);
        departmentService.deleteDepartment(id, admin);
        return ResponseEntity.noContent().build();
    }

    private User resolveUser(UserDetails principal) {
        return userRepository.findByUsername(principal.getUsername())
                .orElseThrow(() -> new IllegalStateException("Authenticated user not found: " + principal.getUsername()));
    }
}
