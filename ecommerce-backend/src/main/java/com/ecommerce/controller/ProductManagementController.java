package com.ecommerce.controller;

import com.ecommerce.exception.ResourceNotFoundException;
import com.ecommerce.model.*;
import com.ecommerce.payload.*;
import com.ecommerce.service.*;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/products")
@RequiredArgsConstructor
@CrossOrigin("*")
public class ProductManagementController {

    private final ProductService productService;
    private final ProductImageService productImageService;
    private final SellerService sellerService;
    private final InventoryService inventoryService;

    @GetMapping
    public ResponseEntity<List<ProductResponse>> getAllProducts() {
        List<Product> products = productService.findAll();
        return ResponseEntity.ok(products.stream().map(this::mapToProductResponse).collect(Collectors.toList()));
    }

    @GetMapping("/search")
    public ResponseEntity<List<ProductResponse>> searchProducts(@RequestParam String query) {
        List<Product> products = productService.findAll().stream()
                .filter(p -> p.getName().toLowerCase().contains(query.toLowerCase()) ||
                        p.getDescription().toLowerCase().contains(query.toLowerCase()))
                .collect(Collectors.toList());
        return ResponseEntity.ok(products.stream().map(this::mapToProductResponse).collect(Collectors.toList()));
    }

    @GetMapping("/{productId}")
    public ResponseEntity<ProductResponse> getProductById(@PathVariable Long productId) {
        Product product = productService.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with id " + productId));
        return ResponseEntity.ok(mapToProductResponse(product));
    }

    @GetMapping("/category/{categoryId}")
    public ResponseEntity<List<ProductResponse>> getProductsByCategory(@PathVariable Long categoryId) {
        List<Product> products = productService.findByCategoryId(categoryId);
        return ResponseEntity.ok(products.stream().map(this::mapToProductResponse).collect(Collectors.toList()));
    }

    @GetMapping("/subcategory/{subcategoryId}")
    public ResponseEntity<List<ProductResponse>> getProductsBySubcategory(@PathVariable Long subcategoryId) {
        List<Product> products = productService.findBySubcategoryId(subcategoryId);
        return ResponseEntity.ok(products.stream().map(this::mapToProductResponse).collect(Collectors.toList()));
    }

    @PostMapping
    @PreAuthorize("hasRole('SELLER')")
    @Transactional
    public ResponseEntity<ProductResponse> createProduct(@RequestBody ProductRequest productRequest) {
        Long sellerId = getAuthenticatedSellerId();
        Product product = mapToProduct(productRequest, sellerId);
        Product savedProduct = productService.save(product);
        inventoryService.updateInventory(
                savedProduct.getId(),
                productRequest.getQuantity() != null ? productRequest.getQuantity() : 0,
                productRequest.getLowStockThreshold() != null ? productRequest.getLowStockThreshold() : 10
        );
        return ResponseEntity.ok(mapToProductResponse(savedProduct));
    }

    @PutMapping("/{productId}")
    @PreAuthorize("hasRole('SELLER')")
    @Transactional
    public ResponseEntity<?> updateProduct(@PathVariable Long productId, @RequestBody ProductRequest productRequest) {
        try {
            Long sellerId = getAuthenticatedSellerId();
            Product existingProduct = productService.findById(productId)
                    .orElseThrow(() -> new ResourceNotFoundException("Product not found with id " + productId));
            if (!existingProduct.getSellerId().equals(sellerId)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(new ApiResponse(false, "You don't have permission to update this product"));
            }
            if (productRequest.getName() != null) existingProduct.setName(productRequest.getName());
            if (productRequest.getDescription() != null) existingProduct.setDescription(productRequest.getDescription());
            if (productRequest.getActualPrice() != null) existingProduct.setActualPrice(productRequest.getActualPrice());
            if (productRequest.getMrp() != null) existingProduct.setMrp(productRequest.getMrp());
            if (productRequest.getMargin() != null) existingProduct.setMargin(productRequest.getMargin());
            if (productRequest.getThumbnailUrl() != null) existingProduct.setThumbnailUrl(productRequest.getThumbnailUrl());
            if (productRequest.getIsActive() != null) existingProduct.setIsActive(productRequest.getIsActive());
            if (productRequest.getInStock() != null) existingProduct.setInStock(productRequest.getInStock());
            if (productRequest.getSku() != null) existingProduct.setSku(productRequest.getSku());
            Product updatedProduct = productService.save(existingProduct);
            if (productRequest.getQuantity() != null || productRequest.getLowStockThreshold() != null) {
                inventoryService.updateInventory(
                        productId,
                        productRequest.getQuantity(),
                        productRequest.getLowStockThreshold()
                );
            }
            return ResponseEntity.ok(mapToProductResponse(updatedProduct));
        } catch (ResourceNotFoundException e) {
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                    .body(new ApiResponse(false, "Error updating product: " + e.getMessage()));
        }
    }
    @GetMapping("/productImages/{productId}")
    public ResponseEntity<List<ProductImage>> getImagesByProductId(@PathVariable Long productId) {
        List<ProductImage> images = productImageService.findByProductId(productId);
        return ResponseEntity.ok(images);
    }
    @DeleteMapping("/{productId}")
    @PreAuthorize("hasRole('SELLER')")
    public ResponseEntity<ApiResponse> deleteProduct(@PathVariable Long productId) {
        Long sellerId = getAuthenticatedSellerId();
        Product product = productService.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with id " + productId));
        if (!product.getSellerId().equals(sellerId)) {
            throw new ResourceNotFoundException("You do not have permission to delete this product");
        }
        productService.deleteById(productId);
        return ResponseEntity.ok(new ApiResponse(true, "Product deleted successfully"));
    }

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
        Seller seller = sellerService.findByEmailOrMobile(username)
                .orElseThrow(() -> new ResourceNotFoundException("Seller not found with username: " + username));
        return seller.getId();
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
}