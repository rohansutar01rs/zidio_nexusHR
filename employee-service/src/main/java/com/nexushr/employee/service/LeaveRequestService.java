package com.nexushr.employee.service;

import com.nexushr.employee.model.LeaveRequest;
import com.nexushr.employee.model.Employee;
import com.nexushr.employee.repository.LeaveRequestRepository;
import com.nexushr.employee.repository.EmployeeRepository;
import com.nexushr.common.enums.LeaveStatus;
import com.nexushr.common.exception.ResourceNotFoundException;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.time.LocalDate;
import java.util.List;

@Service
public class LeaveRequestService {

    @Autowired
    private LeaveRequestRepository leaveRequestRepository;

    @Autowired
    private EmployeeRepository employeeRepository;

    @PostConstruct
    public void seedLeaves() {
        if (leaveRequestRepository.count() == 0) {
            List<Employee> employees = employeeRepository.findAll();
            if (!employees.isEmpty()) {
                // John Doe applied for leave
                Employee john = employees.stream()
                        .filter(e -> e.getName().contains("John"))
                        .findFirst()
                        .orElse(employees.get(0));

                leaveRequestRepository.save(LeaveRequest.builder()
                        .employeeId(john.getId())
                        .startDate(LocalDate.now().plusDays(5))
                        .endDate(LocalDate.now().plusDays(7))
                        .leaveType("CASUAL")
                        .status(LeaveStatus.PENDING)
                        .reason("Family event")
                        .build());

                // Jane Smith has an approved leave in the past
                Employee jane = employees.stream()
                        .filter(e -> e.getName().contains("Jane"))
                        .findFirst()
                        .orElse(employees.get(0));

                leaveRequestRepository.save(LeaveRequest.builder()
                        .employeeId(jane.getId())
                        .startDate(LocalDate.now().minusDays(10))
                        .endDate(LocalDate.now().minusDays(9))
                        .leaveType("SICK")
                        .status(LeaveStatus.APPROVED)
                        .reason("Doctor appointment")
                        .build());
            }
        }
    }

    public LeaveRequest applyLeave(LeaveRequest request) {
        employeeRepository.findById(request.getEmployeeId())
                .orElseThrow(() -> new ResourceNotFoundException("Employee not found with id: " + request.getEmployeeId()));
        
        if (request.getStartDate().isAfter(request.getEndDate())) {
            throw new IllegalArgumentException("Start date cannot be after end date");
        }
        
        request.setStatus(LeaveStatus.PENDING);
        return leaveRequestRepository.save(request);
    }

    public LeaveRequest updateLeaveStatus(Long id, LeaveStatus status) {
        LeaveRequest request = leaveRequestRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Leave request not found with id: " + id));
        request.setStatus(status);
        return leaveRequestRepository.save(request);
    }

    public List<LeaveRequest> getLeavesForEmployee(Long employeeId) {
        return leaveRequestRepository.findByEmployeeId(employeeId);
    }

    public List<LeaveRequest> getAllLeaves() {
        return leaveRequestRepository.findAll();
    }
}
