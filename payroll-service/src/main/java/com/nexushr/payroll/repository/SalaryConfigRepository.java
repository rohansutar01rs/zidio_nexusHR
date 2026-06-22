package com.nexushr.payroll.repository;

import com.nexushr.payroll.model.SalaryConfig;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface SalaryConfigRepository extends JpaRepository<SalaryConfig, Long> {
    Optional<SalaryConfig> findByEmployeeId(Long employeeId);
}
