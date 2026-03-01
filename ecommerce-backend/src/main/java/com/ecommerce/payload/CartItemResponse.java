package com.ecommerce.payload;

import lombok.Data;
import java.time.LocalDateTime;
import java.util.List;

@Data
public class CartItemResponse {
    private Long id;
    private Long productId;
    private Long cartId;
    private int quantity;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private List<VariantSelection> selectedVariants;

    @Data
    public static class VariantSelection {
    	private Long id;
        private Long variantId;
        private Long variantValueId;
        private String variantType;
        private String variantValue;
    }
}