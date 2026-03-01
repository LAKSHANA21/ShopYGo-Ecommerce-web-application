package com.ecommerce.model;

import lombok.Builder;
import lombok.Data;

import com.fasterxml.jackson.annotation.JsonBackReference;

import jakarta.persistence.*;

@Data
@Entity
@Table(name = "cart_item_variants")
public class CartItemVariant {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "cart_item_id", nullable = false)
    @JsonBackReference
    private CartItem cartItem;

    @Column(name = "variant_id", nullable = false)
    private Long variantId;

    @Column(name = "variant_value_id", nullable = false)
    private Long variantValueId;
}