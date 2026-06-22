package com.nexushr.payroll.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "salary_configs")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SalaryConfig {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private Long employeeId;

    private Double baseSalary;

    private Double allowances; // Housing, Travel, etc.

    private Double deductions; // Insurance, Provident Fund, etc.

    private Double taxRate; // e.g. 0.15 for 15%
}
