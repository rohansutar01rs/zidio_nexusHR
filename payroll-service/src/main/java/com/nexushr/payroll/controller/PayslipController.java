package com.nexushr.payroll.controller;

import com.nexushr.payroll.model.Payslip;
import com.nexushr.payroll.service.PayrollService;
import com.nexushr.common.dto.ApiResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/payslips")
public class PayslipController {

    @Autowired
    private PayrollService payrollService;

    @GetMapping("/employee/{employeeId}")
    public ResponseEntity<ApiResponse<List<Payslip>>> getEmployeePayslips(@PathVariable Long employeeId) {
        List<Payslip> list = payrollService.getPayslipsForEmployee(employeeId);
        return ResponseEntity.ok(ApiResponse.<List<Payslip>>builder()
                .success(true)
                .message("Employee payslips retrieved successfully")
                .data(list)
                .build());
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'ROLE_MANAGER')")
    public ResponseEntity<ApiResponse<List<Payslip>>> getAllPayslips() {
        List<Payslip> list = payrollService.getAllPayslips();
        return ResponseEntity.ok(ApiResponse.<List<Payslip>>builder()
                .success(true)
                .message("All payslips retrieved successfully")
                .data(list)
                .build());
    }
}
