package com.ecommerce.model;

import com.fasterxml.jackson.annotation.JsonBackReference;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "order_item_variants")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OrderItemVariant {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_item_id", nullable = false)
    @JsonBackReference
    private OrderItem orderItem;

    @Column(name = "variant_id", nullable = false)
    private Long variantId;

    @Column(name = "variant_value_id", nullable = false)
    private Long variantValueId;
}