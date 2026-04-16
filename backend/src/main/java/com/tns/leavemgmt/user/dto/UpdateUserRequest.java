package com.tns.leavemgmt.user.dto;

import jakarta.validation.constraints.Email;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Set;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateUserRequest {

    private String username;

    @Email
    private String email;

    private String firstName;
    private String lastName;
    private String phone;
    private String emergencyContact;
    private String address;
    private Long departmentId;
    private Long managerId;
    private Set<String> roles;
}
