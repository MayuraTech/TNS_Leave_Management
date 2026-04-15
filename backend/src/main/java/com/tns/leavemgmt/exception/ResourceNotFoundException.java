package com.tns.leavemgmt.exception;

public class ResourceNotFoundException extends RuntimeException {

    public ResourceNotFoundException(String message) {
        super(message);
    }

    public static ResourceNotFoundException forUser(Long userId) {
        return new ResourceNotFoundException("User not found with id: " + userId);
    }

    public static ResourceNotFoundException forRole(String roleName) {
        return new ResourceNotFoundException("Role not found: " + roleName);
    }

    public static ResourceNotFoundException forDepartment(Long departmentId) {
        return new ResourceNotFoundException("Department not found with id: " + departmentId);
    }

    public static ResourceNotFoundException forTeam(Long teamId) {
        return new ResourceNotFoundException("Team not found with id: " + teamId);
    }
}
