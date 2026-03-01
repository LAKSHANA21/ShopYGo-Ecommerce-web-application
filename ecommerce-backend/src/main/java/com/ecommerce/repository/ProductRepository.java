package com.ecommerce.repository;

import com.ecommerce.model.Product;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ProductRepository extends JpaRepository<Product, Long> {
    List<Product> findBySellerId(Long sellerId);
    List<Product> findByCategoryId(Long categoryId);
    List<Product> findBySubcategoryId(Long subcategoryId);
}