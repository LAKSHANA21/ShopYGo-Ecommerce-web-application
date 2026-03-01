package com.ecommerce.repository;

import com.ecommerce.model.CompleteOrder;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CompleteOrderRepository extends JpaRepository<CompleteOrder, Long> {
    List<CompleteOrder> findByUserId(Long userId);
    List<CompleteOrder> findBySellerId(Long sellerId);
    List<CompleteOrder> findByUserIdAndOrderStatus(Long userId, CompleteOrder.OrderStatus orderStatus);
    List<CompleteOrder> findBySellerIdAndOrderStatus(Long sellerId, CompleteOrder.OrderStatus orderStatus);
}