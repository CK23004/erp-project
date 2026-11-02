package com.smartbiz.salesservice.client;

/**
 * Interface for InventoryClient — enables Mockito to create a proxy-based
 * mock without needing Byte Buddy class instrumentation.
 * Byte Buddy inline mocking of concrete classes fails on Java 23+.
 */
public interface InventoryClientInterface {
    boolean checkAvailability(String productId, int quantity, String jwtToken);
    void deductStock(String productId, int quantity, String jwtToken);
}
