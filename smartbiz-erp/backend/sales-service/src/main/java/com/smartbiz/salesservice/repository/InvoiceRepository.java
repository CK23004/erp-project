package com.smartbiz.salesservice.repository;

import com.smartbiz.salesservice.model.Invoice;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.Optional;

public interface InvoiceRepository extends MongoRepository<Invoice, String> {
    Optional<Invoice> findByOrderId(String orderId);
}
