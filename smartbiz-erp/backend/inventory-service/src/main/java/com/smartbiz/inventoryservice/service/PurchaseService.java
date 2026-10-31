package com.smartbiz.inventoryservice.service;

import com.smartbiz.inventoryservice.model.Purchase;
import com.smartbiz.inventoryservice.repository.PurchaseRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class PurchaseService {

    private final PurchaseRepository purchaseRepository;
    private final ProductService productService;

    public PurchaseService(PurchaseRepository purchaseRepository, ProductService productService) {
        this.purchaseRepository = purchaseRepository;
        this.productService = productService;
    }

    public Purchase createPurchase(Purchase purchase) {
        // Calculate total cost
        purchase.setTotalCost(purchase.getUnitCost() * purchase.getQuantity());
        Purchase saved = purchaseRepository.save(purchase);
        // Add purchased quantity to product stock
        productService.addStock(purchase.getProductId(), purchase.getQuantity());
        return saved;
    }

    public List<Purchase> getAllPurchases() {
        return purchaseRepository.findAll();
    }
}
