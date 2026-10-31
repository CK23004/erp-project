package com.smartbiz.inventoryservice.repository;

import com.smartbiz.inventoryservice.model.Category;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface CategoryRepository extends MongoRepository<Category, String> {
    boolean existsByName(String name);
}
