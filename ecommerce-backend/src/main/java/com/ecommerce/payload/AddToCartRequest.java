package com.ecommerce.payload;

import lombok.Data;
import java.util.List;

@Data
public class AddToCartRequest {
    private Long productId;
    private int quantity;
    private List<VariantSelection> variantSelections;

    @Data
    public static class VariantSelection {
        private Long variantId;
        private Long variantValueId;
    }
}