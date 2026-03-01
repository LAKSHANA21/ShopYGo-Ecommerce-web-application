package com.ecommerce.service;

import com.ecommerce.exception.ResourceNotFoundException;
import com.ecommerce.model.CartItem;
import com.ecommerce.model.CartItemVariant;
import com.ecommerce.payload.CartItemResponse;
import com.ecommerce.repository.CartItemRepository;
import com.ecommerce.repository.ProductVariantRepository;
import com.ecommerce.repository.ProductVariantValueRepository;
import com.ecommerce.repository.CartItemVariantRepository;
import com.ecommerce.controller.CartController.CartItemUpdateRequest;
import lombok.RequiredArgsConstructor;

import org.hibernate.Hibernate;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CartItemService {

    private final CartItemRepository cartItemRepository;
    private final CartItemVariantRepository cartItemVariantRepository;
    private final ProductVariantRepository productVariantRepository;
    private final ProductVariantValueRepository productVariantValueRepository;
    private static final Logger logger = LoggerFactory.getLogger(CartItemService.class);

    @Transactional
    public CartItem save(CartItem cartItem) {
        logger.debug("Saving cart item for productId: {}", cartItem.getProductId());

        boolean hasVariants = productVariantRepository.existsByProductId(cartItem.getProductId());
        logger.debug("Product {} has variants: {}", cartItem.getProductId(), hasVariants);

        // Validate variants
        if (hasVariants) {
            if (cartItem.getSelectedVariants() == null || cartItem.getSelectedVariants().isEmpty()) {
                logger.error("At least one variant selection is required for product {}", cartItem.getProductId());
                throw new IllegalArgumentException("At least one variant selection is required for this product");
            }

            for (CartItemVariant selectedVariant : cartItem.getSelectedVariants()) {
                Long variantId = selectedVariant.getVariantId();
                Long variantValueId = selectedVariant.getVariantValueId();

                // Validate variant existence
                if (!productVariantRepository.existsById(variantId)) {
                    logger.error("Variant not found with id {}", variantId);
                    throw new ResourceNotFoundException("Variant not found with id " + variantId);
                }
                if (!productVariantRepository.existsByIdAndProductId(variantId, cartItem.getProductId())) {
                    logger.error("Variant {} does not belong to product {}", variantId, cartItem.getProductId());
                    throw new ResourceNotFoundException("Variant " + variantId + " does not belong to product " + cartItem.getProductId());
                }

                // Validate variant value existence
                if (!productVariantValueRepository.existsById(variantValueId)) {
                    logger.error("Variant value not found with id {}", variantValueId);
                    throw new ResourceNotFoundException("Variant value not found with id " + variantValueId);
                }
                if (!productVariantValueRepository.existsByIdAndVariantId(variantValueId, variantId)) {
                    logger.error("Variant value {} does not belong to variant {}", variantValueId, variantId);
                    throw new ResourceNotFoundException("Variant value " + variantValueId + " does not belong to variant " + variantId);
                }

                // Set cart item reference
                selectedVariant.setCartItem(cartItem);
            }
        } else {
            if (cartItem.getSelectedVariants() != null && !cartItem.getSelectedVariants().isEmpty()) {
                logger.error("Product {} does not have variants; selectedVariants must be empty", cartItem.getProductId());
                throw new IllegalArgumentException("Product does not have variants; selectedVariants must be empty");
            }
        }

        CartItem savedItem = cartItemRepository.save(cartItem);
        logger.info("Saved cart item with id: {} for cart: {}", savedItem.getId(), cartItem.getCartId());
        return savedItem;
    }

    @Transactional(readOnly = true)
    public List<CartItemResponse> findByCartId(Long cartId) {
        logger.debug("Fetching cart items for cartId: {}", cartId);
        List<CartItem> cartItems = cartItemRepository.findByCartId(cartId);
        return cartItems.stream().map(this::mapToCartItemResponse).collect(Collectors.toList());
    }

    @Transactional
    public void deleteCartItem(Long cartId, Long itemId) {
        logger.debug("Deleting cart item id: {} from cart: {}", itemId, cartId);
        CartItem item = cartItemRepository.findByIdAndCartId(itemId, cartId)
                .orElseThrow(() -> {
                    logger.error("Cart item not found with id {} in cart {}", itemId, cartId);
                    return new ResourceNotFoundException("Cart item not found with id " + itemId + " in cart " + cartId);
                });
        cartItemRepository.delete(item);
        logger.info("Deleted cart item id: {} from cart: {}", itemId, cartId);
    }

    @Transactional
    public CartItem updateCartItem(Long cartId, Long itemId, CartItemUpdateRequest updateRequest) {
        logger.debug("Updating cart item id: {} in cart: {}", itemId, cartId);

        // Find the cart item
        CartItem item = cartItemRepository.findByIdAndCartId(itemId, cartId)
                .orElseThrow(() -> {
                    logger.error("Cart item not found with id {} in cart {}", itemId, cartId);
                    return new ResourceNotFoundException("Cart item not found with id " + itemId + " in cart " + cartId);
                });

        // Update quantity if provided
        if (updateRequest.getQuantity() != null) {
            if (updateRequest.getQuantity() < 1) {
                logger.error("Quantity must be at least 1 for cart item id: {}", itemId);
                throw new IllegalArgumentException("Quantity must be at least 1");
            }
            item.setQuantity(updateRequest.getQuantity());
        }

        // Update variants if provided
        if (updateRequest.getSelectedVariants() != null) {
            boolean hasVariants = productVariantRepository.existsByProductId(item.getProductId());
            if (!hasVariants && !updateRequest.getSelectedVariants().isEmpty()) {
                logger.error("Product {} does not have variants; selectedVariants must be empty", item.getProductId());
                throw new IllegalArgumentException("Product does not have variants; selectedVariants must be empty");
            }
            if (hasVariants && updateRequest.getSelectedVariants().isEmpty()) {
                logger.error("At least one variant selection is required for product {}", item.getProductId());
                throw new IllegalArgumentException("At least one variant selection is required for this product");
            }

            // Clear existing variants
            item.getSelectedVariants().clear();

            // Add new variants
            List<CartItemVariant> newVariants = new ArrayList<>();
            for (CartItemUpdateRequest.VariantSelection selection : updateRequest.getSelectedVariants()) {
                Long variantId = selection.getVariantId();
                Long variantValueId = selection.getVariantValueId();

                // Validate variant existence
                if (!productVariantRepository.existsById(variantId)) {
                    logger.error("Variant not found with id {}", variantId);
                    throw new ResourceNotFoundException("Variant not found with id " + variantId);
                }
                if (!productVariantRepository.existsByIdAndProductId(variantId, item.getProductId())) {
                    logger.error("Variant {} does not belong to product {}", variantId, item.getProductId());
                    throw new ResourceNotFoundException("Variant " + variantId + " does not belong to product " + item.getProductId());
                }

                // Validate variant value existence
                if (!productVariantValueRepository.existsById(variantValueId)) {
                    logger.error("Variant value not found with id {}", variantValueId);
                    throw new ResourceNotFoundException("Variant value not found with id " + variantValueId);
                }
                if (!productVariantValueRepository.existsByIdAndVariantId(variantValueId, variantId)) {
                    logger.error("Variant value {} does not belong to variant {}", variantValueId, variantId);
                    throw new ResourceNotFoundException("Variant value " + variantValueId + " does not belong to variant " + variantId);
                }

                // Create new variant
                CartItemVariant variant = new CartItemVariant();
                variant.setVariantId(variantId);
                variant.setVariantValueId(variantValueId);
                variant.setCartItem(item);
                newVariants.add(variant);
            }
            item.setSelectedVariants(newVariants);
        }

        // Update timestamp
        item.setUpdatedAt(LocalDateTime.now());

        // Save updated item
        CartItem updatedItem = cartItemRepository.save(item);
        logger.info("Updated cart item id: {} in cart: {}", itemId, cartId);
        return updatedItem;
    }
    private CartItemResponse mapToCartItemResponse(CartItem cartItem) {
        CartItemResponse response = new CartItemResponse();
        response.setId(cartItem.getId());
        response.setCartId(cartItem.getCartId());
        response.setProductId(cartItem.getProductId());
        response.setQuantity(cartItem.getQuantity());
        response.setCreatedAt(cartItem.getCreatedAt());
        response.setUpdatedAt(cartItem.getUpdatedAt());
        // Map selectedVariants
        List<CartItemResponse.VariantSelection> variantSelections = cartItem.getSelectedVariants().stream()
                .map(variant -> {
                    CartItemResponse.VariantSelection selection = new CartItemResponse.VariantSelection();
                    selection.setId(variant.getId());
                    selection.setVariantId(variant.getVariantId());
                    selection.setVariantValueId(variant.getVariantValueId());
                    return selection;
                })
                .collect(Collectors.toList());
        response.setSelectedVariants(variantSelections);
        return response;
    }
}