package com.ecommerce.service;

import com.ecommerce.model.Dispute;
import com.ecommerce.model.DisputeStatus;
import com.ecommerce.repository.DisputeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.NoSuchElementException;

@Service
@RequiredArgsConstructor
public class DisputeService {
    private final DisputeRepository disputeRepository;

    @Transactional
    public Dispute createDispute(Long orderId, Long orderItemId, Long userId, Long sellerId, String reason) {
        Dispute dispute = Dispute.builder()
                .orderId(orderId)
                .orderItemId(orderItemId)
                .userId(userId)
                .sellerId(sellerId)
                .disputeReason(reason)
                .status(DisputeStatus.OPEN)
                .createdAt(LocalDateTime.now())
                .build();
        
        return disputeRepository.save(dispute);
    }

    public List<Dispute> viewMyDisputes(Long userId) {
        return disputeRepository.findByUserId(userId);
    }

    public Dispute trackDisputeStatus(Long disputeId) {
        return disputeRepository.findById(disputeId)
                .orElseThrow(() -> new NoSuchElementException("Dispute not found with id: " + disputeId));
    }

    public List<Dispute> viewDisputesForSeller(Long sellerId) {
        return disputeRepository.findBySellerId(sellerId);
    }

    @Transactional
    public Dispute respondToDispute(Long disputeId, String resolutionNote, DisputeStatus status) {
        Dispute dispute = trackDisputeStatus(disputeId);
        
        if (status == DisputeStatus.RESOLVED || status == DisputeStatus.CLOSED) {
            dispute.setResolvedAt(LocalDateTime.now());
        }
        
        dispute.setResolutionNote(resolutionNote);
        dispute.setStatus(status);
        return disputeRepository.save(dispute);
    }

    public List<Dispute> viewAllDisputes() {
        return disputeRepository.findAll();
    }

    @Transactional
    public Dispute escalateDispute(Long disputeId) {
        Dispute dispute = trackDisputeStatus(disputeId);
        if (dispute.getStatus() != DisputeStatus.OPEN && dispute.getStatus() != DisputeStatus.IN_PROGRESS) {
            throw new IllegalStateException("Only OPEN or IN_PROGRESS disputes can be escalated");
        }
        dispute.setStatus(DisputeStatus.ESCALATED);
        return disputeRepository.save(dispute);
    }

    @Transactional
    public Dispute forceResolve(Long disputeId, String resolutionNote) {
        Dispute dispute = trackDisputeStatus(disputeId);
        dispute.setStatus(DisputeStatus.RESOLVED);
        dispute.setResolutionNote(resolutionNote);
        dispute.setResolvedAt(LocalDateTime.now());
        return disputeRepository.save(dispute);
    }
}