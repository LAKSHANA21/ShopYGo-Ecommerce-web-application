package com.ecommerce.payload;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class WishlistItemResponse {
    private Long wishlistItemId;
    private Long productId;  // Changed from Product object to productId
    private LocalDateTime addedAt;
}