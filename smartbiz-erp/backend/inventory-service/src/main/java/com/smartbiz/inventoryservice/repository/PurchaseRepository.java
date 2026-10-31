package com.smartbiz.inventoryservice.repository;

import com.smartbiz.inventoryservice.model.Purchase;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface PurchaseRepository extends MongoRepository<Purchase, String> {}
