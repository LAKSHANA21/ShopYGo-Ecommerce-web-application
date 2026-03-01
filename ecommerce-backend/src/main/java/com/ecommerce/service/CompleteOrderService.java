package com.ecommerce.service;

import com.ecommerce.model.CompleteOrder;
import com.ecommerce.repository.CompleteOrderRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CompleteOrderService {

    private final CompleteOrderRepository orderRepository;
    private final EmailService emailService;

    public CompleteOrder placeOrder(CompleteOrder order) {
        CompleteOrder savedOrder = orderRepository.save(order);
        // Send notification emails
        emailService.sendOrderConfirmation(savedOrder);
        return savedOrder;
    }

    public CompleteOrder getOrderById(Long id) {
        return orderRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Order not found"));
    }

    public List<CompleteOrder> getOrdersByUser(Long userId) {
        return orderRepository.findByUserId(userId);
    }

    public List<CompleteOrder> getOrdersBySeller(Long sellerId) {
        return orderRepository.findBySellerId(sellerId);
    }

    @Transactional
    public CompleteOrder updateOrderStatus(Long orderId, CompleteOrder.OrderStatus newStatus) {
        CompleteOrder order = getOrderById(orderId);
        order.setOrderStatus(newStatus);
        order = orderRepository.save(order);
        
        // Notify user about status change
        emailService.sendStatusUpdateNotification(order);
        return order;
    }

    @Transactional
    public CompleteOrder updateShippingStatus(Long orderId, CompleteOrder.ShippingStatus newStatus) {
        CompleteOrder order = getOrderById(orderId);
        order.setShippingStatus(newStatus);
        return orderRepository.save(order);
    }

    @Transactional
    public CompleteOrder updateTransactionStatus(Long orderId, CompleteOrder.TransactionStatus newStatus) {
        CompleteOrder order = getOrderById(orderId);
        order.setTransactionStatus(newStatus);
        return orderRepository.save(order);
    }

    @Transactional
    public void cancelOrder(Long orderId) {
        CompleteOrder order = getOrderById(orderId);
        order.setOrderStatus(CompleteOrder.OrderStatus.CANCELLED);
        orderRepository.save(order);
        
        // Notify both user and seller
        emailService.sendOrderCancellationNotification(order);
    }

    public List<CompleteOrder> getUserOrdersByStatus(Long userId, CompleteOrder.OrderStatus status) {
        return orderRepository.findByUserIdAndOrderStatus(userId, status);
    }

    public List<CompleteOrder> getSellerOrdersByStatus(Long sellerId, CompleteOrder.OrderStatus status) {
        return orderRepository.findBySellerIdAndOrderStatus(sellerId, status);
    }
}