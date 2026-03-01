package com.ecommerce.service;

import com.ecommerce.exception.ResourceNotFoundException;
import com.ecommerce.model.Category;
import com.ecommerce.repository.CategoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class CategoryService {
    private final CategoryRepository categoryRepository;

    public Category save(Category category) {
        if (category.getId() == null) {
            category.setCreatedAt(LocalDateTime.now());
        }
        category.setUpdatedAt(LocalDateTime.now());
        return categoryRepository.save(category);
    }

    public List<Category> findAll() {
        return categoryRepository.findAll();
    }

    public Optional<Category> findById(Long id) {
        return categoryRepository.findById(id);
    }

    public void delete(Long id) {
        Category category = findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Category not found with id " + id));
        categoryRepository.delete(category);
    }
}
