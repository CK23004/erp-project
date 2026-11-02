package com.smartbiz.salesservice.service;

import com.smartbiz.salesservice.model.Customer;
import java.util.List;

/**
 * Interface for CustomerService — enables proxy-based Mockito mocking
 * which works on Java 23+ without Byte Buddy class instrumentation.
 */
public interface CustomerServiceInterface {
    Customer createCustomer(Customer customer);
    List<Customer> getAllCustomers();
    Customer getCustomerById(String id);
    Customer updateCustomer(String id, Customer updated);
    void deleteCustomer(String id);
}
