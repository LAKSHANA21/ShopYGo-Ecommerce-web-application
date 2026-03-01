package com.ecommerce.service;

import com.ecommerce.exception.ResourceNotFoundException;
import com.ecommerce.exception.UnauthorizedException;
import com.ecommerce.model.Product;
import com.ecommerce.model.ProductVariant;
import com.ecommerce.repository.ProductRepository;
import com.ecommerce.repository.ProductVariantRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Objects;

@Service
@RequiredArgsConstructor
public class ProductVariantService {

    private final ProductVariantRepository productVariantRepository;
    private final ProductRepository productRepository;
    private static final Logger logger = LoggerFactory.getLogger(ProductVariantService.class);

    public List<ProductVariant> findByProductId(Long productId) {
        logger.debug("Fetching variants for productId: {}", productId);
        return productVariantRepository.findByProductId(productId);
    }

    public ProductVariant findById(Long id) {
        logger.debug("Fetching variant by id: {}", id);
        return productVariantRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Variant not found with id " + id));
    }

    @Transactional
    public ProductVariant save(ProductVariant variant, Long sellerId) {
        logger.debug("Saving variant for productId: {}", variant.getProductId());
        Objects.requireNonNull(variant, "ProductVariant cannot be null");
        Objects.requireNonNull(variant.getProductId(), "Product ID is required");

        Product product = productRepository.findById(variant.getProductId())
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with id " + variant.getProductId()));
        if (!product.getSellerId().equals(sellerId)) {
            logger.warn("Seller {} not authorized for product {}", sellerId, variant.getProductId());
            throw new UnauthorizedException("You do not have permission to modify this product");
        }

        if (variant.getValues() == null) {
            variant.setValues(new ArrayList<>());
        }

        ProductVariant saved = productVariantRepository.save(variant);
        logger.info("Saved variant id: {} for productId: {}", saved.getId(), saved.getProductId());
        return saved;
    }

    @Transactional
    public void deleteById(Long id, Long sellerId) {
        logger.debug("Deleting variant id: {}", id);
        ProductVariant variant = findById(id);
        Product product = productRepository.findById(variant.getProductId())
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with id " + variant.getProductId()));
        if (!product.getSellerId().equals(sellerId)) {
            logger.warn("Seller {} not authorized for product {}", sellerId, variant.getProductId());
            throw new UnauthorizedException("You do not have permission to delete this variant");
        }
        productVariantRepository.deleteById(id);
        logger.info("Deleted variant id: {}", id);
    }
}