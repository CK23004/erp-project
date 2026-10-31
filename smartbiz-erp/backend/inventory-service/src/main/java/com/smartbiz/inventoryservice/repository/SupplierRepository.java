package com.smartbiz.inventoryservice.repository;

import com.smartbiz.inventoryservice.model.Supplier;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface SupplierRepository extends MongoRepository<Supplier, String> {}
