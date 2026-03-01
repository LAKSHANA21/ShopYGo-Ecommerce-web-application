package com.ecommerce.payload;

import lombok.Data;

@Data
public class ProductVariantValueRequest {
    private Long id;
    private Long variantId;
    private String value; // e.g., "Black"
}