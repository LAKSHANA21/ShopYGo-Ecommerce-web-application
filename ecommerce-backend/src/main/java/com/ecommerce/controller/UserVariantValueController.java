package com.ecommerce.controller;

import com.ecommerce.exception.ResourceNotFoundException;
import com.ecommerce.model.Product;
import com.ecommerce.model.ProductVariant;
import com.ecommerce.model.ProductVariantValue;
import com.ecommerce.payload.ProductVariantValueRequest;
import com.ecommerce.service.ProductService;
import com.ecommerce.service.ProductVariantService;
import com.ecommerce.service.ProductVariantValueService;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.annotation.security.PermitAll;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/public")
@RequiredArgsConstructor
@CrossOrigin("*")
public class UserVariantValueController {

    private final ProductVariantService productVariantService;
    private final ProductVariantValueService productVariantValueService;
    private final ProductService productService;

    @GetMapping("/variants")
    @PermitAll
    public ResponseEntity<List<ProductVariantResponse>> getAllVariantsAndValues(
            @RequestParam(value = "productId", required = false) Long productId) {
        List<ProductVariant> variants;
        if (productId != null) {
            Product product = productService.findById(productId)
                    .orElseThrow(() -> new ResourceNotFoundException("Product not found with id " + productId));
            variants = productVariantService.findByProductId(productId);
        } else {
            variants = new ArrayList<>();
            List<Product> products = productService.findAll();
            for (Product product : products) {
                variants.addAll(productVariantService.findByProductId(product.getId()));
            }
        }

        List<ProductVariantResponse> response = variants.stream()
                .map(variant -> {
                    ProductVariantResponse variantResponse = new ProductVariantResponse();
                    variantResponse.setId(variant.getId());
                    variantResponse.setProductId(variant.getProductId());
                    variantResponse.setVariantType(variant.getVariantType());
                    List<ProductVariantValue> values = productVariantValueService.findByVariantId(variant.getId());
                    variantResponse.setValues(values.stream()
                            .map(this::mapToProductVariantValueRequest)
                            .collect(Collectors.toList()));
                    return variantResponse;
                })
                .collect(Collectors.toList());

        return ResponseEntity.ok(response);
    }

    @Data
    public static class ProductVariantResponse {
        private Long id;
        private Long productId;
        private String variantType;
        private List<ProductVariantValueRequest> values;
    }

    private ProductVariantValueRequest mapToProductVariantValueRequest(ProductVariantValue value) {
        ProductVariantValueRequest request = new ProductVariantValueRequest();
        request.setId(value.getId());
        request.setVariantId(value.getVariant().getId());
        request.setValue(value.getValue());
        return request;
    }
}