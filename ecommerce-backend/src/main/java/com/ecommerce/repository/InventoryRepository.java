// com.ecommerce.repository.InventoryRepository.java
package com.ecommerce.repository;

import com.ecommerce.model.Inventory;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface InventoryRepository extends JpaRepository<Inventory, Long> {
    Optional<Inventory> findByProductId(Long productId);
}