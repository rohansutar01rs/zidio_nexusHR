package com.nexushr.employee.controller;

import com.nexushr.employee.model.LeaveRequest;
import com.nexushr.employee.service.LeaveRequestService;
import com.nexushr.common.enums.LeaveStatus;
import com.nexushr.common.dto.ApiResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/leaves")
public class LeaveRequestController {

    @Autowired
    private LeaveRequestService leaveRequestService;

    @PostMapping
    public ResponseEntity<ApiResponse<LeaveRequest>> applyLeave(@RequestBody LeaveRequest request) {
        try {
            LeaveRequest created = leaveRequestService.applyLeave(request);
            return ResponseEntity.ok(ApiResponse.<LeaveRequest>builder()
                    .success(true)
                    .message("Leave request submitted successfully")
                    .data(created)
                    .build());
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.<LeaveRequest>builder()
                    .success(false)
                    .message(e.getMessage())
                    .build());
        }
    }

    @PutMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('ADMIN', 'ROLE_MANAGER')")
    public ResponseEntity<ApiResponse<LeaveRequest>> updateLeaveStatus(@PathVariable Long id, @RequestBody Map<String, String> requestBody) {
        String statusStr = requestBody.get("status");
        if (statusStr == null) {
            return ResponseEntity.badRequest().body(ApiResponse.<LeaveRequest>builder()
                    .success(false)
                    .message("Status is required")
                    .build());
        }
        try {
            LeaveStatus status = LeaveStatus.valueOf(statusStr.toUpperCase());
            LeaveRequest updated = leaveRequestService.updateLeaveStatus(id, status);
            return ResponseEntity.ok(ApiResponse.<LeaveRequest>builder()
                    .success(true)
                    .message("Leave request status updated successfully")
                    .data(updated)
                    .build());
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(ApiResponse.<LeaveRequest>builder()
                    .success(false)
                    .message("Invalid status value: " + statusStr)
                    .build());
        }
    }

    @GetMapping("/employee/{employeeId}")
    public ResponseEntity<ApiResponse<List<LeaveRequest>>> getEmployeeLeaves(@PathVariable Long employeeId) {
        List<LeaveRequest> list = leaveRequestService.getLeavesForEmployee(employeeId);
        return ResponseEntity.ok(ApiResponse.<List<LeaveRequest>>builder()
                .success(true)
                .message("Employee leave requests retrieved successfully")
                .data(list)
                .build());
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'ROLE_MANAGER')")
    public ResponseEntity<ApiResponse<List<LeaveRequest>>> getAllLeaves() {
        List<LeaveRequest> list = leaveRequestService.getAllLeaves();
        return ResponseEntity.ok(ApiResponse.<List<LeaveRequest>>builder()
                .success(true)
                .message("All leave requests retrieved successfully")
                .data(list)
                .build());
    }
}
