package com.nexushr.payroll.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDate;

@Entity
@Table(name = "payslips")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Payslip {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long employeeId;

    @Column(nullable = false)
    private String payPeriod; // E.g., "June 2026"

    private Double baseSalary;

    private Double allowances;

    private Double deductions;

    private Double tax;

    private Double netSalary;

    @Builder.Default
    private String status = "PAID"; // PAID, PENDING

    private LocalDate processedDate;
}
