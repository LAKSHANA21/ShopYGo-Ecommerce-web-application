package com.ecommerce.payload;

import lombok.Data;

@Data
public class ProductImageRequest {
    private Long id;
    private Long productId;
    private String imageUrl;
}