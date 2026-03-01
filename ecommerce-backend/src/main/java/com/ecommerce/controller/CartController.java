package com.ecommerce.controller;

import com.ecommerce.exception.ResourceNotFoundException;
import com.ecommerce.model.Cart;
import com.ecommerce.model.CartItem;
import com.ecommerce.model.CartItemVariant;
import com.ecommerce.payload.CartItemResponse;
import com.ecommerce.service.CartItemService;
import com.ecommerce.service.CartService;
import com.ecommerce.service.ProductService;
import jakarta.transaction.Transactional;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/cart")
@RequiredArgsConstructor
public class CartController {

    private final CartService cartService;
    private final ProductService productService;
    private final CartItemService cartItemService;
    private final com.ecommerce.service.UserService userService;

    @PostMapping
    public ResponseEntity<Cart> createCart(@RequestBody Cart cart) {
        Long userId = getCurrentUserId();
        cart.setUserId(userId);
        cart.setCreatedAt(LocalDateTime.now());
        cart.setUpdatedAt(LocalDateTime.now());
        Cart savedCart = cartService.save(cart);
        return ResponseEntity.ok(savedCart);
    }

    @PostMapping("/{cartId}/items")
    public ResponseEntity<CartItem> addToCart(
            @PathVariable Long cartId,
            @RequestBody CartItemRequest cartItemRequest) {
        Optional<Cart> cartOpt = cartService.findById(cartId);
        if (cartOpt.isEmpty()) {
            throw new ResourceNotFoundException("Cart not found with id " + cartId);
        }
        Long userId = getCurrentUserId();
        if (!cartOpt.get().getUserId().equals(userId)) {
            throw new ResourceNotFoundException("Cart does not belong to user");
        }
        if (productService.findById(cartItemRequest.getProductId()).isEmpty()) {
            throw new ResourceNotFoundException("Product not found with id " + cartItemRequest.getProductId());
        }

        // Create CartItem
        CartItem cartItem = new CartItem();
        cartItem.setCartId(cartId);
        cartItem.setProductId(cartItemRequest.getProductId());
        cartItem.setQuantity(cartItemRequest.getQuantity());
        cartItem.setCreatedAt(LocalDateTime.now());
        cartItem.setUpdatedAt(LocalDateTime.now());

        // Add selected variants
        List<CartItemVariant> selectedVariants = new ArrayList<>();
        if (cartItemRequest.getSelectedVariants() != null) {
            for (CartItemRequest.VariantSelection selection : cartItemRequest.getSelectedVariants()) {
                CartItemVariant variant = new CartItemVariant();
                variant.setVariantId(selection.getVariantId());
                variant.setVariantValueId(selection.getVariantValueId());
                selectedVariants.add(variant);
            }
        }
        cartItem.setSelectedVariants(selectedVariants);

        CartItem savedCartItem = cartItemService.save(cartItem);
        return ResponseEntity.ok(savedCartItem);
    }

    @GetMapping("/{cartId}")
    public ResponseEntity<Cart> getCart(@PathVariable Long cartId) {
        Optional<Cart> cartOpt = cartService.findById(cartId);
        if (cartOpt.isEmpty()) {
            throw new ResourceNotFoundException("Cart not found with id " + cartId);
        }
        Long userId = getCurrentUserId();
        if (!cartOpt.get().getUserId().equals(userId)) {
            throw new ResourceNotFoundException("Cart does not belong to user");
        }
        return ResponseEntity.ok(cartOpt.get());
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<Cart> getCartByUserId(@PathVariable Long userId) {
        Long authenticatedUserId = getCurrentUserId();
        if (!userId.equals(authenticatedUserId)) {
            throw new ResourceNotFoundException("Unauthorized access to cart");
        }
        Optional<Cart> cartOpt = cartService.findByUserId(userId);
        if (cartOpt.isEmpty()) {
            Cart newCart = new Cart();
            newCart.setUserId(userId);
            newCart.setCreatedAt(LocalDateTime.now());
            newCart.setUpdatedAt(LocalDateTime.now());
            Cart savedCart = cartService.save(newCart);
            return ResponseEntity.ok(savedCart);
        }
        return ResponseEntity.ok(cartOpt.get());
    }

    @GetMapping("/{cartId}/items")
    public ResponseEntity<List<CartItemResponse>> getCartItems(@PathVariable Long cartId) {
        if (cartService.findById(cartId).isEmpty()) {
            throw new ResourceNotFoundException("Cart not found with id " + cartId);
        }
        Long userId = getCurrentUserId();
        if (!cartService.findById(cartId).get().getUserId().equals(userId)) {
            throw new ResourceNotFoundException("Cart does not belong to user");
        }
        List<CartItemResponse> cartItems = cartItemService.findByCartId(cartId);
        return ResponseEntity.ok(cartItems);
    }

    @DeleteMapping("/{cartId}/items/{itemId}")
    @Transactional
    public ResponseEntity<Void> deleteCartItem(
            @PathVariable Long cartId,
            @PathVariable Long itemId) {
        Cart cart = cartService.findById(cartId)
                .orElseThrow(() -> new ResourceNotFoundException("Cart not found with id " + cartId));
        Long userId = getCurrentUserId();
        if (!cart.getUserId().equals(userId)) {
            throw new ResourceNotFoundException("Cart does not belong to user");
        }
        cartItemService.deleteCartItem(cartId, itemId);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/{cartId}/items/{itemId}")
    @Transactional
    public ResponseEntity<CartItem> updateCartItem(
            @PathVariable Long cartId,
            @PathVariable Long itemId,
            @RequestBody CartItemUpdateRequest updateRequest) {
        Cart cart = cartService.findById(cartId)
                .orElseThrow(() -> new ResourceNotFoundException("Cart not found with id " + cartId));
        Long userId = getCurrentUserId();
        if (!cart.getUserId().equals(userId)) {
            throw new ResourceNotFoundException("Cart does not belong to user");
        }
        CartItem updatedItem = cartItemService.updateCartItem(cartId, itemId, updateRequest);
        return ResponseEntity.ok(updatedItem);
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

    // DTO for adding cart item
    @Data
    public static class CartItemRequest {
        private Long productId;
        private Integer quantity;
        private List<VariantSelection> selectedVariants;

        @Data
        public static class VariantSelection {
            private Long variantId;
            private Long variantValueId;
        }
    }

    // DTO for updating cart item
    @Data
    public static class CartItemUpdateRequest {
        private Integer quantity;
        private List<VariantSelection> selectedVariants;

        @Data
        public static class VariantSelection {
            private Long variantId;
            private Long variantValueId;
        }
    }
}