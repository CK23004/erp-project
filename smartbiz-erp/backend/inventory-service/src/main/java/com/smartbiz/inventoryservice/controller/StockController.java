package com.smartbiz.inventoryservice.controller;

import com.smartbiz.inventoryservice.model.Product;
import com.smartbiz.inventoryservice.service.ProductService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/stock")
public class StockController {

    private final ProductService productService;

    public StockController(ProductService productService) {
        this.productService = productService;
    }

    // Returns all products with their current stock quantities
    @GetMapping
    public ResponseEntity<List<Product>> getAllStock() {
        return ResponseEntity.ok(productService.getAllProducts());
    }

    // Returns products whose quantity is at or below their lowStockThreshold
    @GetMapping("/low-stock")
    public ResponseEntity<List<Product>> getLowStockProducts() {
        return ResponseEntity.ok(productService.getLowStockProducts());
    }
}
