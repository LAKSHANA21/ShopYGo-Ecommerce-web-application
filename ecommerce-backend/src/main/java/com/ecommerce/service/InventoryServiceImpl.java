package com.ecommerce.service;

import com.ecommerce.exception.ResourceNotFoundException;
import com.ecommerce.model.Inventory;
import com.ecommerce.model.Product;
import com.ecommerce.repository.InventoryRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Service
@RequiredArgsConstructor
public class InventoryServiceImpl implements InventoryService {
    private final InventoryRepository inventoryRepository;
    private static final Logger logger = LoggerFactory.getLogger(InventoryServiceImpl.class);

    @Override
    @Transactional
    public void updateStock(Long productId, Integer quantity) {
        logger.debug("Updating stock for productId: {}, quantity: {}", productId, quantity);
        Inventory inventory = findByProductId(productId)
                .orElse(Inventory.builder()
                        .productId(productId)
                        .quantity(0)
                        .lowStockThreshold(10)
                        .build());
        inventory.setQuantity(quantity);
        try {
            inventoryRepository.save(inventory);
            logger.info("Stock updated for productId: {}", productId);
        } catch (Exception e) {
            logger.error("Error updating stock for productId: {}", productId, e);
            throw new RuntimeException("Failed to update stock: " + e.getMessage());
        }
    }

    @Override
    @Transactional
    public Inventory save(Inventory inventory) {
        logger.debug("Saving inventory for productId: {}", inventory.getProductId());
        if (inventory.getProductId() == null) {
            logger.error("ProductId is null in inventory");
            throw new IllegalArgumentException("ProductId cannot be null");
        }

        // Check for existing inventory to prevent duplicate product_id
        Optional<Inventory> existingInventory = findByProductId(inventory.getProductId());
        if (existingInventory.isPresent()) {
            logger.warn("Inventory already exists for productId: {}. Updating instead.", inventory.getProductId());
            Inventory current = existingInventory.get();
            current.setQuantity(inventory.getQuantity() != null ? inventory.getQuantity() : current.getQuantity());
            current.setLowStockThreshold(
                    inventory.getLowStockThreshold() != null ? inventory.getLowStockThreshold() : current.getLowStockThreshold()
            );
            try {
                Inventory saved = inventoryRepository.save(current);
                logger.info("Updated existing inventory for productId: {}", saved.getProductId());
                return saved;
            } catch (Exception e) {
                logger.error("Error updating inventory for productId: {}", inventory.getProductId(), e);
                throw new RuntimeException("Failed to update inventory: " + e.getMessage());
            }
        }

        // Clear product reference to avoid circular persistence issues
        if (inventory.getProduct() != null) {
            inventory.setProduct(null); // JPA will handle relationship via product_id
        }

        try {
            Inventory saved = inventoryRepository.save(inventory);
            logger.info("Saved new inventory for productId: {}", saved.getProductId());
            return saved;
        } catch (Exception e) {
            logger.error("Error saving inventory for productId: {}", inventory.getProductId(), e);
            throw new RuntimeException("Failed to save inventory: " + e.getMessage());
        }
    }

    @Override
    public Optional<Inventory> findByProductId(Long productId) {
        logger.debug("Finding inventory for productId: {}", productId);
        return inventoryRepository.findByProductId(productId);
    }

    @Override
    @Transactional
    public Inventory updateInventory(Long productId, Integer quantity, Integer lowStockThreshold) {
        logger.debug("Updating inventory for productId: {}, quantity: {}, threshold: {}", 
                productId, quantity, lowStockThreshold);
        Inventory inventory = findByProductId(productId)
                .orElse(Inventory.builder()
                        .productId(productId)
                        .quantity(0)
                        .lowStockThreshold(10)
                        .build());
        if (quantity != null) {
            inventory.setQuantity(quantity);
        }
        if (lowStockThreshold != null) {
            inventory.setLowStockThreshold(lowStockThreshold);
        }
        try {
            Inventory saved = inventoryRepository.save(inventory);
            logger.info("Inventory updated for productId: {}", productId);
            return saved;
        } catch (Exception e) {
            logger.error("Error updating inventory for productId: {}", productId, e);
            throw new RuntimeException("Failed to update inventory: " + e.getMessage());
        }
    }
}