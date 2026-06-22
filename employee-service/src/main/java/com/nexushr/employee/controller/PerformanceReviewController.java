package com.nexushr.employee.controller;

import com.nexushr.employee.model.PerformanceReview;
import com.nexushr.employee.service.PerformanceReviewService;
import com.nexushr.common.dto.ApiResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/performance")
public class PerformanceReviewController {

    @Autowired
    private PerformanceReviewService performanceReviewService;

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'ROLE_MANAGER')")
    public ResponseEntity<ApiResponse<PerformanceReview>> createReview(@RequestBody PerformanceReview review) {
        try {
            PerformanceReview created = performanceReviewService.createReview(review);
            return ResponseEntity.ok(ApiResponse.<PerformanceReview>builder()
                    .success(true)
                    .message("Performance review submitted successfully")
                    .data(created)
                    .build());
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.<PerformanceReview>builder()
                    .success(false)
                    .message(e.getMessage())
                    .build());
        }
    }

    @GetMapping("/employee/{employeeId}")
    public ResponseEntity<ApiResponse<List<PerformanceReview>>> getEmployeeReviews(@PathVariable Long employeeId) {
        List<PerformanceReview> list = performanceReviewService.getReviewsForEmployee(employeeId);
        return ResponseEntity.ok(ApiResponse.<List<PerformanceReview>>builder()
                .success(true)
                .message("Employee performance reviews retrieved successfully")
                .data(list)
                .build());
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'ROLE_MANAGER')")
    public ResponseEntity<ApiResponse<List<PerformanceReview>>> getAllReviews() {
        List<PerformanceReview> list = performanceReviewService.getAllReviews();
        return ResponseEntity.ok(ApiResponse.<List<PerformanceReview>>builder()
                .success(true)
                .message("All performance reviews retrieved successfully")
                .data(list)
                .build());
    }
}
