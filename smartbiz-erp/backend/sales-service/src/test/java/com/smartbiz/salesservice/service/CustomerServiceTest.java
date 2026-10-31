package com.smartbiz.salesservice.service;

import com.smartbiz.salesservice.exception.DuplicateResourceException;
import com.smartbiz.salesservice.exception.ResourceNotFoundException;
import com.smartbiz.salesservice.model.Customer;
import com.smartbiz.salesservice.repository.CustomerRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CustomerServiceTest {

    @Mock CustomerRepository customerRepository;
    @InjectMocks CustomerService customerService;

    private Customer sample;

    @BeforeEach
    void setUp() {
        sample = new Customer();
        sample.setId("c1");
        sample.setName("Alice");
        sample.setEmail("alice@example.com");
    }

    @Test
    void createCustomer_success() {
        when(customerRepository.existsByEmail(any())).thenReturn(false);
        when(customerRepository.save(any())).thenReturn(sample);
        Customer result = customerService.createCustomer(sample);
        assertThat(result.getName()).isEqualTo("Alice");
    }

    @Test
    void createCustomer_duplicateEmail_throws() {
        when(customerRepository.existsByEmail(any())).thenReturn(true);
        assertThatThrownBy(() -> customerService.createCustomer(sample))
                .isInstanceOf(DuplicateResourceException.class);
    }

    @Test
    void getAllCustomers_returnsList() {
        when(customerRepository.findAll()).thenReturn(List.of(sample));
        assertThat(customerService.getAllCustomers()).hasSize(1);
    }

    @Test
    void getCustomerById_notFound_throws() {
        when(customerRepository.findById("bad")).thenReturn(Optional.empty());
        assertThatThrownBy(() -> customerService.getCustomerById("bad"))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void deleteCustomer_success() {
        when(customerRepository.existsById("c1")).thenReturn(true);
        customerService.deleteCustomer("c1");
        verify(customerRepository).deleteById("c1");
    }

    @Test
    void deleteCustomer_notFound_throws() {
        when(customerRepository.existsById("bad")).thenReturn(false);
        assertThatThrownBy(() -> customerService.deleteCustomer("bad"))
                .isInstanceOf(ResourceNotFoundException.class);
    }
}
