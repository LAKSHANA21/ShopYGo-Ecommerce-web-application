package com.ecommerce.repository;

import com.ecommerce.model.Dispute;
import com.ecommerce.model.DisputeStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DisputeRepository extends JpaRepository<Dispute, Long> {
    List<Dispute> findByUserId(Long userId);
    List<Dispute> findBySellerId(Long sellerId);
    List<Dispute> findByStatusIn(List<DisputeStatus> statuses);
}