package com.ecommerce.controller;

import com.ecommerce.exception.ResourceNotFoundException;
import com.ecommerce.model.*;
import com.ecommerce.service.OrderService;
import com.ecommerce.service.UserService;
import com.ecommerce.service.SellerService;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import jakarta.transaction.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/orders")
@RequiredArgsConstructor
public class OrderController {

    private final OrderService orderService;
    private final UserService userService;
    private final SellerService sellerService;

    @PostMapping
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<Order> placeOrder(@RequestBody OrderRequest request) {
        Long userId = getCurrentUserId();
        Order order = orderService.placeOrder(userId, request.getCartId(), request.getShippingAddress());
        return ResponseEntity.ok(order);
    }

    @GetMapping
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<List<Order>> getUserOrders() {
        Long userId = getCurrentUserId();
        return ResponseEntity.ok(orderService.getUserOrders(userId));
    }

    @GetMapping("/{orderId}")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<Order> trackOrder(@PathVariable Long orderId) {
        Long userId = getCurrentUserId();
        Order order = orderService.getUserOrders(userId).stream()
                .filter(o -> o.getId().equals(orderId))
                .findFirst()
                .orElseThrow(() -> new ResourceNotFoundException("Order not found with id " + orderId));
        return ResponseEntity.ok(order);
    }

    @PutMapping("/{orderId}/items/{orderItemId}/cancel")
    @PreAuthorize("hasRole('USER')")
    @Transactional
    public ResponseEntity<OrderItem> cancelOrderItem(@PathVariable Long orderId, @PathVariable Long orderItemId) {
        Long userId = getCurrentUserId();
        return ResponseEntity.ok(orderService.cancelOrderItem(orderId, orderItemId, userId));
    }

    @PutMapping("/{orderId}/items/{orderItemId}/return")
    @PreAuthorize("hasRole('USER')")
    @Transactional
    public ResponseEntity<OrderItem> requestReturn(@PathVariable Long orderId, @PathVariable Long orderItemId) {
        Long userId = getCurrentUserId();
        return ResponseEntity.ok(orderService.requestReturn(orderId, orderItemId, userId));
    }

    @PutMapping("/{orderId}/items/{orderItemId}/replace")
    @PreAuthorize("hasRole('USER')")
    @Transactional
    public ResponseEntity<OrderItem> requestReplacement(@PathVariable Long orderId, @PathVariable Long orderItemId) {
        Long userId = getCurrentUserId();
        return ResponseEntity.ok(orderService.requestReplacement(orderId, orderItemId, userId));
    }

    @GetMapping("/{orderId}/invoice")
    @PreAuthorize("hasRole('USER') or hasRole('SELLER')")
    public ResponseEntity<byte[]> downloadInvoice(@PathVariable Long orderId) {
        Long userId = SecurityContextHolder.getContext().getAuthentication().getAuthorities().stream()
                .anyMatch(auth -> auth.getAuthority().equals("ROLE_USER"))
                ? getCurrentUserId() : getCurrentVendorId();
        byte[] invoice = orderService.generateInvoice(orderId, userId);
        return ResponseEntity.ok()
                .header("Content-Disposition", "attachment; filename=invoice-" + orderId + ".pdf")
                .contentType(org.springframework.http.MediaType.APPLICATION_PDF)
                .body(invoice);
    }

    @PostMapping("/{orderId}/review")
    @PreAuthorize("hasRole('USER')")
    @Transactional
    public ResponseEntity<OrderReview> addReview(
            @PathVariable Long orderId,
            @RequestBody ReviewRequest request) {
        Long userId = getCurrentUserId();
        return ResponseEntity.ok(orderService.addReview(orderId, userId, request.getRating(), request.getComment()));
    }

    @GetMapping("/vendor")
    @PreAuthorize("hasRole('SELLER')")
    public ResponseEntity<List<Order>> getVendorOrders() {
        Long vendorId = getCurrentVendorId();
        return ResponseEntity.ok(orderService.getVendorOrders(vendorId));
    }

    @PutMapping("/{orderId}/items/{orderItemId}/status")
    @PreAuthorize("hasRole('SELLER')")
    @Transactional
    public ResponseEntity<OrderItem> updateOrderItemStatus(
            @PathVariable Long orderId,
            @PathVariable Long orderItemId,
            @RequestBody StatusUpdateRequest request) {
        Long vendorId = getCurrentVendorId();
        return ResponseEntity.ok(orderService.updateOrderItemStatus(orderId, orderItemId, request.getStatus(), vendorId));
    }

    @PutMapping("/{orderId}/items/{orderItemId}/return/approve")
    @PreAuthorize("hasRole('SELLER')")
    @Transactional
    public ResponseEntity<OrderItem> handleReturn(
            @PathVariable Long orderId,
            @PathVariable Long orderItemId,
            @RequestBody ReturnApprovalRequest request) {
        Long vendorId = getCurrentVendorId();
        return ResponseEntity.ok(orderService.handleReturn(orderId, orderItemId, vendorId, request.isApprove()));
    }

    @GetMapping("/{orderId}/customer")
    @PreAuthorize("hasRole('SELLER')")
    public ResponseEntity<User> getCustomerDetails(@PathVariable Long orderId) {
        Long vendorId = getCurrentVendorId();
        Order order = orderService.getVendorOrders(vendorId).stream()
                .filter(o -> o.getId().equals(orderId))
                .findFirst()
                .orElseThrow(() -> new ResourceNotFoundException("Order not found with id " + orderId));
        return ResponseEntity.ok(userService.findById(order.getUserId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found")));
    }

    @GetMapping("/vendor/analytics")
    @PreAuthorize("hasRole('SELLER')")
    public ResponseEntity<OrderAnalytics> getVendorAnalytics(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate) {
        Long vendorId = getCurrentVendorId();
        return ResponseEntity.ok(orderService.getVendorAnalytics(vendorId, startDate, endDate));
    }

    private Long getCurrentUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new ResourceNotFoundException("User not authenticated");
        }
        String username;
        Object principal = authentication.getPrincipal();
        if (principal instanceof UserDetails) {
            username = ((UserDetails) principal).getUsername();
        } else if (principal instanceof String) {
            username = (String) principal;
        } else {
            throw new IllegalStateException("Unexpected principal type: " + principal.getClass());
        }
        return userService.findByEmailOrMobile(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with username: " + username))
                .getId();
    }

    private Long getCurrentVendorId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new ResourceNotFoundException("Vendor not authenticated");
        }
        String username;
        Object principal = authentication.getPrincipal();
        if (principal instanceof UserDetails) {
            username = ((UserDetails) principal).getUsername();
        } else if (principal instanceof String) {
            username = (String) principal;
        } else {
            throw new IllegalStateException("Unexpected principal type: " + principal.getClass());
        }
        return sellerService.findByEmailOrMobile(username)
                .orElseThrow(() -> new ResourceNotFoundException("Vendor not found with username: " + username))
                .getId();
    }

    @Data
    public static class OrderRequest {
        private Long cartId;
        private String shippingAddress;
    }

    @Data
    public static class ReviewRequest {
        private Integer rating;
        private String comment;
    }

    @Data
    public static class StatusUpdateRequest {
        private OrderStatus status;
    }

    @Data
    public static class ReturnApprovalRequest {
        private boolean approve;
    }
}