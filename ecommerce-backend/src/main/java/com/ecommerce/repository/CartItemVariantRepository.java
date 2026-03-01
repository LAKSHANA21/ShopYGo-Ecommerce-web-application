package com.ecommerce.repository;

import com.ecommerce.model.CartItemVariant;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CartItemVariantRepository extends JpaRepository<CartItemVariant, Long> {
}