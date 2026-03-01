package com.ecommerce.controller;

import com.ecommerce.exception.DuplicateReviewException;
import com.ecommerce.exception.ReviewNotFoundException;
import com.ecommerce.model.Review;
import com.ecommerce.service.ReviewService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/reviews")
@RequiredArgsConstructor
public class ReviewController {

    private final ReviewService reviewService;

    @PostMapping
    public ResponseEntity<?> createReview(@RequestBody Review review) {
        try {
            Review savedReview = reviewService.createReview(review);
            return ResponseEntity.status(HttpStatus.CREATED).body(savedReview);
        } catch (DuplicateReviewException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(e.getMessage());
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/product/{productId}")
    public ResponseEntity<List<Review>> getReviewsByProductId(@PathVariable Long productId) {
        List<Review> reviews = reviewService.getReviewsByProductId(productId);
        return ResponseEntity.ok(reviews);
    }

    @GetMapping("/product/{productId}/user/{userId}")
    public ResponseEntity<?> getUserReviewForProduct(
            @PathVariable Long productId,
            @PathVariable Long userId) {
        try {
            Review review = reviewService.getReviewByProductAndUser(productId, userId);
            return ResponseEntity.ok(review);
        } catch (ReviewNotFoundException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PutMapping("/{reviewId}/user/{userId}")
    public ResponseEntity<?> updateReview(
            @PathVariable Long reviewId,
            @PathVariable Long userId,
            @RequestBody Review updatedReview) {
        try {
            Review review = reviewService.updateReview(reviewId, userId, updatedReview);
            return ResponseEntity.ok(review);
        } catch (ReviewNotFoundException e) {
            return ResponseEntity.notFound().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @DeleteMapping("/{reviewId}/user/{userId}")
    public ResponseEntity<?> deleteReview(
            @PathVariable Long reviewId,
            @PathVariable Long userId) {
        try {
            reviewService.deleteReview(reviewId, userId);
            return ResponseEntity.noContent().build();
        } catch (ReviewNotFoundException e) {
            return ResponseEntity.notFound().build();
        }
    }
    
    @GetMapping("/product/{productId}/stats")
    public ResponseEntity<?> getProductReviewStats(@PathVariable Long productId) {
        return ResponseEntity.ok()
                .body(new ReviewStats(
                    reviewService.getAverageRating(productId),
                    reviewService.getReviewCount(productId)
                ));
    }
    
    // DTO for review statistics
    private record ReviewStats(double averageRating, long reviewCount) {}
}