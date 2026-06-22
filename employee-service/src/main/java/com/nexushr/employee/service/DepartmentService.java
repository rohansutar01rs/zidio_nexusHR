package com.nexushr.employee.service;

import com.nexushr.employee.model.Department;
import com.nexushr.employee.repository.DepartmentRepository;
import com.nexushr.common.exception.ResourceNotFoundException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class DepartmentService {

    @Autowired
    private DepartmentRepository departmentRepository;

    public List<Department> getAllDepartments() {
        return departmentRepository.findAll();
    }

    public Department getDepartmentById(Long id) {
        return departmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Department not found with id: " + id));
    }

    public Department createDepartment(Department department) {
        if (departmentRepository.findByName(department.getName()).isPresent()) {
            throw new IllegalArgumentException("Department name already exists");
        }
        return departmentRepository.save(department);
    }

    public Department updateDepartment(Long id, Department details) {
        Department department = getDepartmentById(id);
        department.setName(details.getName());
        department.setManagerId(details.getManagerId());
        return departmentRepository.save(department);
    }

    public void deleteDepartment(Long id) {
        Department department = getDepartmentById(id);
        departmentRepository.delete(department);
    }
}
