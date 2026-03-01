package com.ecommerce.service;

import com.ecommerce.exception.ResourceNotFoundException;
import com.ecommerce.exception.UnauthorizedException;
import com.ecommerce.model.Product;
import com.ecommerce.model.ProductVariant;
import com.ecommerce.model.ProductVariantValue;
import com.ecommerce.repository.ProductRepository;
import com.ecommerce.repository.ProductVariantRepository;
import com.ecommerce.repository.ProductVariantValueRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Objects;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class ProductVariantValueService {

    private final ProductVariantValueRepository productVariantValueRepository;
    private final ProductVariantRepository productVariantRepository;
    private final ProductRepository productRepository;

    public List<ProductVariantValue> findAll() {
        return productVariantValueRepository.findAll();
    }

    public Optional<ProductVariantValue> findById(Long id) {
        return productVariantValueRepository.findById(id);
    }

    public List<ProductVariantValue> findByVariantId(Long variantId) {
        return productVariantValueRepository.findByVariantId(variantId);
    }

    @Transactional
    public ProductVariantValue save(ProductVariantValue value, Long sellerId) {
        Objects.requireNonNull(value, "ProductVariantValue cannot be null");
        if (value.getVariant() == null || value.getVariant().getId() == null) {
            throw new IllegalArgumentException("Variant ID is required");
        }
        ProductVariant variant = productVariantRepository.findById(value.getVariant().getId())
                .orElseThrow(() -> new ResourceNotFoundException("Variant not found with id " + value.getVariant().getId()));
        Product product = productRepository.findById(variant.getProductId())
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with id " + variant.getProductId()));
        if (!product.getSellerId().equals(sellerId)) {
            throw new UnauthorizedException("You do not have permission to modify values for this product");
        }
        return productVariantValueRepository.save(value);
    }

    @Transactional
    public void deleteById(Long id, Long sellerId) {
        ProductVariantValue value = productVariantValueRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Value not found with id " + id));
        ProductVariant variant = productVariantRepository.findById(value.getVariant().getId())
                .orElseThrow(() -> new ResourceNotFoundException("Variant not found with id " + value.getVariant().getId()));
        Product product = productRepository.findById(variant.getProductId())
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with id " + variant.getProductId()));
        if (!product.getSellerId().equals(sellerId)) {
            throw new UnauthorizedException("You do not have permission to delete this value");
        }
        productVariantValueRepository.deleteById(id);
    }
}