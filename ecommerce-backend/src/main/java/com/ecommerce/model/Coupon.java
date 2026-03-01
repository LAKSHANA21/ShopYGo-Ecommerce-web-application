package com.ecommerce.model;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "coupons")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Coupon {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(unique = true)
    private String code;
    
    private BigDecimal discountPercentage;
    private Long sellerId;
    private LocalDateTime validFrom;
    private LocalDateTime validTo;
    private Long createdBy;
    
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
