package com.smartbiz.inventoryservice.controller;

import com.smartbiz.inventoryservice.dto.StockUpdateRequest;
import com.smartbiz.inventoryservice.model.Product;
import com.smartbiz.inventoryservice.service.ProductService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/products")
public class ProductController {

    private final ProductService productService;

    public ProductController(ProductService productService) {
        this.productService = productService;
    }

    @PostMapping
    public ResponseEntity<Product> createProduct(@Valid @RequestBody Product product) {
        return ResponseEntity.status(HttpStatus.CREATED).body(productService.createProduct(product));
    }

    @GetMapping
    public ResponseEntity<List<Product>> getAllProducts() {
        return ResponseEntity.ok(productService.getAllProducts());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Product> getProductById(@PathVariable String id) {
        return ResponseEntity.ok(productService.getProductById(id));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Product> updateProduct(@PathVariable String id,
                                                  @Valid @RequestBody Product product) {
        return ResponseEntity.ok(productService.updateProduct(id, product));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteProduct(@PathVariable String id) {
        productService.deleteProduct(id);
        return ResponseEntity.noContent().build();
    }

    // Internal endpoint called by Sales Service to deduct stock
    @PostMapping("/deduct-stock")
    public ResponseEntity<Product> deductStock(@Valid @RequestBody StockUpdateRequest request) {
        return ResponseEntity.ok(productService.deductStock(request.getProductId(), request.getQuantity()));
    }

    // Internal endpoint called by Sales Service to check availability
    @GetMapping("/{id}/availability")
    public ResponseEntity<Boolean> checkAvailability(@PathVariable String id,
                                                      @RequestParam int quantity) {
        return ResponseEntity.ok(productService.isStockAvailable(id, quantity));
    }
}
