package com.ecommerce.service;

import com.ecommerce.exception.ResourceNotFoundException;
import com.ecommerce.model.Wishlist;
import com.ecommerce.repository.ProductRepository;
import com.ecommerce.repository.WishlistRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class WishlistService {

    private final WishlistRepository wishlistRepository;
    private final ProductRepository productRepository;

    @Transactional(readOnly = true)
    public List<Wishlist> getUserWishlist(Long userId) {
        return wishlistRepository.findByUserId(userId);
    }

    @Transactional
    public Wishlist addToWishlist(Long userId, Long productId) {
        if (wishlistRepository.existsByUserIdAndProductId(userId, productId)) {
            throw new IllegalStateException("Product already in wishlist");
        }

        if (!productRepository.existsById(productId)) {
            throw new ResourceNotFoundException("Product not found");
        }

        Wishlist wishlistItem = Wishlist.builder()
                .userId(userId)
                .productId(productId)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        return wishlistRepository.save(wishlistItem);
    }

    @Transactional
    public void removeFromWishlist(Long userId, Long productId) {
        if (!wishlistRepository.existsByUserIdAndProductId(userId, productId)) {
            throw new ResourceNotFoundException("Wishlist item not found");
        }
        wishlistRepository.deleteByUserIdAndProductId(userId, productId);
    }
}