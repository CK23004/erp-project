package com.smartbiz.userservice.service;

import com.smartbiz.userservice.exception.DuplicateResourceException;
import com.smartbiz.userservice.exception.ResourceNotFoundException;
import com.smartbiz.userservice.model.Employee;
import com.smartbiz.userservice.repository.DepartmentRepository;
import com.smartbiz.userservice.repository.EmployeeRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class EmployeeService {

    private final EmployeeRepository employeeRepository;
    private final DepartmentRepository departmentRepository;

    public EmployeeService(EmployeeRepository employeeRepository,
                           DepartmentRepository departmentRepository) {
        this.employeeRepository = employeeRepository;
        this.departmentRepository = departmentRepository;
    }

    public Employee createEmployee(Employee employee) {
        if (employeeRepository.existsByEmail(employee.getEmail())) {
            throw new DuplicateResourceException("Employee email already exists: " + employee.getEmail());
        }
        if (!departmentRepository.existsById(employee.getDepartmentId())) {
            throw new ResourceNotFoundException("Department not found: " + employee.getDepartmentId());
        }
        return employeeRepository.save(employee);
    }

    public List<Employee> getAllEmployees() {
        return employeeRepository.findAll();
    }

    public Employee getEmployeeById(String id) {
        return employeeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Employee not found: " + id));
    }

    public Employee updateEmployee(String id, Employee updated) {
        Employee existing = getEmployeeById(id);
        existing.setFirstName(updated.getFirstName());
        existing.setLastName(updated.getLastName());
        existing.setEmail(updated.getEmail());
        existing.setPhone(updated.getPhone());
        existing.setDepartmentId(updated.getDepartmentId());
        existing.setPosition(updated.getPosition());
        existing.setJoiningDate(updated.getJoiningDate());
        existing.setSalary(updated.getSalary());
        existing.setActive(updated.isActive());
        return employeeRepository.save(existing);
    }

    public void deleteEmployee(String id) {
        if (!employeeRepository.existsById(id)) {
            throw new ResourceNotFoundException("Employee not found: " + id);
        }
        employeeRepository.deleteById(id);
    }
}
