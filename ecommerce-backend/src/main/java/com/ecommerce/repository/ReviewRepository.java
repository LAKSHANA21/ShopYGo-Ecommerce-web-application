package com.ecommerce.repository;

import com.ecommerce.model.Review;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ReviewRepository extends JpaRepository<Review, Long> {
    Optional<Review> findByIdAndUserId(Long id, Long userId);
    Optional<Review> findByProductIdAndUserId(Long productId, Long userId);
    List<Review> findByProductId(Long productId);
    boolean existsByProductIdAndUserId(Long productId, Long userId);
    
    @Modifying
    @Query("DELETE FROM Review r WHERE r.id = :reviewId AND r.userId = :userId")
    int deleteByIdAndUserId(Long reviewId, Long userId);
    
    @Query("SELECT AVG(r.rating) FROM Review r WHERE r.productId = :productId")
    Optional<Double> findAverageRatingByProductId(Long productId);
    
    long countByProductId(Long productId);
}