package com.ecommerce.controller;

import com.ecommerce.exception.ResourceNotFoundException;
import com.ecommerce.model.Category;
import com.ecommerce.model.Subcategory;
import com.ecommerce.payload.ApiResponse;
import com.ecommerce.payload.SubcategoryRequest;
import com.ecommerce.service.CategoryService;
import com.ecommerce.service.SubcategoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/categories")
@RequiredArgsConstructor
@CrossOrigin("*")
public class CategorySubcategoryController {

    private final CategoryService categoryService;
    private final SubcategoryService subcategoryService;

    // --- Category Endpoints ---

    @GetMapping
    public ResponseEntity<List<Category>> getAllCategories() {
        return ResponseEntity.ok(categoryService.findAll());
    }

    @GetMapping("/{categoryId}")
    public ResponseEntity<Category> getCategoryById(@PathVariable Long categoryId) {
        Category category = categoryService.findById(categoryId)
                .orElseThrow(() -> new ResourceNotFoundException("Category not found with id " + categoryId));
        return ResponseEntity.ok(category);
    }

    @PostMapping
    @PreAuthorize("hasRole('SELLER')")
    public ResponseEntity<Category> createCategory(@RequestBody Category category) {
        Category savedCategory = categoryService.save(category);
        return ResponseEntity.ok(savedCategory);
    }

    @PutMapping("/{categoryId}")
    @PreAuthorize("hasRole('SELLER')")
    public ResponseEntity<Category> updateCategory(@PathVariable Long categoryId, @RequestBody Category category) {
        Category existingCategory = categoryService.findById(categoryId)
                .orElseThrow(() -> new ResourceNotFoundException("Category not found with id " + categoryId));
        category.setId(categoryId);
        Category updatedCategory = categoryService.save(category);
        return ResponseEntity.ok(updatedCategory);
    }

    @DeleteMapping("/{categoryId}")
    @PreAuthorize("hasRole('SELLER')")
    public ResponseEntity<ApiResponse> deleteCategory(@PathVariable Long categoryId) {
        categoryService.delete(categoryId);
        return ResponseEntity.ok(new ApiResponse(true, "Category deleted successfully"));
    }

    // --- Subcategory Endpoints ---

    @GetMapping("/subcategories")
    public ResponseEntity<List<SubcategoryRequest>> getAllSubcategories() {
        List<Subcategory> subcategories = subcategoryService.findAll();
        List<SubcategoryRequest> response = subcategories.stream()
                .map(this::mapToSubcategoryRequest)
                .collect(Collectors.toList());
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{categoryId}/subcategories")
    public ResponseEntity<List<SubcategoryRequest>> getSubcategoriesByCategory(@PathVariable Long categoryId) {
        Category category = categoryService.findById(categoryId)
                .orElseThrow(() -> new ResourceNotFoundException("Category not found with id " + categoryId));
        List<Subcategory> subcategories = subcategoryService.findByCategoryId(categoryId);
        List<SubcategoryRequest> response = subcategories.stream()
                .map(this::mapToSubcategoryRequest)
                .collect(Collectors.toList());
        return ResponseEntity.ok(response);
    }

    @GetMapping("/subcategories/{subcategoryId}")
    public ResponseEntity<SubcategoryRequest> getSubcategoryById(@PathVariable Long subcategoryId) {
        Subcategory subcategory = subcategoryService.findById(subcategoryId)
                .orElseThrow(() -> new ResourceNotFoundException("Subcategory not found with id " + subcategoryId));
        return ResponseEntity.ok(mapToSubcategoryRequest(subcategory));
    }

    @PostMapping("/{categoryId}/subcategories")
    @PreAuthorize("hasRole('SELLER')")
    public ResponseEntity<SubcategoryRequest> createSubcategory(
            @PathVariable Long categoryId,
            @RequestBody SubcategoryRequest subcategoryRequest) {
        Category category = categoryService.findById(categoryId)
                .orElseThrow(() -> new ResourceNotFoundException("Category not found with id " + categoryId));
        
        Subcategory subcategory = new Subcategory();
        subcategory.setName(subcategoryRequest.getName());
        subcategory.setDescription(subcategoryRequest.getDescription());
        subcategory.setCategory(category);
        
        Subcategory savedSubcategory = subcategoryService.save(subcategory);
        return ResponseEntity.ok(mapToSubcategoryRequest(savedSubcategory));
    }

    @PutMapping("/subcategories/{subcategoryId}")
    @PreAuthorize("hasRole('SELLER')")
    public ResponseEntity<SubcategoryRequest> updateSubcategory(
            @PathVariable Long subcategoryId,
            @RequestBody SubcategoryRequest subcategoryRequest) {
        Subcategory existingSubcategory = subcategoryService.findById(subcategoryId)
                .orElseThrow(() -> new ResourceNotFoundException("Subcategory not found with id " + subcategoryId));
        
        existingSubcategory.setName(subcategoryRequest.getName());
        existingSubcategory.setDescription(subcategoryRequest.getDescription());
        // Category remains unchanged unless explicitly allowed to update
        if (subcategoryRequest.getCategoryId() != null && 
            !subcategoryRequest.getCategoryId().equals(existingSubcategory.getCategory().getId())) {
            Category newCategory = categoryService.findById(subcategoryRequest.getCategoryId())
                    .orElseThrow(() -> new ResourceNotFoundException("Category not found with id " + subcategoryRequest.getCategoryId()));
            existingSubcategory.setCategory(newCategory);
        }
        
        Subcategory updatedSubcategory = subcategoryService.save(existingSubcategory);
        return ResponseEntity.ok(mapToSubcategoryRequest(updatedSubcategory));
    }

    @DeleteMapping("/subcategories/{subcategoryId}")
    @PreAuthorize("hasRole('SELLER')")
    public ResponseEntity<ApiResponse> deleteSubcategory(@PathVariable Long subcategoryId) {
        subcategoryService.delete(subcategoryId);
        return ResponseEntity.ok(new ApiResponse(true, "Subcategory deleted successfully"));
    }

    // Helper method to map Subcategory to SubcategoryRequest DTO
    private SubcategoryRequest mapToSubcategoryRequest(Subcategory subcategory) {
        SubcategoryRequest request = new SubcategoryRequest();
        request.setId(subcategory.getId());
        request.setName(subcategory.getName());
        request.setDescription(subcategory.getDescription());
        request.setCategoryId(subcategory.getCategory().getId());
        request.setCategoryName(subcategory.getCategory().getName());
        return request;
    }
}