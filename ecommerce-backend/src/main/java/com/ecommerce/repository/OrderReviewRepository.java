package com.ecommerce.repository;

import com.ecommerce.model.OrderReview;
import org.springframework.data.jpa.repository.JpaRepository;

public interface OrderReviewRepository extends JpaRepository<OrderReview, Long> {
    boolean existsByOrderId(Long orderId);
}