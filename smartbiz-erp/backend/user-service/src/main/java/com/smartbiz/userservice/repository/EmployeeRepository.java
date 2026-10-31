package com.smartbiz.userservice.repository;

import com.smartbiz.userservice.model.Employee;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.List;

public interface EmployeeRepository extends MongoRepository<Employee, String> {
    List<Employee> findByDepartmentId(String departmentId);
    boolean existsByEmail(String email);
}
