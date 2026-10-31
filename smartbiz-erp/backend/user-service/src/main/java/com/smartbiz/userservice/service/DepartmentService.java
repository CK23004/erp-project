package com.smartbiz.userservice.service;

import com.smartbiz.userservice.exception.DuplicateResourceException;
import com.smartbiz.userservice.exception.ResourceNotFoundException;
import com.smartbiz.userservice.model.Department;
import com.smartbiz.userservice.repository.DepartmentRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class DepartmentService {

    private final DepartmentRepository departmentRepository;

    public DepartmentService(DepartmentRepository departmentRepository) {
        this.departmentRepository = departmentRepository;
    }

    public Department createDepartment(Department department) {
        if (departmentRepository.existsByName(department.getName())) {
            throw new DuplicateResourceException("Department already exists: " + department.getName());
        }
        return departmentRepository.save(department);
    }

    public List<Department> getAllDepartments() {
        return departmentRepository.findAll();
    }
}
