package com.ecommerce.controller;

import com.ecommerce.model.CompleteOrder;
import com.ecommerce.service.CompleteOrderService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/order")
@RequiredArgsConstructor
public class CompleteOrderController {

    private final CompleteOrderService orderService;

    @PostMapping
    public ResponseEntity<CompleteOrder> placeOrder(@RequestBody CompleteOrder order) {
        return ResponseEntity.ok(orderService.placeOrder(order));
    }

    @GetMapping("/{id}")
    public ResponseEntity<CompleteOrder> getOrder(@PathVariable Long id) {
        return ResponseEntity.ok(orderService.getOrderById(id));
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<CompleteOrder>> getUserOrders(@PathVariable Long userId) {
        return ResponseEntity.ok(orderService.getOrdersByUser(userId));
    }

    @GetMapping("/seller/{sellerId}")
    public ResponseEntity<List<CompleteOrder>> getSellerOrders(@PathVariable Long sellerId) {
        return ResponseEntity.ok(orderService.getOrdersBySeller(sellerId));
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<CompleteOrder> updateOrderStatus(
            @PathVariable Long id, 
            @RequestParam CompleteOrder.OrderStatus status) {
        return ResponseEntity.ok(orderService.updateOrderStatus(id, status));
    }

    @PutMapping("/{id}/shipping-status")
    public ResponseEntity<CompleteOrder> updateShippingStatus(
            @PathVariable Long id, 
            @RequestParam CompleteOrder.ShippingStatus status) {
        return ResponseEntity.ok(orderService.updateShippingStatus(id, status));
    }

    @PutMapping("/{id}/transaction-status")
    public ResponseEntity<CompleteOrder> updateTransactionStatus(
            @PathVariable Long id, 
            @RequestParam CompleteOrder.TransactionStatus status) {
        return ResponseEntity.ok(orderService.updateTransactionStatus(id, status));
    }

    @PutMapping("/{id}/cancel")
    public ResponseEntity<Void> cancelOrder(@PathVariable Long id) {
        orderService.cancelOrder(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/user/{userId}/status")
    public ResponseEntity<List<CompleteOrder>> getUserOrdersByStatus(
            @PathVariable Long userId,
            @RequestParam CompleteOrder.OrderStatus status) {
        return ResponseEntity.ok(orderService.getUserOrdersByStatus(userId, status));
    }

    @GetMapping("/seller/{sellerId}/status")
    public ResponseEntity<List<CompleteOrder>> getSellerOrdersByStatus(
            @PathVariable Long sellerId,
            @RequestParam CompleteOrder.OrderStatus status) {
        return ResponseEntity.ok(orderService.getSellerOrdersByStatus(sellerId, status));
    }
}