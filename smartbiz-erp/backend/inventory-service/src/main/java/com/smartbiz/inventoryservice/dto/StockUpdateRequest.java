package com.smartbiz.inventoryservice.dto;

import jakarta.validation.constraints.NotNull;

public class StockUpdateRequest {

    @NotNull
    private String productId;

    @NotNull
    private Integer quantity; // positive = add, negative = deduct

    public String getProductId() { return productId; }
    public void setProductId(String productId) { this.productId = productId; }
    public Integer getQuantity() { return quantity; }
    public void setQuantity(Integer quantity) { this.quantity = quantity; }
}
