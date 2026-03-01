package com.ecommerce.service;

import com.ecommerce.exception.DuplicateReviewException;
import com.ecommerce.exception.ReviewNotFoundException;
import com.ecommerce.model.Review;
import com.ecommerce.repository.ReviewRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ReviewService {

    private final ReviewRepository reviewRepository;

    @Transactional
    public Review createReview(Review review) {
        // Check if user already has a review for this product
        if (reviewRepository.existsByProductIdAndUserId(review.getProductId(), review.getUserId())) {
            throw new DuplicateReviewException(
                "User already has a review for this product. Use update instead.");
        }
        
        // Validate rating
        if (review.getRating() == null || review.getRating() < 1 || review.getRating() > 5) {
            throw new IllegalArgumentException("Rating must be between 1 and 5");
        }
        
        return reviewRepository.save(review);
    }

    @Transactional
    public Review updateReview(Long reviewId, Long userId, Review updatedReview) {
        // Find existing review
        Review existingReview = reviewRepository.findByIdAndUserId(reviewId, userId)
                .orElseThrow(() -> new ReviewNotFoundException(
                    "Review not found or doesn't belong to user"));
        
        // Validate rating
        if (updatedReview.getRating() != null) {
            if (updatedReview.getRating() < 1 || updatedReview.getRating() > 5) {
                throw new IllegalArgumentException("Rating must be between 1 and 5");
            }
            existingReview.setRating(updatedReview.getRating());
        }
        
        if (updatedReview.getComment() != null) {
            existingReview.setComment(updatedReview.getComment());
        }
        
        return reviewRepository.save(existingReview);
    }

    public List<Review> getReviewsByProductId(Long productId) {
        return reviewRepository.findByProductId(productId);
    }

    public Review getReviewByProductAndUser(Long productId, Long userId) {
        return reviewRepository.findByProductIdAndUserId(productId, userId)
                .orElseThrow(() -> new ReviewNotFoundException(
                    "No review found for this product and user"));
    }

    @Transactional
    public void deleteReview(Long reviewId, Long userId) {
        int deletedCount = reviewRepository.deleteByIdAndUserId(reviewId, userId);
        if (deletedCount == 0) {
            throw new ReviewNotFoundException(
                "Review not found or doesn't belong to user");
        }
    }
    
    public double getAverageRating(Long productId) {
        return reviewRepository.findAverageRatingByProductId(productId)
                .orElse(0.0);
    }
    
    public long getReviewCount(Long productId) {
        return reviewRepository.countByProductId(productId);
    }
}