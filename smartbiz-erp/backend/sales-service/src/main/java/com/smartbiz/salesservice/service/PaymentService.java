package com.smartbiz.salesservice.service;

import com.smartbiz.salesservice.exception.ResourceNotFoundException;
import com.smartbiz.salesservice.model.Invoice;
import com.smartbiz.salesservice.model.Payment;
import com.smartbiz.salesservice.repository.InvoiceRepository;
import com.smartbiz.salesservice.repository.PaymentRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class PaymentService {

    private final PaymentRepository paymentRepository;
    private final InvoiceRepository invoiceRepository;

    public PaymentService(PaymentRepository paymentRepository,
                          InvoiceRepository invoiceRepository) {
        this.paymentRepository = paymentRepository;
        this.invoiceRepository = invoiceRepository;
    }

    public Payment createPayment(Payment payment) {
        // Verify invoice exists
        Invoice invoice = invoiceRepository.findById(payment.getInvoiceId())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Invoice not found: " + payment.getInvoiceId()));

        Payment saved = paymentRepository.save(payment);

        // Mark invoice as PAID
        invoice.setStatus("PAID");
        invoiceRepository.save(invoice);

        return saved;
    }

    public List<Payment> getAllPayments() {
        return paymentRepository.findAll();
    }
}
