package com.nexushr.employee.service;

import com.nexushr.employee.model.PerformanceReview;
import com.nexushr.employee.model.Employee;
import com.nexushr.employee.repository.PerformanceReviewRepository;
import com.nexushr.employee.repository.EmployeeRepository;
import com.nexushr.common.exception.ResourceNotFoundException;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.time.LocalDate;
import java.util.List;

@Service
public class PerformanceReviewService {

    @Autowired
    private PerformanceReviewRepository performanceReviewRepository;

    @Autowired
    private EmployeeRepository employeeRepository;

    @PostConstruct
    public void seedReviews() {
        if (performanceReviewRepository.count() == 0) {
            List<Employee> employees = employeeRepository.findAll();
            if (employees.size() >= 3) {
                Employee manager = employees.stream()
                        .filter(e -> e.getJobTitle().contains("Manager"))
                        .findFirst()
                        .orElse(employees.get(0));

                Employee john = employees.stream()
                        .filter(e -> e.getName().contains("John"))
                        .findFirst()
                        .orElse(employees.get(1));

                performanceReviewRepository.save(PerformanceReview.builder()
                        .employeeId(john.getId())
                        .reviewerId(manager.getId())
                        .reviewDate(LocalDate.now().minusMonths(1))
                        .goals("Deliver microservices components and integration tests.")
                        .rating(4.5)
                        .feedback("Excellent progress on the backend modules. Very reliable and proactive.")
                        .build());

                Employee jane = employees.stream()
                        .filter(e -> e.getName().contains("Jane"))
                        .findFirst()
                        .orElse(employees.get(2));

                performanceReviewRepository.save(PerformanceReview.builder()
                        .employeeId(jane.getId())
                        .reviewerId(manager.getId())
                        .reviewDate(LocalDate.now().minusMonths(2))
                        .goals("Complete front-end mockups and learn React state management.")
                        .rating(3.0)
                        .feedback("Needs improvement on React concepts. Commits are sometimes delayed.")
                        .build());
            }
        }
    }

    public PerformanceReview createReview(PerformanceReview review) {
        Employee employee = employeeRepository.findById(review.getEmployeeId())
                .orElseThrow(() -> new ResourceNotFoundException("Employee not found with id: " + review.getEmployeeId()));
        
        review.setReviewDate(LocalDate.now());
        PerformanceReview savedReview = performanceReviewRepository.save(review);

        // Update employee's cached performance rating
        employee.setPerformanceRating(review.getRating());
        employeeRepository.save(employee);

        return savedReview;
    }

    public List<PerformanceReview> getReviewsForEmployee(Long employeeId) {
        return performanceReviewRepository.findByEmployeeId(employeeId);
    }

    public List<PerformanceReview> getAllReviews() {
        return performanceReviewRepository.findAll();
    }
}
