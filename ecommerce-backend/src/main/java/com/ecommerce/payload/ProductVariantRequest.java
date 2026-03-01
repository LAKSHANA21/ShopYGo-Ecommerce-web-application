package com.ecommerce.payload;

import lombok.Data;
import java.util.List;

@Data
public class ProductVariantRequest {
    private Long id;
    private Long productId;
    private String variantType; // e.g., "Color", "Size"
    private List<ProductVariantValueRequest> values; // Not used in POST /variants, kept for compatibility
}