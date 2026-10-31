package com.smartbiz.salesservice.repository;

import com.smartbiz.salesservice.model.Payment;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface PaymentRepository extends MongoRepository<Payment, String> {}
