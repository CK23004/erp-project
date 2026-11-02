package com.smartbiz.salesservice.service;

import com.smartbiz.salesservice.client.InventoryClientInterface;
import com.smartbiz.salesservice.service.CustomerServiceInterface;
import com.smartbiz.salesservice.exception.ResourceNotFoundException;
import com.smartbiz.salesservice.model.Order;
import com.smartbiz.salesservice.model.OrderItem;
import com.smartbiz.salesservice.repository.OrderRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class OrderService {

    private final OrderRepository orderRepository;
    private final CustomerServiceInterface customerService;
    private final InventoryClientInterface inventoryClient;

    public OrderService(OrderRepository orderRepository,
                        CustomerServiceInterface customerService,
                        InventoryClientInterface inventoryClient) {
        this.orderRepository = orderRepository;
        this.customerService = customerService;
        this.inventoryClient = inventoryClient;
    }

    /**
     * Places a new order:
     * 1. Validates customer exists
     * 2. Checks stock availability for each item with Inventory Service
     * 3. Saves the order as CONFIRMED
     * 4. Deducts stock for each item via Inventory Service
     */
    public Order createOrder(Order order, String jwtToken) {
        // Validate customer exists
        customerService.getCustomerById(order.getCustomerId());

        // Check stock availability for all items before touching anything
        for (OrderItem item : order.getItems()) {
            boolean available = inventoryClient.checkAvailability(
                    item.getProductId(), item.getQuantity(), jwtToken);
            if (!available) {
                throw new IllegalStateException(
                    "Insufficient stock for product: " + item.getProductId());
            }
        }

        // Calculate totals
        double total = 0;
        for (OrderItem item : order.getItems()) {
            item.setSubtotal(item.getUnitPrice() * item.getQuantity());
            total += item.getSubtotal();
        }
        order.setTotalAmount(total);
        order.setStatus("CONFIRMED");

        Order saved = orderRepository.save(order);

        // Deduct stock after saving the order to avoid losing the order if deduction fails
        for (OrderItem item : saved.getItems()) {
            inventoryClient.deductStock(item.getProductId(), item.getQuantity(), jwtToken);
        }

        return saved;
    }

    public List<Order> getAllOrders() {
        return orderRepository.findAll();
    }

    public Order getOrderById(String id) {
        return orderRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found: " + id));
    }

    public Order updateOrderStatus(String id, String status) {
        Order order = getOrderById(id);
        order.setStatus(status);
        return orderRepository.save(order);
    }
}
