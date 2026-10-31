package com.smartbiz.inventoryservice.service;

import com.smartbiz.inventoryservice.exception.InsufficientStockException;
import com.smartbiz.inventoryservice.exception.ResourceNotFoundException;
import com.smartbiz.inventoryservice.model.Product;
import com.smartbiz.inventoryservice.repository.ProductRepository;
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
class ProductServiceTest {

    @Mock
    private ProductRepository productRepository;

    @InjectMocks
    private ProductService productService;

    private Product sampleProduct;

    @BeforeEach
    void setUp() {
        sampleProduct = new Product();
        sampleProduct.setId("p1");
        sampleProduct.setName("Widget");
        sampleProduct.setQuantity(50);
        sampleProduct.setLowStockThreshold(10);
        sampleProduct.setPrice(9.99);
    }

    @Test
    void createProduct_success() {
        when(productRepository.save(any())).thenReturn(sampleProduct);
        Product result = productService.createProduct(sampleProduct);
        assertThat(result.getName()).isEqualTo("Widget");
    }

    @Test
    void getProductById_notFound_throwsException() {
        when(productRepository.findById("bad")).thenReturn(Optional.empty());
        assertThatThrownBy(() -> productService.getProductById("bad"))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void deductStock_success() {
        when(productRepository.findById("p1")).thenReturn(Optional.of(sampleProduct));
        when(productRepository.save(any())).thenReturn(sampleProduct);

        Product result = productService.deductStock("p1", 10);
        assertThat(sampleProduct.getQuantity()).isEqualTo(40);
    }

    @Test
    void deductStock_insufficient_throwsException() {
        when(productRepository.findById("p1")).thenReturn(Optional.of(sampleProduct));
        assertThatThrownBy(() -> productService.deductStock("p1", 100))
                .isInstanceOf(InsufficientStockException.class)
                .hasMessageContaining("Insufficient stock");
    }

    @Test
    void addStock_success() {
        when(productRepository.findById("p1")).thenReturn(Optional.of(sampleProduct));
        when(productRepository.save(any())).thenReturn(sampleProduct);

        productService.addStock("p1", 20);
        assertThat(sampleProduct.getQuantity()).isEqualTo(70);
    }

    @Test
    void getLowStockProducts_returnsCorrectList() {
        Product lowStock = new Product();
        lowStock.setQuantity(5);
        lowStock.setLowStockThreshold(10);

        when(productRepository.findAll()).thenReturn(List.of(sampleProduct, lowStock));
        List<Product> result = productService.getLowStockProducts();
        assertThat(result).hasSize(1);
    }

    @Test
    void isStockAvailable_true() {
        when(productRepository.findById("p1")).thenReturn(Optional.of(sampleProduct));
        assertThat(productService.isStockAvailable("p1", 10)).isTrue();
    }

    @Test
    void isStockAvailable_false() {
        when(productRepository.findById("p1")).thenReturn(Optional.of(sampleProduct));
        assertThat(productService.isStockAvailable("p1", 100)).isFalse();
    }
}
