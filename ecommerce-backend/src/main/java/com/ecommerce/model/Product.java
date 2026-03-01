package com.ecommerce.model;

import jakarta.persistence.*;
import lombok.*;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "products")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonIgnoreProperties({"inventory.product", "images.product", "variants.product"})
public class Product {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long sellerId;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private BigDecimal actualPrice;

    @Column(nullable = false)
    private BigDecimal sellingPrice;

    @Column(nullable = true)
    private String thumbnailUrl;

    @Column(nullable = false)
    private String description;

    @Column(nullable = true)
    private BigDecimal mrp;

    @Column(nullable = false)
    private BigDecimal margin;

    @Column(nullable = false, columnDefinition = "BOOLEAN DEFAULT TRUE")
    private Boolean isActive;

    @Column(nullable = false, unique = true)
    private String sku;

    @Column(nullable = false, columnDefinition = "BOOLEAN DEFAULT TRUE")
    private Boolean inStock;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id", nullable = false)
    private Category category;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "subcategory_id", nullable = false)
    private Subcategory subcategory;

    @OneToMany(mappedBy = "productId", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<ProductImage> images;

    @OneToMany(mappedBy = "productId", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<ProductVariant> variants;

    @OneToOne(mappedBy = "product", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private Inventory inventory;

    @Column(nullable = true)
    private Float averageRating;

    @Column(nullable = true)
    private Integer reviewCount;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @PrePersist
    @PreUpdate
    private void calculateSellingPrice() {
        if (actualPrice != null && margin != null) {
            this.sellingPrice = actualPrice.add(margin);
        }
    }
}