package com.nexushr.employee.controller;

import com.nexushr.employee.service.AiInsightsService;
import com.nexushr.common.dto.ApiResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController
@RequestMapping("/ai-insights")
public class AiInsightsController {

    @Autowired
    private AiInsightsService aiInsightsService;

    @GetMapping("/employee/{employeeId}")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getEmployeeInsights(@PathVariable Long employeeId) {
        try {
            Map<String, Object> insights = aiInsightsService.getEmployeeAiDetails(employeeId);
            return ResponseEntity.ok(ApiResponse.<Map<String, Object>>builder()
                    .success(true)
                    .message("AI Workforce insights generated successfully")
                    .data(insights)
                    .build());
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.<Map<String, Object>>builder()
                    .success(false)
                    .message(e.getMessage())
                    .build());
        }
    }

    @GetMapping("/summary")
    @PreAuthorize("hasAnyRole('ADMIN', 'ROLE_MANAGER')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getGlobalSummary() {
        Map<String, Object> summary = aiInsightsService.getGlobalDashboardSummary();
        return ResponseEntity.ok(ApiResponse.<Map<String, Object>>builder()
                .success(true)
                .message("Global workforce AI summary generated successfully")
                .data(summary)
                .build());
    }

    @PostMapping("/simulate-run")
    public ResponseEntity<ApiResponse<Void>> triggerRecalculation() {
        aiInsightsService.recalculateAllInsights();
        return ResponseEntity.ok(ApiResponse.<Void>builder()
                .success(true)
                .message("AI engine calculations updated successfully")
                .build());
    }
}
