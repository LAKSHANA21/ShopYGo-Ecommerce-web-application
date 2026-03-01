package com.ecommerce.service;

import com.ecommerce.exception.ResourceNotFoundException;
import com.ecommerce.model.Product;
import com.ecommerce.model.ProductImage;
import com.ecommerce.repository.ProductImageRepository;
import com.ecommerce.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ProductImageService {
    private final ProductImageRepository imageRepository;
    private final ProductRepository productRepository;
    private static final Logger logger = LoggerFactory.getLogger(ProductImageService.class);

    @Transactional
    public ProductImage save(ProductImage image, Long sellerId) {
        logger.debug("Saving image for productId: {}, sellerId: {}", image.getProductId(), sellerId);
        Product product = productRepository.findById(image.getProductId())
                .orElseThrow(() -> {
                    logger.error("Product not found with id: {}", image.getProductId());
                    return new ResourceNotFoundException("Product not found with id " + image.getProductId());
                });

        if (!product.getSellerId().equals(sellerId)) {
            logger.error("Seller {} not authorized for product {}", sellerId, image.getProductId());
            throw new ResourceNotFoundException("Unauthorized to modify this product");
        }

        if (image.getImageUrl() == null || image.getImageUrl().trim().isEmpty()) {
            logger.error("Image URL is empty for productId: {}", image.getProductId());
            throw new IllegalArgumentException("Image URL cannot be empty");
        }

 

        try {
            ProductImage saved = imageRepository.save(image);
            logger.info("Saved image for productId: {}", image.getProductId());
            return saved;
        } catch (Exception e) {
            logger.error("Error saving image for productId: {}", image.getProductId(), e);
            throw new RuntimeException("Failed to save image: " + e.getMessage());
        }
    }

    public ProductImage findById(Long imageId) {
        return imageRepository.findById(imageId)
                .orElseThrow(() -> new ResourceNotFoundException("Image not found with id " + imageId));
    }

    @Transactional
    public void deleteById(Long imageId, Long sellerId) {
        ProductImage image = findById(imageId);
        Product product = productRepository.findById(image.getProductId())
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with id " + image.getProductId()));
        if (!product.getSellerId().equals(sellerId)) {
            throw new ResourceNotFoundException("Unauthorized to delete this image");
        }
        imageRepository.deleteById(imageId);
    }

    public List<ProductImage> findByProductId(Long productId) {
        return imageRepository.findByProductId(productId);
    }
}