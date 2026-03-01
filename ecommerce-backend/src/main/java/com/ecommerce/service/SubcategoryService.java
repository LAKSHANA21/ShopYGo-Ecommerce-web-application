
package com.ecommerce.service;

import com.ecommerce.exception.ResourceNotFoundException;
import com.ecommerce.model.Subcategory;
import com.ecommerce.repository.SubcategoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class SubcategoryService {
    private final SubcategoryRepository subcategoryRepository;

    public Subcategory save(Subcategory subcategory) {
        if (subcategory.getId() == null) {
            subcategory.setCreatedAt(LocalDateTime.now());
        }
        subcategory.setUpdatedAt(LocalDateTime.now());
        return subcategoryRepository.save(subcategory);
    }

    public List<Subcategory> findAll() {
        return subcategoryRepository.findAll();
    }

    public Optional<Subcategory> findById(Long id) {
        return subcategoryRepository.findById(id);
    }

    public List<Subcategory> findByCategoryId(Long categoryId) {
        return subcategoryRepository.findByCategoryId(categoryId);
    }

    public void delete(Long id) {
        Subcategory subcategory = findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Subcategory not found with id " + id));
        subcategoryRepository.delete(subcategory);
    }
}