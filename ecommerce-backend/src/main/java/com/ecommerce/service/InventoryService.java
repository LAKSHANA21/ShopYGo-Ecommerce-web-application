package com.ecommerce.service;

import com.ecommerce.model.Inventory;
import java.util.Optional;

public interface InventoryService {
    void updateStock(Long productId, Integer quantity);
    Inventory save(Inventory inventory);
    Optional<Inventory> findByProductId(Long productId);
    Inventory updateInventory(Long productId, Integer quantity, Integer lowStockThreshold);
}