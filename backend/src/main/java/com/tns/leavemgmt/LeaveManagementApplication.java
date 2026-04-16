package com.tns.leavemgmt;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.domain.EntityScan;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;

@SpringBootApplication
@EntityScan("com.tns.leavemgmt.entity")
@EnableJpaRepositories(basePackages = {
    "com.tns.leavemgmt.repository",
    "com.tns.leavemgmt.user.repository",
    "com.tns.leavemgmt.leave.repository",
    "com.tns.leavemgmt.audit.repository"
})
public class LeaveManagementApplication {

    public static void main(String[] args) {
        SpringApplication.run(LeaveManagementApplication.class, args);
    }
}
