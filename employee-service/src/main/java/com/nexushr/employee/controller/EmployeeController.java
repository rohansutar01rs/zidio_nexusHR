package com.nexushr.employee.controller;

import com.nexushr.employee.model.Employee;
import com.nexushr.employee.service.EmployeeService;
import com.nexushr.common.dto.ApiResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/employees")
public class EmployeeController {

    @Autowired
    private EmployeeService employeeService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<Employee>>> getAllEmployees() {
        List<Employee> employees = employeeService.getAllEmployees();
        return ResponseEntity.ok(ApiResponse.<List<Employee>>builder()
                .success(true)
                .message("Employees retrieved successfully")
                .data(employees)
                .build());
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<Employee>> getEmployeeById(@PathVariable Long id) {
        Employee employee = employeeService.getEmployeeById(id);
        return ResponseEntity.ok(ApiResponse.<Employee>builder()
                .success(true)
                .message("Employee retrieved successfully")
                .data(employee)
                .build());
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<ApiResponse<Employee>> getEmployeeByUserId(@PathVariable Long userId) {
        Employee employee = employeeService.getEmployeeByUserId(userId);
        return ResponseEntity.ok(ApiResponse.<Employee>builder()
                .success(true)
                .message("Employee profile retrieved successfully")
                .data(employee)
                .build());
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Employee>> createEmployee(@RequestBody Employee employee) {
        try {
            Employee created = employeeService.createEmployee(employee);
            return ResponseEntity.ok(ApiResponse.<Employee>builder()
                    .success(true)
                    .message("Employee profile created successfully")
                    .data(created)
                    .build());
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(ApiResponse.<Employee>builder()
                    .success(false)
                    .message(e.getMessage())
                    .build());
        }
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'ROLE_MANAGER')")
    public ResponseEntity<ApiResponse<Employee>> updateEmployee(@PathVariable Long id, @RequestBody Employee employeeDetails) {
        Employee updated = employeeService.updateEmployee(id, employeeDetails);
        return ResponseEntity.ok(ApiResponse.<Employee>builder()
                .success(true)
                .message("Employee profile updated successfully")
                .data(updated)
                .build());
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deleteEmployee(@PathVariable Long id) {
        employeeService.deleteEmployee(id);
        return ResponseEntity.ok(ApiResponse.<Void>builder()
                .success(true)
                .message("Employee profile deleted successfully")
                .build());
    }
}
