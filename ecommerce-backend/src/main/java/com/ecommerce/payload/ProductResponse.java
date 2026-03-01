package com.ecommerce.payload;

import lombok.Data;

import java.math.BigDecimal;

@Data
public class ProductResponse {
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
    private CategoryDTO category;
    private SubcategoryDTO subcategory;
    private InventoryDTO inventory;
    private Float averageRating;
    private Integer reviewCount;

    @Data
    public static class CategoryDTO {
        private Long id;
        private String name;
    }

    @Data
    public static class SubcategoryDTO {
        private Long id;
        private String name;
    }

    @Data
    public static class InventoryDTO {
        private Integer quantity;
        private Integer lowStockThreshold;
    }
}