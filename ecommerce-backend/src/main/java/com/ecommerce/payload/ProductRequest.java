package com.ecommerce.payload;

import lombok.Data;
import java.math.BigDecimal;

@Data
public class ProductRequest {
    private Long id;
    private Long sellerId;
    private String name;
    private BigDecimal actualPrice;
    private BigDecimal sellingPrice;
    private String thumbnailUrl;
    private String description;
    private BigDecimal mrp;
    private BigDecimal margin;
    private Boolean isActive;
    private String sku;
    private Boolean inStock;
    private Long categoryId;
    private String categoryName;
    private Long subcategoryId;
    private String subcategoryName;
    private Double averageRating;
    private Integer reviewCount;
    private Integer quantity;
    private Integer lowStockThreshold;
    private Integer orderCount; // Added field
}