package com.ecommerce.service;

import com.ecommerce.exception.ResourceNotFoundException;
import com.ecommerce.model.Product;
import com.ecommerce.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class ProductService {

    private final ProductRepository productRepository;

    public List<Product> findAll() {
        return productRepository.findAll();
    }

    public Optional<Product> findById(Long id) {
        return productRepository.findById(id);
    }

    public List<Product> findBySellerId(Long sellerId) {
        return productRepository.findBySellerId(sellerId);
    }

    public List<Product> findByCategoryId(Long categoryId) {
        return productRepository.findByCategoryId(categoryId);
    }

    public List<Product> findBySubcategoryId(Long subcategoryId) {
        return productRepository.findBySubcategoryId(subcategoryId);
    }

    public Product save(Product product) {
        if (product.getId() == null) {
            product.setCreatedAt(LocalDateTime.now());
        }
        product.setUpdatedAt(LocalDateTime.now());
        return productRepository.save(product); // sellingPrice calculated in entity
    }

    public void deleteById(Long id) {
        Product product = findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with id " + id));
        productRepository.deleteById(id);
    }

	public boolean existsById(Long productId) {
		return productRepository.existsById(productId);
	}
}