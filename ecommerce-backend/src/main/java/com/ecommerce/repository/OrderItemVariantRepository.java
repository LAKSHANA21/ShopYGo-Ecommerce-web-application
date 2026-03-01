package com.ecommerce.repository;

import com.ecommerce.model.OrderItemVariant;
import org.springframework.data.jpa.repository.JpaRepository;

public interface OrderItemVariantRepository extends JpaRepository<OrderItemVariant, Long> {
}