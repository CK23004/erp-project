package com.smartbiz.inventoryservice.service;

import com.smartbiz.inventoryservice.exception.InsufficientStockException;
import com.smartbiz.inventoryservice.exception.ResourceNotFoundException;
import com.smartbiz.inventoryservice.model.Product;
import com.smartbiz.inventoryservice.repository.ProductRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ProductService {

    private final ProductRepository productRepository;

    public ProductService(ProductRepository productRepository) {
        this.productRepository = productRepository;
    }

    public Product createProduct(Product product) {
        return productRepository.save(product);
    }

    public List<Product> getAllProducts() {
        return productRepository.findAll();
    }

    public Product getProductById(String id) {
        return productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found: " + id));
    }

    public Product updateProduct(String id, Product updated) {
        Product existing = getProductById(id);
        existing.setName(updated.getName());
        existing.setDescription(updated.getDescription());
        existing.setCategoryId(updated.getCategoryId());
        existing.setSupplierId(updated.getSupplierId());
        existing.setSku(updated.getSku());
        existing.setPrice(updated.getPrice());
        existing.setLowStockThreshold(updated.getLowStockThreshold());
        return productRepository.save(existing);
    }

    public void deleteProduct(String id) {
        if (!productRepository.existsById(id)) {
            throw new ResourceNotFoundException("Product not found: " + id);
        }
        productRepository.deleteById(id);
    }

    // Called by Sales Service to check availability
    public boolean isStockAvailable(String productId, int requestedQty) {
        Product product = getProductById(productId);
        return product.getQuantity() >= requestedQty;
    }

    // Called by Sales Service to deduct stock after order confirmation
    public Product deductStock(String productId, int qty) {
        Product product = getProductById(productId);
        if (product.getQuantity() < qty) {
            throw new InsufficientStockException(
                "Insufficient stock for product: " + product.getName()
                + " (available: " + product.getQuantity() + ", requested: " + qty + ")");
        }
        product.setQuantity(product.getQuantity() - qty);
        return productRepository.save(product);
    }

    // Called when a purchase is recorded to add stock
    public Product addStock(String productId, int qty) {
        Product product = getProductById(productId);
        product.setQuantity(product.getQuantity() + qty);
        return productRepository.save(product);
    }

    public List<Product> getLowStockProducts() {
        return productRepository.findAll().stream()
                .filter(p -> p.getQuantity() <= p.getLowStockThreshold())
                .toList();
    }
}
