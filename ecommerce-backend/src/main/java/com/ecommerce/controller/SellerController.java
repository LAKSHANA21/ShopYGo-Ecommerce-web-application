package com.ecommerce.controller;

import com.ecommerce.exception.ResourceNotFoundException;
import com.ecommerce.exception.UnauthorizedException;
import com.ecommerce.model.*;
import com.ecommerce.payload.*;
import com.ecommerce.service.*;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/sellers")
@RequiredArgsConstructor
@CrossOrigin("*")
public class SellerController {
    private final SellerService sellerService;
    private final ProductService productService;
    private final ProductVariantService productVariantService;
    private final ProductImageService productImageService;
    private final InventoryService inventoryService;
    private static final Logger logger = LoggerFactory.getLogger(SellerController.class);

    @GetMapping("/{id}")
    public ResponseEntity<Seller> getSellerById(@PathVariable Long id) {
        return ResponseEntity.ok(sellerService.getSellerById(id));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('SELLER')")
    public ResponseEntity<Seller> updateSeller(@PathVariable Long id, @RequestBody Seller seller) {
        return ResponseEntity.ok(sellerService.updateSeller(id, seller));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('SELLER')")
    public ResponseEntity<ApiResponse> deleteSeller(@PathVariable Long id) {
        sellerService.deleteSeller(id);
        return ResponseEntity.ok(new ApiResponse(true, "Seller deleted successfully"));
    }

    @GetMapping("/{id}/products")
    public ResponseEntity<List<ProductResponse>> getSellerProducts(@PathVariable Long id) {
        List<Product> products = productService.findBySellerId(id);
        List<ProductResponse> response = products.stream().map(this::mapToProductResponse).collect(Collectors.toList());
        return ResponseEntity.ok(response);
    }

    @PostMapping("/products")
    @PreAuthorize("hasRole('SELLER')")
    public ResponseEntity<ProductResponse> createProduct(@RequestBody ProductRequest productRequest, Authentication authentication) {
        Long sellerId = extractSellerIdFromAuth(authentication);
        Product product = mapToProduct(productRequest, sellerId);
        Product savedProduct = productService.save(product);

        inventoryService.updateInventory(
                savedProduct.getId(),
                productRequest.getQuantity() != null ? productRequest.getQuantity() : 0,
                productRequest.getLowStockThreshold() != null ? productRequest.getLowStockThreshold() : 10
        );

        return ResponseEntity.ok(mapToProductResponse(savedProduct));
    }

    @PutMapping("/products/{productId}")
    @PreAuthorize("hasRole('SELLER')")
    public ResponseEntity<ProductResponse> updateProduct(@PathVariable Long productId, @RequestBody ProductRequest productRequest, Authentication authentication) {
        Product existingProduct = productService.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with id " + productId));
        Long sellerId = extractSellerIdFromAuth(authentication);

        if (!existingProduct.getSellerId().equals(sellerId)) {
            return ResponseEntity.status(403).body(null);
        }

        updateProductFields(existingProduct, productRequest);
        Product updatedProduct = productService.save(existingProduct);

        if (productRequest.getQuantity() != null || productRequest.getLowStockThreshold() != null) {
            inventoryService.updateInventory(
                    productId,
                    productRequest.getQuantity(),
                    productRequest.getLowStockThreshold()
            );
        }

        return ResponseEntity.ok(mapToProductResponse(updatedProduct));
    }

    @DeleteMapping("/products/{productId}")
    @PreAuthorize("hasRole('SELLER')")
    public ResponseEntity<ApiResponse> deleteProduct(@PathVariable Long productId, Authentication authentication) {
        Product product = productService.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with id " + productId));
        Long sellerId = extractSellerIdFromAuth(authentication);

        if (!product.getSellerId().equals(sellerId)) {
            return ResponseEntity.status(403).body(new ApiResponse(false, "Unauthorized"));
        }

        productService.deleteById(productId);
        return ResponseEntity.ok(new ApiResponse(true, "Product deleted successfully"));
    }

    @PostMapping("/products/{productId}/variants")
    @PreAuthorize("hasRole('SELLER')")
    public ResponseEntity<?> createVariant(@PathVariable Long productId, @RequestBody ProductVariantRequest variantRequest, Authentication authentication) {
        logger.debug("Creating variant for productId: {}", productId);
        try {
            Long sellerId = extractSellerIdFromAuth(authentication);
            if (variantRequest.getVariantType() == null || variantRequest.getVariantType().trim().isEmpty()) {
                logger.warn("Variant type is empty for productId: {}", productId);
                return ResponseEntity.badRequest().body(new ApiResponse(false, "Variant type cannot be empty"));
            }
            ProductVariant variant = new ProductVariant();
            variant.setProductId(productId);
            variant.setVariantType(variantRequest.getVariantType());
            List<ProductVariantValue> values = variantRequest.getValues() != null
                    ? variantRequest.getValues().stream()
                        .filter(v -> v != null && v.getValue() != null && !v.getValue().trim().isEmpty()) // Check v.getValue()
                        .map(v -> ProductVariantValue.builder().value(v.getValue()).variant(variant).build()) // Use v.getValue()
                        .collect(Collectors.toList())
                    : new ArrayList<>();
            variant.setValues(values);
            ProductVariant savedVariant = productVariantService.save(variant, sellerId);
            logger.info("Successfully created variant id: {} for productId: {}", savedVariant.getId(), productId);
            return ResponseEntity.ok(savedVariant);
        } catch (ResourceNotFoundException e) {
            logger.error("Resource not found for productId: {}", productId, e);
            return ResponseEntity.status(404).body(new ApiResponse(false, e.getMessage()));
        } catch (IllegalArgumentException e) {
            logger.error("Invalid argument for productId: {}", productId, e);
            return ResponseEntity.badRequest().body(new ApiResponse(false, e.getMessage()));
        } catch (Exception e) {
            logger.error("Error creating variant for productId: {}", productId, e);
            return ResponseEntity.status(500).body(new ApiResponse(false, "Failed to create variant: " + e.getMessage()));
        }
    }

    @PutMapping("/products/variants/{variantId}")
    @PreAuthorize("hasRole('SELLER')")
    public ResponseEntity<?> updateVariant(@PathVariable Long variantId, @RequestBody ProductVariantRequest variantRequest, Authentication authentication) {
        try {
            Long sellerId = extractSellerIdFromAuth(authentication);
            ProductVariant existingVariant = productVariantService.findById(variantId);
            if (variantRequest.getVariantType() != null && !variantRequest.getVariantType().trim().isEmpty()) {
                existingVariant.setVariantType(variantRequest.getVariantType());
            }
            if (variantRequest.getValues() != null) {
                existingVariant.getValues().clear();
                List<ProductVariantValue> values = variantRequest.getValues().stream()
                        .filter(v -> v != null && v.getValue() != null && !v.getValue().trim().isEmpty()) // Check v.getValue()
                        .map(v -> ProductVariantValue.builder().value(v.getValue()).variant(existingVariant).build()) // Use v.getValue()
                        .collect(Collectors.toList());
                existingVariant.setValues(values);
            }
            ProductVariant updatedVariant = productVariantService.save(existingVariant, sellerId);
            return ResponseEntity.ok(updatedVariant);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(new ApiResponse(false, "Failed to update variant: " + e.getMessage()));
        }
    }

    @DeleteMapping("/products/variants/{variantId}")
    @PreAuthorize("hasRole('SELLER')")
    public ResponseEntity<ApiResponse> deleteVariant(@PathVariable Long variantId, Authentication authentication) {
        Long sellerId = extractSellerIdFromAuth(authentication);
        productVariantService.deleteById(variantId, sellerId);
        return ResponseEntity.ok(new ApiResponse(true, "Variant deleted successfully"));
    }

    @GetMapping("/products/{productId}/images")
    public ResponseEntity<?> getImagesByProductId(@PathVariable Long productId, Authentication authentication) {
        logger.debug("Fetching images for productId: {}", productId);
        try {
            Long sellerId = extractSellerIdFromAuth(authentication);
            Product product = productService.findById(productId)
                    .orElseThrow(() -> new ResourceNotFoundException("Product not found with id " + productId));
            if (!product.getSellerId().equals(sellerId)) {
                logger.warn("Seller {} not authorized for product {}", sellerId, productId);
                return ResponseEntity.status(403).body(new ApiResponse(false, "Unauthorized"));
            }
            List<ProductImage> images = productImageService.findByProductId(productId);
            logger.info("Fetched {} images for productId: {}", images.size(), productId);
            return ResponseEntity.ok(images);
        } catch (ResourceNotFoundException e) {
            logger.error("Resource not found for productId: {}", productId, e);
            return ResponseEntity.status(404).body(new ApiResponse(false, e.getMessage()));
        } catch (Exception e) {
            logger.error("Error fetching images for productId: {}", productId, e);
            return ResponseEntity.status(500).body(new ApiResponse(false, "Failed to fetch images: " + e.getMessage()));
        }
    }

    @PostMapping("/products/{productId}/images")
    @PreAuthorize("hasRole('SELLER')")
    public ResponseEntity<?> createImage(@PathVariable Long productId, @RequestBody ProductImageRequest imageRequest, Authentication authentication) {
        try {
            Long sellerId = extractSellerIdFromAuth(authentication);
            ProductImage image = new ProductImage();
            image.setProductId(productId);
            image.setImageUrl(imageRequest.getImageUrl());
            ProductImage savedImage = productImageService.save(image, sellerId);
            return ResponseEntity.ok(savedImage);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(new ApiResponse(false, "Failed to create image: " + e.getMessage()));
        }
    }

    @PutMapping("/products/images/{imageId}")
    @PreAuthorize("hasRole('SELLER')")
    public ResponseEntity<?> updateImage(@PathVariable Long imageId, @RequestBody ProductImageRequest imageRequest, Authentication authentication) {
        try {
            Long sellerId = extractSellerIdFromAuth(authentication);
            ProductImage existingImage = productImageService.findById(imageId);
            existingImage.setImageUrl(imageRequest.getImageUrl());
            ProductImage updatedImage = productImageService.save(existingImage, sellerId);
            return ResponseEntity.ok(updatedImage);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(new ApiResponse(false, "Failed to update image: " + e.getMessage()));
        }
    }

    @DeleteMapping("/products/images/{imageId}")
    @PreAuthorize("hasRole('SELLER')")
    public ResponseEntity<ApiResponse> deleteImage(@PathVariable Long imageId, Authentication authentication) {
        Long sellerId = extractSellerIdFromAuth(authentication);
        productImageService.deleteById(imageId, sellerId);
        return ResponseEntity.ok(new ApiResponse(true, "Image deleted successfully"));
    }

    private Long extractSellerIdFromAuth(Authentication authentication) {
        String email = authentication.getName();
        return sellerService.findByEmailOrMobile(email)
                .map(Seller::getId)
                .orElseThrow(() -> new ResourceNotFoundException("Seller not found"));
    }

    private ProductResponse mapToProductResponse(Product product) {
        ProductResponse response = new ProductResponse();
        response.setId(product.getId());
        response.setSellerId(product.getSellerId());
        response.setName(product.getName());
        response.setActualPrice(product.getActualPrice());
        response.setSellingPrice(product.getSellingPrice());
        response.setThumbnailUrl(product.getThumbnailUrl());
        response.setDescription(product.getDescription());
        response.setMrp(product.getMrp());
        response.setMargin(product.getMargin());
        response.setIsActive(product.getIsActive());
        response.setSku(product.getSku());
        response.setInStock(product.getInStock());
        response.setAverageRating(product.getAverageRating());
        response.setReviewCount(product.getReviewCount());

        if (product.getCategory() != null) {
            ProductResponse.CategoryDTO category = new ProductResponse.CategoryDTO();
            category.setId(product.getCategory().getId());
            category.setName(product.getCategory().getName());
            response.setCategory(category);
        }

        if (product.getSubcategory() != null) {
            ProductResponse.SubcategoryDTO subcategory = new ProductResponse.SubcategoryDTO();
            subcategory.setId(product.getSubcategory().getId());
            subcategory.setName(product.getSubcategory().getName());
            response.setSubcategory(subcategory);
        }

        if (product.getInventory() != null) {
            ProductResponse.InventoryDTO inventory = new ProductResponse.InventoryDTO();
            inventory.setQuantity(product.getInventory().getQuantity());
            inventory.setLowStockThreshold(product.getInventory().getLowStockThreshold());
            response.setInventory(inventory);
        }

        return response;
    }

    private Product mapToProduct(ProductRequest request, Long sellerId) {
        if (request.getCategoryId() == null || request.getSubcategoryId() == null) {
            throw new IllegalArgumentException("Category ID and Subcategory ID are required");
        }
        Product product = new Product();
        product.setSellerId(sellerId);
        product.setName(request.getName());
        product.setActualPrice(request.getActualPrice());
        product.setSellingPrice(request.getSellingPrice());
        product.setThumbnailUrl(request.getThumbnailUrl());
        product.setDescription(request.getDescription());
        product.setMrp(request.getMrp());
        product.setMargin(request.getMargin());
        product.setIsActive(request.getIsActive() != null ? request.getIsActive() : true);
        product.setSku(request.getSku());
        product.setInStock(request.getInStock() != null ? request.getInStock() : true);

        Category category = new Category();
        category.setId(request.getCategoryId());
        product.setCategory(category);

        Subcategory subcategory = new Subcategory();
        subcategory.setId(request.getSubcategoryId());
        product.setSubcategory(subcategory);

        return product;
    }

    @ExceptionHandler(UnauthorizedException.class)
    public ResponseEntity<ApiResponse> handleUnauthorized(UnauthorizedException ex) {
        return ResponseEntity.status(403).body(new ApiResponse(false, ex.getMessage()));
    }
    
    private void updateProductFields(Product product, ProductRequest request) {
        if (request.getName() != null) product.setName(request.getName());
        if (request.getDescription() != null) product.setDescription(request.getDescription());
        if (request.getActualPrice() != null) product.setActualPrice(request.getActualPrice());
        if (request.getMrp() != null) product.setMrp(request.getMrp());
        if (request.getMargin() != null) product.setMargin(request.getMargin());
        if (request.getThumbnailUrl() != null) product.setThumbnailUrl(request.getThumbnailUrl());
        if (request.getIsActive() != null) product.setIsActive(request.getIsActive());
        if (request.getInStock() != null) product.setInStock(request.getInStock());
        if (request.getSku() != null) product.setSku(request.getSku());
    }
}