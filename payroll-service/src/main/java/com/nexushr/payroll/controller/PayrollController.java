package com.nexushr.payroll.controller;

import com.nexushr.payroll.model.Payslip;
import com.nexushr.payroll.model.SalaryConfig;
import com.nexushr.payroll.service.PayrollService;
import com.nexushr.common.dto.ApiResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/payroll")
public class PayrollController {

    @Autowired
    private PayrollService payrollService;

    @GetMapping("/config/{employeeId}")
    public ResponseEntity<ApiResponse<SalaryConfig>> getSalaryConfig(@PathVariable Long employeeId) {
        try {
            SalaryConfig config = payrollService.getSalaryConfigByEmployeeId(employeeId);
            return ResponseEntity.ok(ApiResponse.<SalaryConfig>builder()
                    .success(true)
                    .message("Salary configuration retrieved successfully")
                    .data(config)
                    .build());
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.<SalaryConfig>builder()
                    .success(false)
                    .message(e.getMessage())
                    .build());
        }
    }

    @PostMapping("/config")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<SalaryConfig>> updateSalaryConfig(@RequestBody SalaryConfig config) {
        SalaryConfig updated = payrollService.saveOrUpdateSalaryConfig(config);
        return ResponseEntity.ok(ApiResponse.<SalaryConfig>builder()
                .success(true)
                .message("Salary configuration saved successfully")
                .data(updated)
                .build());
    }

    @PostMapping("/run")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<List<Payslip>>> runPayroll(@RequestBody Map<String, String> requestBody) {
        String payPeriod = requestBody.get("payPeriod");
        if (payPeriod == null) {
            return ResponseEntity.badRequest().body(ApiResponse.<List<Payslip>>builder()
                    .success(false)
                    .message("payPeriod is required")
                    .build());
        }
        List<Payslip> list = payrollService.runPayrollForAll(payPeriod);
        return ResponseEntity.ok(ApiResponse.<List<Payslip>>builder()
                .success(true)
                .message("Payroll executed successfully for all active employees")
                .data(list)
                .build());
    }

    @PostMapping("/run/employee/{employeeId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Payslip>> runPayrollForEmployee(@PathVariable Long employeeId, @RequestBody Map<String, String> requestBody) {
        String payPeriod = requestBody.get("payPeriod");
        if (payPeriod == null) {
            return ResponseEntity.badRequest().body(ApiResponse.<Payslip>builder()
                    .success(false)
                    .message("payPeriod is required")
                    .build());
        }
        try {
            Payslip payslip = payrollService.runPayrollForEmployee(employeeId, payPeriod);
            return ResponseEntity.ok(ApiResponse.<Payslip>builder()
                    .success(true)
                    .message("Payroll executed successfully for employee: " + employeeId)
                    .data(payslip)
                    .build());
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.<Payslip>builder()
                    .success(false)
                    .message(e.getMessage())
                    .build());
        }
    }
}
