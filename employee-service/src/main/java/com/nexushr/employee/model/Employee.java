package com.nexushr.employee.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDate;

@Entity
@Table(name = "employees")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Employee {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false, unique = true)
    private String email;

    private String jobTitle;

    private Long departmentId;

    private Long managerId;

    private Long userId; // Links to Auth User ID if applicable

    @Builder.Default
    private String status = "ACTIVE"; // ACTIVE, ONBOARDING, OFFBOARDED

    private Double performanceRating;

    private String attritionRisk; // LOW, MEDIUM, HIGH

    private Integer engagementScore; // 1-100

    private LocalDate joinDate;

    @Column(length = 1000)
    private String skills; // Comma-separated list of skills
}
