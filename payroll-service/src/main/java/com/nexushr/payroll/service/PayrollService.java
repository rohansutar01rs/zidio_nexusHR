package com.nexushr.payroll.service;

import com.nexushr.payroll.model.Payslip;
import com.nexushr.payroll.model.SalaryConfig;
import com.nexushr.payroll.repository.PayslipRepository;
import com.nexushr.payroll.repository.SalaryConfigRepository;
import com.nexushr.common.exception.ResourceNotFoundException;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Service
public class PayrollService {

    @Autowired
    private SalaryConfigRepository salaryConfigRepository;

    @Autowired
    private PayslipRepository payslipRepository;

    @PostConstruct
    public void seedSalaryConfigsAndPayslips() {
        if (salaryConfigRepository.count() == 0) {
            // Seed configs for employee IDs 1, 2, 3, 4
            salaryConfigRepository.save(SalaryConfig.builder()
                    .employeeId(1L)
                    .baseSalary(9500.0)
                    .allowances(1500.0)
                    .deductions(600.0)
                    .taxRate(0.20)
                    .build());

            salaryConfigRepository.save(SalaryConfig.builder()
                    .employeeId(2L)
                    .baseSalary(8500.0)
                    .allowances(1200.0)
                    .deductions(500.0)
                    .taxRate(0.18)
                    .build());

            salaryConfigRepository.save(SalaryConfig.builder()
                    .employeeId(3L)
                    .baseSalary(6200.0)
                    .allowances(800.0)
                    .deductions(300.0)
                    .taxRate(0.15)
                    .build());

            salaryConfigRepository.save(SalaryConfig.builder()
                    .employeeId(4L)
                    .baseSalary(3800.0)
                    .allowances(400.0)
                    .deductions(200.0)
                    .taxRate(0.10)
                    .build());
            
            // Seed a past payslip for John and Jane
            runPayrollForEmployee(3L, "May 2026");
            runPayrollForEmployee(4L, "May 2026");
        }
    }

    public List<Payslip> runPayrollForAll(String payPeriod) {
        List<SalaryConfig> configs = salaryConfigRepository.findAll();
        List<Payslip> processedPayslips = new ArrayList<>();

        for (SalaryConfig config : configs) {
            processedPayslips.add(runPayrollForConfig(config, payPeriod));
        }

        return processedPayslips;
    }

    public Payslip runPayrollForEmployee(Long employeeId, String payPeriod) {
        SalaryConfig config = salaryConfigRepository.findByEmployeeId(employeeId)
                .orElseThrow(() -> new ResourceNotFoundException("Salary configuration not found for employee: " + employeeId));
        return runPayrollForConfig(config, payPeriod);
    }

    private Payslip runPayrollForConfig(SalaryConfig config, String payPeriod) {
        double grossPay = config.getBaseSalary() + config.getAllowances();
        double tax = grossPay * config.getTaxRate();
        double netSalary = grossPay - config.getDeductions() - tax;

        Payslip payslip = Payslip.builder()
                .employeeId(config.getEmployeeId())
                .payPeriod(payPeriod)
                .baseSalary(config.getBaseSalary())
                .allowances(config.getAllowances())
                .deductions(config.getDeductions())
                .tax(tax)
                .netSalary(netSalary)
                .status("PAID")
                .processedDate(LocalDate.now())
                .build();

        return payslipRepository.save(payslip);
    }

    public SalaryConfig getSalaryConfigByEmployeeId(Long employeeId) {
        return salaryConfigRepository.findByEmployeeId(employeeId)
                .orElseThrow(() -> new ResourceNotFoundException("Salary configuration not found for employee: " + employeeId));
    }

    public SalaryConfig saveOrUpdateSalaryConfig(SalaryConfig config) {
        return salaryConfigRepository.findByEmployeeId(config.getEmployeeId())
                .map(existing -> {
                    existing.setBaseSalary(config.getBaseSalary());
                    existing.setAllowances(config.getAllowances());
                    existing.setDeductions(config.getDeductions());
                    existing.setTaxRate(config.getTaxRate());
                    return salaryConfigRepository.save(existing);
                })
                .orElseGet(() -> salaryConfigRepository.save(config));
    }

    public List<Payslip> getPayslipsForEmployee(Long employeeId) {
        return payslipRepository.findByEmployeeId(employeeId);
    }

    public List<Payslip> getAllPayslips() {
        return payslipRepository.findAll();
    }
}
