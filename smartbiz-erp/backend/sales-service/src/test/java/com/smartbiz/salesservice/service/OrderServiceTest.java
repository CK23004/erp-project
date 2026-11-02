package com.smartbiz.salesservice.service;

import com.smartbiz.salesservice.client.InventoryClientInterface;
import com.smartbiz.salesservice.model.Customer;
import com.smartbiz.salesservice.model.Order;
import com.smartbiz.salesservice.model.OrderItem;
import com.smartbiz.salesservice.repository.OrderRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class OrderServiceTest {

    @Mock OrderRepository orderRepository;
    @Mock CustomerService customerService;
    // Mock the interface — Mockito proxies interfaces without Byte Buddy instrumentation
    // so this works on Java 23+/25 without -Dnet.bytebuddy.experimental
    @Mock InventoryClientInterface inventoryClient;
    @InjectMocks OrderService orderService;

    private Order order;
    private OrderItem item;

    @BeforeEach
    void setUp() {
        item = new OrderItem();
        item.setProductId("p1");
        item.setQuantity(2);
        item.setUnitPrice(50.0);

        order = new Order();
        order.setCustomerId("c1");
        order.setItems(List.of(item));
    }

    @Test
    void createOrder_success() {
        Customer customer = new Customer();
        customer.setId("c1");

        when(customerService.getCustomerById("c1")).thenReturn(customer);
        when(inventoryClient.checkAvailability(eq("p1"), eq(2), any())).thenReturn(true);

        Order saved = new Order();
        saved.setId("o1");
        saved.setCustomerId("c1");
        saved.setItems(List.of(item));
        saved.setTotalAmount(100.0);
        saved.setStatus("CONFIRMED");
        when(orderRepository.save(any())).thenReturn(saved);

        Order result = orderService.createOrder(order, "token");

        assertThat(result.getStatus()).isEqualTo("CONFIRMED");
        assertThat(result.getTotalAmount()).isEqualTo(100.0);
        verify(inventoryClient).deductStock(eq("p1"), eq(2), any());
    }

    @Test
    void createOrder_insufficientStock_throws() {
        Customer customer = new Customer();
        customer.setId("c1");

        when(customerService.getCustomerById("c1")).thenReturn(customer);
        when(inventoryClient.checkAvailability(eq("p1"), eq(2), any())).thenReturn(false);

        assertThatThrownBy(() -> orderService.createOrder(order, "token"))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("Insufficient stock");
    }

    @Test
    void updateOrderStatus_success() {
        Order existing = new Order();
        existing.setId("o1");
        existing.setStatus("PENDING");

        when(orderRepository.findById("o1")).thenReturn(Optional.of(existing));
        when(orderRepository.save(any())).thenReturn(existing);

        Order result = orderService.updateOrderStatus("o1", "DELIVERED");
        assertThat(result.getStatus()).isEqualTo("DELIVERED");
    }
}
