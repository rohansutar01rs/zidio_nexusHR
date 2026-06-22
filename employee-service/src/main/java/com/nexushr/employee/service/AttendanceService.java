package com.nexushr.employee.service;

import com.nexushr.employee.model.Attendance;
import com.nexushr.employee.model.Employee;
import com.nexushr.employee.repository.AttendanceRepository;
import com.nexushr.employee.repository.EmployeeRepository;
import com.nexushr.common.exception.ResourceNotFoundException;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;

@Service
public class AttendanceService {

    @Autowired
    private AttendanceRepository attendanceRepository;

    @Autowired
    private EmployeeRepository employeeRepository;

    @PostConstruct
    public void seedAttendance() {
        // Let's wait for employees to be seeded
        // We'll run a quick checks
        if (attendanceRepository.count() == 0) {
            LocalDate today = LocalDate.now();
            List<Employee> employees = employeeRepository.findAll();
            for (Employee emp : employees) {
                // Seed last 5 days of attendance
                for (int i = 5; i >= 1; i--) {
                    LocalDate date = today.minusDays(i);
                    // skip weekends
                    if (date.getDayOfWeek().getValue() >= 6) continue;

                    // Seed some on-time, some late, some absent
                    LocalDateTime checkIn;
                    LocalDateTime checkOut;
                    String status;

                    if (emp.getName().contains("Jane") && i == 2) {
                        // Jane was late 2 days ago
                        checkIn = LocalDateTime.of(date, LocalTime.of(9, 45));
                        checkOut = LocalDateTime.of(date, LocalTime.of(18, 0));
                        status = "LATE";
                    } else if (emp.getName().contains("Jane") && i == 4) {
                        // Jane was absent 4 days ago
                        status = "ABSENT";
                        checkIn = null;
                        checkOut = null;
                    } else {
                        // Normal present
                        checkIn = LocalDateTime.of(date, LocalTime.of(8, 50));
                        checkOut = LocalDateTime.of(date, LocalTime.of(17, 30));
                        status = "PRESENT";
                    }

                    attendanceRepository.save(Attendance.builder()
                            .employeeId(emp.getId())
                            .date(date)
                            .checkInTime(checkIn)
                            .checkOutTime(checkOut)
                            .status(status)
                            .build());
                }
            }
        }
    }

    public Attendance checkIn(Long employeeId) {
        employeeRepository.findById(employeeId)
                .orElseThrow(() -> new ResourceNotFoundException("Employee not found with id: " + employeeId));

        LocalDate today = LocalDate.now();
        Optional<Attendance> existing = attendanceRepository.findByEmployeeIdAndDate(employeeId, today);
        if (existing.isPresent()) {
            throw new IllegalArgumentException("Employee already checked in for today");
        }

        LocalDateTime now = LocalDateTime.now();
        String status = now.toLocalTime().isAfter(LocalTime.of(9, 0)) ? "LATE" : "PRESENT";

        Attendance attendance = Attendance.builder()
                .employeeId(employeeId)
                .date(today)
                .checkInTime(now)
                .status(status)
                .build();

        return attendanceRepository.save(attendance);
    }

    public Attendance checkOut(Long employeeId) {
        LocalDate today = LocalDate.now();
        Attendance attendance = attendanceRepository.findByEmployeeIdAndDate(employeeId, today)
                .orElseThrow(() -> new IllegalArgumentException("No check-in record found for today"));

        if (attendance.getCheckOutTime() != null) {
            throw new IllegalArgumentException("Employee already checked out for today");
        }

        attendance.setCheckOutTime(LocalDateTime.now());
        return attendanceRepository.save(attendance);
    }

    public List<Attendance> getAttendanceForEmployee(Long employeeId) {
        return attendanceRepository.findByEmployeeId(employeeId);
    }

    public List<Attendance> getTodayAttendance() {
        return attendanceRepository.findByDate(LocalDate.now());
    }

    public List<Attendance> getAllAttendance() {
        return attendanceRepository.findAll();
    }
}
