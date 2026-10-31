package com.smartbiz.inventoryservice.repository;

import com.smartbiz.inventoryservice.model.Product;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.List;

public interface ProductRepository extends MongoRepository<Product, String> {
    List<Product> findByQuantityLessThanEqual(int threshold);
}
