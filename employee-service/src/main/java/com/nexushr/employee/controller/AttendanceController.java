package com.nexushr.employee.controller;

import com.nexushr.employee.model.Attendance;
import com.nexushr.employee.service.AttendanceService;
import com.nexushr.common.dto.ApiResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/attendance")
public class AttendanceController {

    @Autowired
    private AttendanceService attendanceService;

    @PostMapping("/check-in/{employeeId}")
    public ResponseEntity<ApiResponse<Attendance>> checkIn(@PathVariable Long employeeId) {
        try {
            Attendance attendance = attendanceService.checkIn(employeeId);
            return ResponseEntity.ok(ApiResponse.<Attendance>builder()
                    .success(true)
                    .message("Checked in successfully")
                    .data(attendance)
                    .build());
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.<Attendance>builder()
                    .success(false)
                    .message(e.getMessage())
                    .build());
        }
    }

    @PostMapping("/check-out/{employeeId}")
    public ResponseEntity<ApiResponse<Attendance>> checkOut(@PathVariable Long employeeId) {
        try {
            Attendance attendance = attendanceService.checkOut(employeeId);
            return ResponseEntity.ok(ApiResponse.<Attendance>builder()
                    .success(true)
                    .message("Checked out successfully")
                    .data(attendance)
                    .build());
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.<Attendance>builder()
                    .success(false)
                    .message(e.getMessage())
                    .build());
        }
    }

    @GetMapping("/employee/{employeeId}")
    public ResponseEntity<ApiResponse<List<Attendance>>> getEmployeeAttendance(@PathVariable Long employeeId) {
        List<Attendance> list = attendanceService.getAttendanceForEmployee(employeeId);
        return ResponseEntity.ok(ApiResponse.<List<Attendance>>builder()
                .success(true)
                .message("Employee attendance retrieved successfully")
                .data(list)
                .build());
    }

    @GetMapping("/today")
    @PreAuthorize("hasAnyRole('ADMIN', 'ROLE_MANAGER')")
    public ResponseEntity<ApiResponse<List<Attendance>>> getTodayAttendance() {
        List<Attendance> list = attendanceService.getTodayAttendance();
        return ResponseEntity.ok(ApiResponse.<List<Attendance>>builder()
                .success(true)
                .message("Today's attendance retrieved successfully")
                .data(list)
                .build());
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'ROLE_MANAGER')")
    public ResponseEntity<ApiResponse<List<Attendance>>> getAllAttendance() {
        List<Attendance> list = attendanceService.getAllAttendance();
        return ResponseEntity.ok(ApiResponse.<List<Attendance>>builder()
                .success(true)
                .message("All attendance retrieved successfully")
                .data(list)
                .build());
    }
}
