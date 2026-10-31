package com.smartbiz.salesservice.client;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.util.Map;

/**
 * Calls Inventory Service synchronously via Spring RestClient.
 * The JWT token from the incoming request is forwarded so the
 * inventory service can authenticate the call.
 */
@Component
public class InventoryClient {

    private final RestClient restClient;

    public InventoryClient(RestClient inventoryRestClient) {
        this.restClient = inventoryRestClient;
    }

    // Check if enough stock exists before placing an order
    public boolean checkAvailability(String productId, int quantity, String jwtToken) {
        Boolean result = restClient.get()
                .uri("/api/products/{id}/availability?quantity={qty}", productId, quantity)
                .header("Authorization", "Bearer " + jwtToken)
                .retrieve()
                .body(Boolean.class);
        return Boolean.TRUE.equals(result);
    }

    // Deduct stock after an order is confirmed
    public void deductStock(String productId, int quantity, String jwtToken) {
        Map<String, Object> request = Map.of(
                "productId", productId,
                "quantity", quantity);

        restClient.post()
                .uri("/api/products/deduct-stock")
                .header("Authorization", "Bearer " + jwtToken)
                .contentType(MediaType.APPLICATION_JSON)
                .body(request)
                .retrieve()
                .toBodilessEntity();
    }
}
