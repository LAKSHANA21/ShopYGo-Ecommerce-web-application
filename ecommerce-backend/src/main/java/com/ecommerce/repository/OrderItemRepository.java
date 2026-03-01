package com.ecommerce.repository;

import com.ecommerce.model.OrderItem;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface OrderItemRepository extends JpaRepository<OrderItem, Long> {
    List<OrderItem> findBySellerId(Long sellerId);
    Optional<OrderItem> findByIdAndOrderId(Long id, Long orderId);
}