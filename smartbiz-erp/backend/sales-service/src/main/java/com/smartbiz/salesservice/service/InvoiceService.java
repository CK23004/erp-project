package com.smartbiz.salesservice.service;

import com.smartbiz.salesservice.exception.ResourceNotFoundException;
import com.smartbiz.salesservice.model.Invoice;
import com.smartbiz.salesservice.model.Order;
import com.smartbiz.salesservice.repository.InvoiceRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class InvoiceService {

    private final InvoiceRepository invoiceRepository;
    private final OrderService orderService;

    public InvoiceService(InvoiceRepository invoiceRepository, OrderService orderService) {
        this.invoiceRepository = invoiceRepository;
        this.orderService = orderService;
    }

    // Generates an invoice from an existing confirmed order
    public Invoice createInvoice(String orderId) {
        Order order = orderService.getOrderById(orderId);

        // Prevent duplicate invoices for the same order
        invoiceRepository.findByOrderId(orderId).ifPresent(inv -> {
            throw new IllegalStateException("Invoice already exists for order: " + orderId);
        });

        Invoice invoice = new Invoice();
        invoice.setOrderId(orderId);
        invoice.setCustomerId(order.getCustomerId());
        invoice.setAmount(order.getTotalAmount());
        invoice.setStatus("UNPAID");
        invoice.setIssuedAt(LocalDateTime.now());
        invoice.setDueDate(LocalDateTime.now().plusDays(30));

        return invoiceRepository.save(invoice);
    }

    public List<Invoice> getAllInvoices() {
        return invoiceRepository.findAll();
    }

    public Invoice getInvoiceById(String id) {
        return invoiceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Invoice not found: " + id));
    }
}
