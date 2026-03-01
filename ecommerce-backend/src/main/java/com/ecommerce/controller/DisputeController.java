package com.ecommerce.controller;

import com.ecommerce.model.Dispute;
import com.ecommerce.model.DisputeStatus;
import com.ecommerce.service.DisputeService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/disputes")
@RequiredArgsConstructor
public class DisputeController {
    private final DisputeService disputeService;

    // User Endpoints
    @PostMapping
    public ResponseEntity<Dispute> createDispute(
            @RequestParam Long orderId,
            @RequestParam Long orderItemId,
            @RequestParam Long userId,
            @RequestParam Long sellerId,
            @RequestParam String reason) {
        Dispute dispute = disputeService.createDispute(orderId, orderItemId, userId, sellerId, reason);
        return new ResponseEntity<>(dispute, HttpStatus.CREATED);
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<Dispute>> viewMyDisputes(@PathVariable Long userId) {
        return ResponseEntity.ok(disputeService.viewMyDisputes(userId));
    }

    @GetMapping("/{disputeId}")
    public ResponseEntity<Dispute> trackDisputeStatus(@PathVariable Long disputeId) {
        return ResponseEntity.ok(disputeService.trackDisputeStatus(disputeId));
    }

    // Seller Endpoints
    @GetMapping("/seller/{sellerId}")
    public ResponseEntity<List<Dispute>> viewDisputesForSeller(@PathVariable Long sellerId) {
        return ResponseEntity.ok(disputeService.viewDisputesForSeller(sellerId));
    }

    @PutMapping("/{disputeId}/respond")
    public ResponseEntity<Dispute> respondToDispute(
            @PathVariable Long disputeId,
            @RequestParam String resolutionNote,
            @RequestParam DisputeStatus status) {
        return ResponseEntity.ok(disputeService.respondToDispute(disputeId, resolutionNote, status));
    }

    // Admin Endpoints
    @GetMapping
    public ResponseEntity<List<Dispute>> viewAllDisputes() {
        return ResponseEntity.ok(disputeService.viewAllDisputes());
    }

    @PutMapping("/{disputeId}/escalate")
    public ResponseEntity<Dispute> escalateDispute(@PathVariable Long disputeId) {
        return ResponseEntity.ok(disputeService.escalateDispute(disputeId));
    }

    @PutMapping("/{disputeId}/force-resolve")
    public ResponseEntity<Dispute> forceResolve(
            @PathVariable Long disputeId,
            @RequestParam String resolutionNote) {
        return ResponseEntity.ok(disputeService.forceResolve(disputeId, resolutionNote));
    }
}