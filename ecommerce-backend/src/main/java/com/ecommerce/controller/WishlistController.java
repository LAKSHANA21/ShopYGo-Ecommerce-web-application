package com.ecommerce.controller;

import com.ecommerce.exception.ResourceNotFoundException;
import com.ecommerce.model.Wishlist;
import com.ecommerce.payload.ApiResponse;
import com.ecommerce.service.UserService;
import com.ecommerce.service.WishlistService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/wishlist")
@RequiredArgsConstructor
@CrossOrigin("*")
public class WishlistController {

    private final WishlistService wishlistService;
    private final UserService userService;

    @GetMapping
    public ResponseEntity<List<Wishlist>> getUserWishlist() {
        Long userId = getCurrentUserId();
        return ResponseEntity.ok(wishlistService.getUserWishlist(userId));
    }

    @PostMapping("/{productId}")
    public ResponseEntity<ApiResponse> addToWishlist(@PathVariable Long productId) {
        Long userId = getCurrentUserId();
        wishlistService.addToWishlist(userId, productId);
        return ResponseEntity.ok(new ApiResponse(true, "Product added to wishlist"));
    }

    @DeleteMapping("/{productId}")
    public ResponseEntity<ApiResponse> removeFromWishlist(@PathVariable Long productId) {
        Long userId = getCurrentUserId();
        wishlistService.removeFromWishlist(userId, productId);
        return ResponseEntity.ok(new ApiResponse(true, "Product removed from wishlist"));
    }

    private Long getCurrentUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new ResourceNotFoundException("User not authenticated");
        }
        
        String username;
        Object principal = authentication.getPrincipal();
        
        if (principal instanceof UserDetails) {
            username = ((UserDetails) principal).getUsername();
        } else if (principal instanceof String) {
            username = (String) principal;
        } else {
            throw new IllegalStateException("Unexpected principal type: " + principal.getClass());
        }
        
        return userService.findByEmailOrMobile(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with username: " + username))
                .getId();
    }
}