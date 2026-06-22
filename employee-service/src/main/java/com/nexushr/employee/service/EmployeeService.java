package com.nexushr.employee.service;

import com.nexushr.employee.model.Department;
import com.nexushr.employee.model.Employee;
import com.nexushr.employee.repository.DepartmentRepository;
import com.nexushr.employee.repository.EmployeeRepository;
import com.nexushr.common.exception.ResourceNotFoundException;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.time.LocalDate;
import java.util.List;

@Service
public class EmployeeService {

    @Autowired
    private EmployeeRepository employeeRepository;

    @Autowired
    private DepartmentRepository departmentRepository;

    @PostConstruct
    public void seedInitialData() {
        if (departmentRepository.count() == 0) {
            Department eng = departmentRepository.save(Department.builder().name("Engineering").managerId(2L).build());
            Department hr = departmentRepository.save(Department.builder().name("Human Resources").managerId(1L).build());
            departmentRepository.save(Department.builder().name("Finance").managerId(1L).build());
            departmentRepository.save(Department.builder().name("Sales").managerId(1L).build());

            if (employeeRepository.count() == 0) {
                // Admin Employee
                employeeRepository.save(Employee.builder()
                        .name("System Administrator")
                        .email("admin@nexushr.com")
                        .jobTitle("HR Director")
                        .departmentId(hr.getId())
                        .userId(1L) // admin user id from auth
                        .status("ACTIVE")
                        .performanceRating(4.8)
                        .attritionRisk("LOW")
                        .engagementScore(95)
                        .joinDate(LocalDate.of(2023, 1, 15))
                        .skills("HR Management, Leadership, Conflict Resolution")
                        .build());

                // Manager Employee
                Employee manager = employeeRepository.save(Employee.builder()
                        .name("Sarah Connor")
                        .email("sarah@nexushr.com")
                        .jobTitle("Engineering Manager")
                        .departmentId(eng.getId())
                        .status("ACTIVE")
                        .performanceRating(4.5)
                        .attritionRisk("LOW")
                        .engagementScore(88)
                        .joinDate(LocalDate.of(2023, 6, 10))
                        .skills("Java, System Design, Team Leadership, Agile")
                        .build());

                // Employee 1 (linked to Sarah as manager)
                employeeRepository.save(Employee.builder()
                        .name("John Doe")
                        .email("john.doe@nexushr.com")
                        .jobTitle("Software Engineer")
                        .departmentId(eng.getId())
                        .managerId(manager.getId())
                        .status("ACTIVE")
                        .performanceRating(4.2)
                        .attritionRisk("LOW")
                        .engagementScore(85)
                        .joinDate(LocalDate.of(2024, 2, 1))
                        .skills("Java, Spring Boot, React, SQL")
                        .build());

                // Employee 2 (high attrition risk for demonstration)
                employeeRepository.save(Employee.builder()
                        .name("Jane Smith")
                        .email("jane.smith@nexushr.com")
                        .jobTitle("Junior Developer")
                        .departmentId(eng.getId())
                        .managerId(manager.getId())
                        .status("ACTIVE")
                        .performanceRating(2.8)
                        .attritionRisk("HIGH")
                        .engagementScore(45)
                        .joinDate(LocalDate.of(2025, 9, 1))
                        .skills("HTML, CSS, JavaScript")
                        .build());
            }
        }
    }

    public List<Employee> getAllEmployees() {
        return employeeRepository.findAll();
    }

    public Employee getEmployeeById(Long id) {
        return employeeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Employee not found with id: " + id));
    }

    public Employee getEmployeeByUserId(Long userId) {
        return employeeRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Employee profile not found for user: " + userId));
    }

    public Employee createEmployee(Employee employee) {
        if (employeeRepository.findByEmail(employee.getEmail()).isPresent()) {
            throw new IllegalArgumentException("Employee email already exists");
        }
        if (employee.getJoinDate() == null) {
            employee.setJoinDate(LocalDate.now());
        }
        if (employee.getStatus() == null) {
            employee.setStatus("ACTIVE");
        }
        return employeeRepository.save(employee);
    }

    public Employee updateEmployee(Long id, Employee employeeDetails) {
        Employee employee = getEmployeeById(id);
        
        employee.setName(employeeDetails.getName());
        employee.setJobTitle(employeeDetails.getJobTitle());
        employee.setDepartmentId(employeeDetails.getDepartmentId());
        employee.setManagerId(employeeDetails.getManagerId());
        employee.setStatus(employeeDetails.getStatus());
        employee.setSkills(employeeDetails.getSkills());
        if (employeeDetails.getPerformanceRating() != null) {
            employee.setPerformanceRating(employeeDetails.getPerformanceRating());
        }
        if (employeeDetails.getAttritionRisk() != null) {
            employee.setAttritionRisk(employeeDetails.getAttritionRisk());
        }
        if (employeeDetails.getEngagementScore() != null) {
            employee.setEngagementScore(employeeDetails.getEngagementScore());
        }
        
        return employeeRepository.save(employee);
    }

    public void deleteEmployee(Long id) {
        Employee employee = getEmployeeById(id);
        employeeRepository.delete(employee);
    }
}
