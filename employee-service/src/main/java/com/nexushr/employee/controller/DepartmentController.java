package com.nexushr.employee.controller;

import com.nexushr.employee.model.Department;
import com.nexushr.employee.service.DepartmentService;
import com.nexushr.common.dto.ApiResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/departments")
public class DepartmentController {

    @Autowired
    private DepartmentService departmentService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<Department>>> getAllDepartments() {
        List<Department> departments = departmentService.getAllDepartments();
        return ResponseEntity.ok(ApiResponse.<List<Department>>builder()
                .success(true)
                .message("Departments retrieved successfully")
                .data(departments)
                .build());
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<Department>> getDepartmentById(@PathVariable Long id) {
        Department department = departmentService.getDepartmentById(id);
        return ResponseEntity.ok(ApiResponse.<Department>builder()
                .success(true)
                .message("Department retrieved successfully")
                .data(department)
                .build());
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Department>> createDepartment(@RequestBody Department department) {
        try {
            Department created = departmentService.createDepartment(department);
            return ResponseEntity.ok(ApiResponse.<Department>builder()
                    .success(true)
                    .message("Department created successfully")
                    .data(created)
                    .build());
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(ApiResponse.<Department>builder()
                    .success(false)
                    .message(e.getMessage())
                    .build());
        }
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Department>> updateDepartment(@PathVariable Long id, @RequestBody Department details) {
        Department updated = departmentService.updateDepartment(id, details);
        return ResponseEntity.ok(ApiResponse.<Department>builder()
                .success(true)
                .message("Department updated successfully")
                .data(updated)
                .build());
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deleteDepartment(@PathVariable Long id) {
        departmentService.deleteDepartment(id);
        return ResponseEntity.ok(ApiResponse.<Void>builder()
                .success(true)
                .message("Department deleted successfully")
                .build());
    }
}
