package com.ecommerce.repository;

import com.ecommerce.model.ProductVariantValue;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ProductVariantValueRepository extends JpaRepository<ProductVariantValue, Long> {
    List<ProductVariantValue> findByVariantId(Long variantId);
    boolean existsByIdAndVariantId(Long id, Long variantId);
}