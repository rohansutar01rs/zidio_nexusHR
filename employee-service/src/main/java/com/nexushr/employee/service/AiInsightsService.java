package com.nexushr.employee.service;

import com.nexushr.employee.model.Employee;
import com.nexushr.employee.model.Attendance;
import com.nexushr.employee.model.LeaveRequest;
import com.nexushr.employee.repository.EmployeeRepository;
import com.nexushr.employee.repository.AttendanceRepository;
import com.nexushr.employee.repository.LeaveRequestRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.time.LocalDate;
import java.util.*;

@Service
public class AiInsightsService {

    @Autowired
    private EmployeeRepository employeeRepository;

    @Autowired
    private AttendanceRepository attendanceRepository;

    @Autowired
    private LeaveRequestRepository leaveRequestRepository;

    public Map<String, Object> getEmployeeAiDetails(Long employeeId) {
        Employee employee = employeeRepository.findById(employeeId)
                .orElseThrow(() -> new RuntimeException("Employee not found"));

        Map<String, Object> insights = new HashMap<>();
        
        // 1. Calculate Attrition Risk
        String attritionRisk = calculateAttritionRisk(employee);
        List<String> riskDrivers = calculateRiskDrivers(employee);
        String recommendation = getRetentionRecommendation(attritionRisk, employee.getJobTitle());

        Map<String, Object> attritionMap = new HashMap<>();
        attritionMap.put("riskLevel", attritionRisk);
        attritionMap.put("drivers", riskDrivers);
        attritionMap.put("recommendation", recommendation);
        insights.put("attrition", attritionMap);

        // 2. Calculate Skill Gaps
        List<String> currentSkills = getSkillsList(employee.getSkills());
        List<String> requiredSkills = getRequiredSkillsForRole(employee.getJobTitle());
        List<String> missingSkills = new ArrayList<>(requiredSkills);
        missingSkills.removeAll(currentSkills);

        Map<String, Object> skillsMap = new HashMap<>();
        skillsMap.put("current", currentSkills);
        skillsMap.put("required", requiredSkills);
        skillsMap.put("gap", missingSkills);
        skillsMap.put("trainingRecommendation", getTrainingRecommendation(missingSkills));
        insights.put("skills", skillsMap);

        // 3. Engagement Score
        int engagementScore = calculateEngagementScore(employee);
        insights.put("engagementScore", engagementScore);
        insights.put("employeeName", employee.getName());
        insights.put("jobTitle", employee.getJobTitle());

        return insights;
    }

    public Map<String, Object> getGlobalDashboardSummary() {
        List<Employee> employees = employeeRepository.findAll();
        int highRiskCount = 0;
        int medRiskCount = 0;
        int lowRiskCount = 0;
        int totalEngagement = 0;

        for (Employee emp : employees) {
            String risk = calculateAttritionRisk(emp);
            if ("HIGH".equals(risk)) highRiskCount++;
            else if ("MEDIUM".equals(risk)) medRiskCount++;
            else lowRiskCount++;

            totalEngagement += calculateEngagementScore(emp);
        }

        double avgEngagement = employees.isEmpty() ? 0 : (double) totalEngagement / employees.size();

        Map<String, Object> summary = new HashMap<>();
        summary.put("totalEmployees", employees.size());
        summary.put("highRiskCount", highRiskCount);
        summary.put("mediumRiskCount", medRiskCount);
        summary.put("lowRiskCount", lowRiskCount);
        summary.put("averageEngagement", Math.round(avgEngagement * 10.0) / 10.0);

        // Department-wise distribution
        Map<String, Integer> deptRisk = new HashMap<>();
        for (Employee emp : employees) {
            String risk = calculateAttritionRisk(emp);
            if ("HIGH".equals(risk)) {
                deptRisk.put(String.valueOf(emp.getDepartmentId()), deptRisk.getOrDefault(String.valueOf(emp.getDepartmentId()), 0) + 1);
            }
        }
        summary.put("departmentHighRisk", deptRisk);

        return summary;
    }

    private String calculateAttritionRisk(Employee employee) {
        if (employee.getPerformanceRating() != null && employee.getPerformanceRating() < 3.0) {
            return "HIGH";
        }
        
        List<LeaveRequest> leaves = leaveRequestRepository.findByEmployeeId(employee.getId());
        long approvedLeaves = leaves.stream()
                .filter(l -> l.getStatus().name().equals("APPROVED"))
                .count();

        if (approvedLeaves > 15) {
            return "MEDIUM";
        }
        
        if (employee.getEngagementScore() != null && employee.getEngagementScore() < 55) {
            return "HIGH";
        } else if (employee.getEngagementScore() != null && employee.getEngagementScore() < 75) {
            return "MEDIUM";
        }

        return "LOW";
    }

    private List<String> calculateRiskDrivers(Employee employee) {
        List<String> drivers = new ArrayList<>();
        if (employee.getPerformanceRating() != null && employee.getPerformanceRating() < 3.0) {
            drivers.add("Low Performance Rating (" + employee.getPerformanceRating() + "/5.0)");
        }
        
        List<LeaveRequest> leaves = leaveRequestRepository.findByEmployeeId(employee.getId());
        long approvedLeaves = leaves.stream()
                .filter(l -> l.getStatus().name().equals("APPROVED"))
                .count();
        if (approvedLeaves > 10) {
            drivers.add("High Leave Density (" + approvedLeaves + " approved leaves)");
        }

        if (employee.getEngagementScore() != null && employee.getEngagementScore() < 60) {
            drivers.add("Low Engagement Index (" + employee.getEngagementScore() + "%)");
        }

        if (drivers.isEmpty()) {
            drivers.add("No significant flight risk drivers identified.");
        }
        return drivers;
    }

    private String getRetentionRecommendation(String risk, String jobTitle) {
        if ("HIGH".equals(risk)) {
            return "Schedule an immediate 1-on-1 feedback session. Consider career path re-alignment and training support for " + jobTitle + " skills.";
        } else if ("MEDIUM".equals(risk)) {
            return "Conduct a pulse check during the next performance review. Suggest participation in upcoming skill workshops.";
        } else {
            return "Maintain current engagement. Reward strong performance with growth opportunities.";
        }
    }

    private List<String> getSkillsList(String skills) {
        if (skills == null || skills.trim().isEmpty()) {
            return Collections.emptyList();
        }
        return Arrays.stream(skills.split(","))
                .map(String::trim)
                .toList();
    }

    private List<String> getRequiredSkillsForRole(String jobTitle) {
        if (jobTitle == null) return List.of("Communication", "Collaboration");
        String title = jobTitle.toLowerCase();
        if (title.contains("engineering manager") || title.contains("director")) {
            return List.of("Java", "System Design", "Team Leadership", "Agile", "Budgeting", "Product Strategy");
        } else if (title.contains("engineer") || title.contains("developer")) {
            return List.of("Java", "Spring Boot", "React", "SQL", "Docker", "Git");
        } else if (title.contains("hr") || title.contains("recruiter")) {
            return List.of("HR Management", "Leadership", "Conflict Resolution", "Talent Acquisition", "Excel");
        } else {
            return List.of("Communication", "Collaboration", "MS Office", "Problem Solving");
        }
    }

    private String getTrainingRecommendation(List<String> missingSkills) {
        if (missingSkills.isEmpty()) {
            return "No training required. Employee meets all core skill requirements for the role.";
        }
        return "Recommended Courses: " + String.join(", ", missingSkills.stream()
                .map(skill -> skill + " Certification / Boot Camp")
                .toList());
    }

    private int calculateEngagementScore(Employee employee) {
        if (employee.getEngagementScore() != null) {
            return employee.getEngagementScore();
        }
        // Base score
        int score = 75;
        if (employee.getPerformanceRating() != null) {
            score += (employee.getPerformanceRating() - 3.0) * 10;
        }
        // bound
        return Math.max(10, Math.min(100, score));
    }

    public void recalculateAllInsights() {
        List<Employee> employees = employeeRepository.findAll();
        for (Employee emp : employees) {
            String risk = calculateAttritionRisk(emp);
            int score = calculateEngagementScore(emp);
            emp.setAttritionRisk(risk);
            emp.setEngagementScore(score);
            employeeRepository.save(emp);
        }
    }
}
