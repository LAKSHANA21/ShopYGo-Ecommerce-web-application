package com.ecommerce.payload;



import lombok.Data;

@Data
public class SubcategoryRequest{
    private Long id;
    private String name;
    private String description;
    private Long categoryId; // Only include category ID, not the full object
    private String categoryName;
}