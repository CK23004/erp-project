package com.smartbiz.userservice.repository;

import com.smartbiz.userservice.model.Department;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface DepartmentRepository extends MongoRepository<Department, String> {
    boolean existsByName(String name);
}
