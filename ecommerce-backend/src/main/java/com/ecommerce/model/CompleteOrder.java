package com.ecommerce.model;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "complete_orders")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CompleteOrder {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long userId;
    private Long sellerId;

    @Enumerated(EnumType.STRING)
    private OrderStatus orderStatus; // NEW, PROCESSING, SHIPPED, DELIVERED, CANCELLED

    private String paymentMode;
    private BigDecimal totalAmount;

    // Product-level details (for one product per order)
    private Long productId;
    private Integer quantity;
    private BigDecimal itemPrice;
    private Long variantId;
    private Long variantValueId;
    @Enumerated(EnumType.STRING)
    private ShippingStatus shippingStatus;

    @Enumerated(EnumType.STRING)
    private TransactionStatus transactionStatus;

    private LocalDateTime transactionDate;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
        if (this.transactionDate == null) {
            this.transactionDate = LocalDateTime.now();
        }
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    public enum OrderStatus {
        NEW, PROCESSING, SHIPPED, DELIVERED, CANCELLED
    }

    public enum ShippingStatus {
        PENDING, PACKED, SHIPPED, DELIVERED
    }

    public enum TransactionStatus {
        PENDING, SUCCESS, FAILED, REFUNDED
    }
}
