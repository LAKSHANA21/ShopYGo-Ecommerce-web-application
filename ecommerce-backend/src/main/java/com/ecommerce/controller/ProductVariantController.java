package com.ecommerce.controller;

import com.ecommerce.exception.ResourceNotFoundException;
import com.ecommerce.model.Product;
import com.ecommerce.model.ProductVariant;
import com.ecommerce.model.ProductVariantValue;
import com.ecommerce.payload.ApiResponse;
import com.ecommerce.payload.ProductVariantRequest;
import com.ecommerce.payload.ProductVariantValueRequest;
import com.ecommerce.service.ProductService;
import com.ecommerce.service.ProductVariantService;
import com.ecommerce.service.ProductVariantValueService;
import com.ecommerce.service.SellerService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import jakarta.annotation.security.PermitAll;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
@CrossOrigin("*")
public class ProductVariantController {

    private final ProductVariantService productVariantService;
    private final ProductVariantValueService productVariantValueService;
    private final ProductService productService;
    private final SellerService sellerService;

    // Create a new ProductVariant for a specific product
    @PostMapping("/products/{productId}/variants")
    @PreAuthorize("hasRole('SELLER')")
    @Transactional
    public ResponseEntity<ProductVariantRequest> createProductVariant(
            @PathVariable Long productId,
            @RequestBody ProductVariantRequest variantRequest) {
        Long sellerId = getAuthenticatedSellerId();
        Product product = productService.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with id " + productId));
        if (!product.getSellerId().equals(sellerId)) {
            throw new ResourceNotFoundException("You do not have permission to add variants to this product");
        }
        if (variantRequest.getVariantType() == null || variantRequest.getVariantType().trim().isEmpty()) {
            return ResponseEntity.badRequest().body(new ProductVariantRequest());
        }
        ProductVariant variant = new ProductVariant();
        variant.setProductId(productId);
        variant.setVariantType(variantRequest.getVariantType());
        ProductVariant savedVariant = productVariantService.save(variant, sellerId);
        return ResponseEntity.status(HttpStatus.CREATED).body(mapToProductVariantRequest(savedVariant));
    }

    // Get all ProductVariants for a specific product
    @GetMapping("/products/{productId}/variants")
    public ResponseEntity<List<ProductVariantRequest>> getProductVariants(@PathVariable Long productId) {
        List<ProductVariant> variants = productVariantService.findByProductId(productId);
        return ResponseEntity.ok(variants.stream()
                .map(this::mapToProductVariantRequest)
                .collect(Collectors.toList()));
    }

    // Update a ProductVariant
    @PutMapping("/variants/{variantId}")
    @PreAuthorize("hasRole('SELLER')")
    @Transactional
    public ResponseEntity<ProductVariantRequest> updateProductVariant(
            @PathVariable Long variantId,
            @RequestBody ProductVariantRequest variantRequest) {
        Long sellerId = getAuthenticatedSellerId();
        ProductVariant existingVariant = productVariantService.findById(variantId);
        Product product = productService.findById(existingVariant.getProductId())
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with id " + existingVariant.getProductId()));
        if (!product.getSellerId().equals(sellerId)) {
            throw new ResourceNotFoundException("You do not have permission to update this variant");
        }
        if (variantRequest.getVariantType() != null && !variantRequest.getVariantType().trim().isEmpty()) {
            existingVariant.setVariantType(variantRequest.getVariantType());
        }
        ProductVariant updatedVariant = productVariantService.save(existingVariant, sellerId);
        return ResponseEntity.ok(mapToProductVariantRequest(updatedVariant));
    }

    // Delete a ProductVariant
    @DeleteMapping("/variants/{variantId}")
    @PreAuthorize("hasRole('SELLER')")
    @Transactional
    public ResponseEntity<ApiResponse> deleteProductVariant(@PathVariable Long variantId) {
        Long sellerId = getAuthenticatedSellerId();
        productVariantService.deleteById(variantId, sellerId);
        return ResponseEntity.ok(new ApiResponse(true, "Variant deleted successfully"));
    }

    // Create a new ProductVariantValue for a specific ProductVariant
    @PostMapping("/variants/{variantId}/values")
    @PreAuthorize("hasRole('SELLER')")
    @Transactional
    public ResponseEntity<ProductVariantValueRequest> createProductVariantValue(
            @PathVariable Long variantId,
            @RequestBody ProductVariantValueRequest valueRequest) {
        Long sellerId = getAuthenticatedSellerId();
        ProductVariant variant = productVariantService.findById(variantId);
        Product product = productService.findById(variant.getProductId())
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with id " + variant.getProductId()));
        if (!product.getSellerId().equals(sellerId)) {
            throw new ResourceNotFoundException("You do not have permission to add values to this variant");
        }
        if (valueRequest.getValue() == null || valueRequest.getValue().trim().isEmpty()) {
            return ResponseEntity.badRequest().body(new ProductVariantValueRequest());
        }
        ProductVariantValue value = new ProductVariantValue();
        value.setVariant(variant);
        value.setValue(valueRequest.getValue());
        ProductVariantValue savedValue = productVariantValueService.save(value, sellerId);
        return ResponseEntity.status(HttpStatus.CREATED).body(mapToProductVariantValueRequest(savedValue));
    }

    // Get all ProductVariantValues for a specific ProductVariant
    @GetMapping("/variants/{variantId}/values")
    @PermitAll
    public ResponseEntity<List<ProductVariantValueRequest>> getProductVariantValues(@PathVariable Long variantId) {
        // Validate variant existence
        ProductVariant variant = productVariantService.findById(variantId);
        if (variant == null) {
            throw new ResourceNotFoundException("Variant not found with id " + variantId);
        }
        List<ProductVariantValue> values = productVariantValueService.findByVariantId(variantId);
        return ResponseEntity.ok(values.stream()
                .map(this::mapToProductVariantValueRequest)
                .collect(Collectors.toList()));
    }

    // Update a ProductVariantValue
    @PutMapping("/variants/{variantId}/values/{valueId}")
    @PreAuthorize("hasRole('SELLER')")
    @Transactional
    public ResponseEntity<ProductVariantValueRequest> updateProductVariantValue(
            @PathVariable Long variantId,
            @PathVariable Long valueId,
            @RequestBody ProductVariantValueRequest valueRequest) {
        Long sellerId = getAuthenticatedSellerId();
        ProductVariantValue existingValue = productVariantValueService.findById(valueId)
                .orElseThrow(() -> new ResourceNotFoundException("Variant value not found with id " + valueId));
        if (!existingValue.getVariant().getId().equals(variantId)) {
            throw new ResourceNotFoundException("Variant value does not belong to variant with id " + variantId);
        }
        Product product = productService.findById(existingValue.getVariant().getProductId())
                .orElseThrow(() -> new ResourceNotFoundException("Product not found"));
        if (!product.getSellerId().equals(sellerId)) {
            throw new ResourceNotFoundException("You do not have permission to update this variant value");
        }
        if (valueRequest.getValue() != null && !valueRequest.getValue().trim().isEmpty()) {
            existingValue.setValue(valueRequest.getValue());
        }
        ProductVariantValue updatedValue = productVariantValueService.save(existingValue, sellerId);
        return ResponseEntity.ok(mapToProductVariantValueRequest(updatedValue));
    }

    // Delete a ProductVariantValue
    @DeleteMapping("/variants/{variantId}/values/{valueId}")
    @PreAuthorize("hasRole('SELLER')")
    @Transactional
    public ResponseEntity<ApiResponse> deleteProductVariantValue(
            @PathVariable Long variantId,
            @PathVariable Long valueId) {
        Long sellerId = getAuthenticatedSellerId();
        ProductVariantValue value = productVariantValueService.findById(valueId)
                .orElseThrow(() -> new ResourceNotFoundException("Variant value not found with id " + valueId));
        if (!value.getVariant().getId().equals(variantId)) {
            throw new ResourceNotFoundException("Variant value does not belong to variant with id " + variantId);
        }
        productVariantValueService.deleteById(valueId, sellerId);
        return ResponseEntity.ok(new ApiResponse(true, "Variant value deleted successfully"));
    }

    // Helper methods
    private Long getAuthenticatedSellerId() {
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
        return sellerService.findByEmailOrMobile(username)
                .orElseThrow(() -> new ResourceNotFoundException("Seller not found with username: " + username))
                .getId();
    }

    private ProductVariantRequest mapToProductVariantRequest(ProductVariant variant) {
        ProductVariantRequest request = new ProductVariantRequest();
        request.setId(variant.getId());
        request.setProductId(variant.getProductId());
        request.setVariantType(variant.getVariantType());
        request.setValues(variant.getValues() != null ? variant.getValues().stream()
                .map(this::mapToProductVariantValueRequest) // Map to ProductVariantValueRequest
                .collect(Collectors.toList()) : List.of());
        return request;
    }

    private ProductVariantValueRequest mapToProductVariantValueRequest(ProductVariantValue value) {
        ProductVariantValueRequest request = new ProductVariantValueRequest();
        request.setId(value.getId());
        request.setVariantId(value.getVariant().getId());
        request.setValue(value.getValue());
        return request;
    }
}