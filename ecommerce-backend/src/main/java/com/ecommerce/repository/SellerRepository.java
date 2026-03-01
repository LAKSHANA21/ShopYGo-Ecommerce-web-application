package com.ecommerce.repository;

import com.ecommerce.model.Seller;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface SellerRepository extends JpaRepository<Seller, Long> {
    Optional<Seller> findByEmail(String email);
    boolean existsByEmail(String email); // Added
    Optional<Seller> findByPhone(String phone); // Added
}