package com.ecommerce.service;

import com.ecommerce.model.CompleteOrder;
import com.ecommerce.repository.CompleteOrderRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class OrderStatisticsService {

    private final CompleteOrderRepository orderRepository;

    public BigDecimal getTotalSalesBySeller(Long sellerId) {
        return orderRepository.findBySellerId(sellerId).stream()
                .filter(order -> order.getTransactionStatus() == CompleteOrder.TransactionStatus.SUCCESS)
                .map(CompleteOrder::getTotalAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    public Map<CompleteOrder.OrderStatus, Long> getOrderStatusCountsBySeller(Long sellerId) {
        return orderRepository.findBySellerId(sellerId).stream()
                .collect(Collectors.groupingBy(
                        CompleteOrder::getOrderStatus,
                        Collectors.counting()
                ));
    }

    public Map<LocalDate, BigDecimal> getDailySales(Long sellerId) {
        return orderRepository.findBySellerId(sellerId).stream()
                .filter(order -> order.getTransactionStatus() == CompleteOrder.TransactionStatus.SUCCESS)
                .collect(Collectors.groupingBy(
                        order -> order.getTransactionDate().toLocalDate(),
                        Collectors.reducing(
                                BigDecimal.ZERO,
                                CompleteOrder::getTotalAmount,
                                BigDecimal::add
                        )
                ));
    }
}