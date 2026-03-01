package com.ecommerce.controller;

import com.ecommerce.model.CompleteOrder.OrderStatus;
import com.ecommerce.service.OrderStatisticsService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Map;

@RestController
@RequestMapping("/api/orders/statistics")
@RequiredArgsConstructor
public class OrderStatisticsController {

    private final OrderStatisticsService orderStatisticsService;

    @GetMapping("/seller/{sellerId}/total-sales")
    public ResponseEntity<BigDecimal> getTotalSalesBySeller(@PathVariable Long sellerId) {
        return ResponseEntity.ok(orderStatisticsService.getTotalSalesBySeller(sellerId));
    }

    @GetMapping("/seller/{sellerId}/status-counts")
    public ResponseEntity<Map<OrderStatus, Long>> getOrderStatusCountsBySeller(@PathVariable Long sellerId) {
        return ResponseEntity.ok(orderStatisticsService.getOrderStatusCountsBySeller(sellerId));
    }

    @GetMapping("/seller/{sellerId}/daily-sales")
    public ResponseEntity<Map<LocalDate, BigDecimal>> getDailySales(@PathVariable Long sellerId) {
        return ResponseEntity.ok(orderStatisticsService.getDailySales(sellerId));
    }
}