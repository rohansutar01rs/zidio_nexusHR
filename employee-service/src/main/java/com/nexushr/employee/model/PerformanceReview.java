package com.nexushr.employee.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDate;

@Entity
@Table(name = "performance_reviews")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PerformanceReview {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long employeeId;

    @Column(nullable = false)
    private Long reviewerId; // Manager's user/employee ID

    private LocalDate reviewDate;

    @Column(length = 2000)
    private String goals;

    private Double rating; // 1.0 to 5.0

    @Column(length = 2000)
    private String feedback;
}
