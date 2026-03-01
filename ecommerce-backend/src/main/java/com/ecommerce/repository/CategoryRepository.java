package com.ecommerce.repository;

import com.ecommerce.model.Category;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CategoryRepository extends JpaRepository<Category, Long> {
    // No need for findBySellerId since sellerId is removed
    // Add other query methods if needed, e.g., findByName (optional)
}