package com.ecommerce.service;

import com.ecommerce.exception.ResourceNotFoundException;
import com.ecommerce.model.*;
import com.ecommerce.payload.CartItemResponse;
import com.ecommerce.payload.CartItemResponse.VariantSelection;
import com.ecommerce.repository.*;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class OrderService {

    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final OrderItemVariantRepository orderItemVariantRepository;
    private final OrderReviewRepository orderReviewRepository;
    private final CartService cartService;
    private final CartItemService cartItemService;
    private final ProductService productService;
    private final UserService userService;
    private static final Logger logger = LoggerFactory.getLogger(OrderService.class);

    @Transactional
    public Order placeOrder(Long userId, Long cartId, String shippingAddress) {
        logger.debug("Placing order for userId: {}, cartId: {}", userId, cartId);

        // Validate cart
        Cart cart = cartService.findById(cartId)
                .orElseThrow(() -> new ResourceNotFoundException("Cart not found with id " + cartId));
        if (!cart.getUserId().equals(userId)) {
            throw new ResourceNotFoundException("Cart does not belong to user");
        }
        List<CartItemResponse> cartItems = cartItemService.findByCartId(cartId);
        if (cartItems.isEmpty()) {
            throw new IllegalArgumentException("Cart is empty");
        }

        // Validate shipping address
        if (shippingAddress == null || shippingAddress.trim().isEmpty()) {
            throw new IllegalArgumentException("Shipping address is required");
        }

        // Create order
        Order order = Order.builder()
                .userId(userId)
                .totalAmount(BigDecimal.ZERO)
                .shippingAddress(shippingAddress) // Set shipping address for Order
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .orderItems(new ArrayList<>())
                .build();

        BigDecimal totalAmount = BigDecimal.ZERO;

        // Convert cart items to order items
        for (CartItemResponse cartItem : cartItems) {
            Product product = productService.findById(cartItem.getProductId())
                    .orElseThrow(() -> new ResourceNotFoundException("Product not found with id " + cartItem.getProductId()));
            
            BigDecimal unitPrice = product.getSellingPrice();
            BigDecimal itemTotal = unitPrice.multiply(BigDecimal.valueOf(cartItem.getQuantity()));
            totalAmount = totalAmount.add(itemTotal);

            OrderItem orderItem = OrderItem.builder()
                    .order(order)
                    .productId(cartItem.getProductId())
                    .sellerId(product.getSellerId())
                    .quantity(cartItem.getQuantity())
                    .unitPrice(unitPrice)
                    .status(OrderStatus.PLACED.name())
                    .address(shippingAddress) // Reflect same address in OrderItem
                    .createdAt(LocalDateTime.now())
                    .updatedAt(LocalDateTime.now())
                    .variants(new ArrayList<>())
                    .build();

            // Copy variants
            for (VariantSelection cartVariant : cartItem.getSelectedVariants()) {
                OrderItemVariant orderVariant = OrderItemVariant.builder()
                        .orderItem(orderItem)
                        .variantId(cartVariant.getVariantId())
                        .variantValueId(cartVariant.getVariantValueId())
                        .build();
                orderItem.getVariants().add(orderVariant);
            }

            order.getOrderItems().add(orderItem);
        }

        order.setTotalAmount(totalAmount);
        Order savedOrder = orderRepository.save(order);

        // Clear cart
        cartItemService.findByCartId(cartId).forEach(item ->
                cartItemService.deleteCartItem(cartId, item.getId()));
        
        logger.info("Order placed with id: {} for user: {}", savedOrder.getId(), userId);
        return savedOrder;
    }

    public List<Order> getUserOrders(Long userId) {
        logger.debug("Fetching orders for userId: {}", userId);
        return orderRepository.findByUserId(userId);
    }

    public List<Order> getVendorOrders(Long vendorId) {
        logger.debug("Fetching orders for vendorId: {}", vendorId);
        List<OrderItem> vendorItems = orderItemRepository.findBySellerId(vendorId);
        return vendorItems.stream()
                .map(OrderItem::getOrder)
                .distinct()
                .collect(Collectors.toList());
    }

    @Transactional
    public OrderItem updateOrderItemStatus(Long orderId, Long orderItemId, OrderStatus status, Long vendorId) {
        logger.debug("Updating status for orderId: {}, orderItemId: {} to {}", orderId, orderItemId, status);
        OrderItem orderItem = orderItemRepository.findByIdAndOrderId(orderItemId, orderId)
                .orElseThrow(() -> new ResourceNotFoundException("OrderItem not found with id " + orderItemId));
        if (!orderItem.getSellerId().equals(vendorId)) {
            throw new ResourceNotFoundException("OrderItem does not belong to vendor");
        }
        if (!isValidStatusTransition(OrderStatus.valueOf(orderItem.getStatus()), status)) {
            throw new IllegalArgumentException("Invalid status transition from " + orderItem.getStatus() + " to " + status);
        }
        orderItem.setStatus(status.name());
        orderItem.setUpdatedAt(LocalDateTime.now());
        return orderItemRepository.save(orderItem);
    }

    @Transactional
    public OrderItem cancelOrderItem(Long orderId, Long orderItemId, Long userId) {
        logger.debug("Cancelling orderItemId: {} for orderId: {} by userId: {}", orderItemId, orderId, userId);
        OrderItem orderItem = orderItemRepository.findByIdAndOrderId(orderItemId, orderId)
                .orElseThrow(() -> new ResourceNotFoundException("OrderItem not found with id " + orderItemId));
        Order order = orderItem.getOrder();
        if (!order.getUserId().equals(userId)) {
            throw new ResourceNotFoundException("Order does not belong to user");
        }
        OrderStatus currentStatus = OrderStatus.valueOf(orderItem.getStatus());
        if (currentStatus != OrderStatus.PLACED && currentStatus != OrderStatus.PROCESSING) {
            throw new IllegalArgumentException("OrderItem cannot be cancelled in status: " + currentStatus);
        }
        orderItem.setStatus(OrderStatus.CANCELLED.name());
        orderItem.setUpdatedAt(LocalDateTime.now());
        orderItemRepository.save(orderItem);

        // Update order totalAmount
        recalculateOrderTotal(order);
        return orderItem;
    }

    @Transactional
    public OrderItem requestReturn(Long orderId, Long orderItemId, Long userId) {
        logger.debug("Requesting return for orderItemId: {} in orderId: {} by userId: {}", orderItemId, orderId, userId);
        OrderItem orderItem = orderItemRepository.findByIdAndOrderId(orderItemId, orderId)
                .orElseThrow(() -> new ResourceNotFoundException("OrderItem not found with id " + orderItemId));
        Order order = orderItem.getOrder();
        if (!order.getUserId().equals(userId)) {
            throw new ResourceNotFoundException("Order does not belong to user");
        }
        if (!OrderStatus.DELIVERED.name().equals(orderItem.getStatus())) {
            throw new IllegalArgumentException("Return can only be requested for delivered items");
        }
        orderItem.setStatus(OrderStatus.RETURN_REQUESTED.name());
        orderItem.setUpdatedAt(LocalDateTime.now());
        return orderItemRepository.save(orderItem);
    }

    @Transactional
    public OrderItem requestReplacement(Long orderId, Long orderItemId, Long userId) {
        logger.debug("Requesting replacement for orderItemId: {} in orderId: {} by userId: {}", orderItemId, orderId, userId);
        OrderItem orderItem = orderItemRepository.findByIdAndOrderId(orderItemId, orderId)
                .orElseThrow(() -> new ResourceNotFoundException("OrderItem not found with id " + orderItemId));
        Order order = orderItem.getOrder();
        if (!order.getUserId().equals(userId)) {
            throw new ResourceNotFoundException("Order does not belong to user");
        }
        if (!OrderStatus.DELIVERED.name().equals(orderItem.getStatus())) {
            throw new IllegalArgumentException("Replacement can only be requested for delivered items");
        }
        orderItem.setStatus(OrderStatus.REPLACEMENT_REQUESTED.name());
        orderItem.setUpdatedAt(LocalDateTime.now());
        return orderItemRepository.save(orderItem);
    }

    @Transactional
    public OrderItem handleReturn(Long orderId, Long orderItemId, Long vendorId, boolean approve) {
        logger.debug("Handling return for orderItemId: {} in orderId: {} by vendorId: {}, approve: {}", orderItemId, orderId, vendorId, approve);
        OrderItem orderItem = orderItemRepository.findByIdAndOrderId(orderItemId, orderId)
                .orElseThrow(() -> new ResourceNotFoundException("OrderItem not found with id " + orderItemId));
        if (!orderItem.getSellerId().equals(vendorId)) {
            throw new ResourceNotFoundException("OrderItem does not belong to vendor");
        }
        if (!OrderStatus.RETURN_REQUESTED.name().equals(orderItem.getStatus())) {
            throw new IllegalArgumentException("OrderItem is not in return requested status");
        }
        orderItem.setStatus(approve ? OrderStatus.RETURNED.name() : OrderStatus.DELIVERED.name());
        orderItem.setUpdatedAt(LocalDateTime.now());
        orderItemRepository.save(orderItem);

        // Update order totalAmount if returned
        if (approve) {
            recalculateOrderTotal(orderItem.getOrder());
        }
        return orderItem;
    }

    @Transactional
    public OrderReview addReview(Long orderId, Long userId, Integer rating, String comment) {
        logger.debug("Adding review for orderId: {} by userId: {}", orderId, userId);
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found with id " + orderId));
        if (!order.getUserId().equals(userId)) {
            throw new ResourceNotFoundException("Order does not belong to user");
        }
        // Allow review if at least one item is DELIVERED or RETURNED
        boolean canReview = order.getOrderItems().stream()
                .anyMatch(item -> item.getStatus().equals(OrderStatus.DELIVERED.name()) || 
                                 item.getStatus().equals(OrderStatus.RETURNED.name()));
        if (!canReview) {
            throw new IllegalArgumentException("Reviews can only be added for orders with delivered or returned items");
        }
        if (orderReviewRepository.existsByOrderId(orderId)) {
            throw new IllegalArgumentException("Order already has a review");
        }
        OrderReview review = OrderReview.builder()
                .order(order)
                .rating(rating)
                .comment(comment)
                .createdAt(LocalDateTime.now())
                .build();
        return orderReviewRepository.save(review);
    }

    public byte[] generateInvoice(Long orderId, Long userId) {
        logger.debug("Generating invoice for orderId: {} by userId: {}", orderId, userId);
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found with id " + orderId));
        if (!order.getUserId().equals(userId) && 
            order.getOrderItems().stream().noneMatch(item -> item.getSellerId().equals(userId))) {
            throw new ResourceNotFoundException("Order does not belong to user or vendor");
        }
        // Placeholder for PDF generation
        return new byte[]{};
    }

    @Transactional
    public OrderAnalytics getVendorAnalytics(Long vendorId, LocalDateTime startDate, LocalDateTime endDate) {
        logger.debug("Generating analytics for vendorId: {} from {} to {}", vendorId, startDate, endDate);
        List<OrderItem> items = orderItemRepository.findBySellerId(vendorId).stream()
                .filter(item -> !item.getCreatedAt().isBefore(startDate) && !item.getCreatedAt().isAfter(endDate))
                .collect(Collectors.toList());

        BigDecimal totalSales = items.stream()
                .filter(item -> item.getStatus().equals(OrderStatus.DELIVERED.name()))
                .map(item -> item.getUnitPrice().multiply(BigDecimal.valueOf(item.getQuantity())))
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        long orderCount = items.size();
        long deliveredCount = items.stream()
                .filter(item -> item.getStatus().equals(OrderStatus.DELIVERED.name()))
                .count();

        return OrderAnalytics.builder()
                .vendorId(vendorId)
                .totalSales(totalSales)
                .orderCount(orderCount)
                .deliveredCount(deliveredCount)
                .build();
    }

    private void recalculateOrderTotal(Order order) {
        BigDecimal totalAmount = order.getOrderItems().stream()
                .filter(item -> !item.getStatus().equals(OrderStatus.CANCELLED.name()) && 
                               !item.getStatus().equals(OrderStatus.RETURNED.name()))
                .map(item -> item.getUnitPrice().multiply(BigDecimal.valueOf(item.getQuantity())))
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        order.setTotalAmount(totalAmount);
        order.setUpdatedAt(LocalDateTime.now());
        orderRepository.save(order);
    }

    private boolean isValidStatusTransition(OrderStatus current, OrderStatus next) {
        switch (current) {
            case PLACED:
                return next == OrderStatus.PROCESSING || next == OrderStatus.CANCELLED;
            case PROCESSING:
                return next == OrderStatus.SHIPPED || next == OrderStatus.CANCELLED;
            case SHIPPED:
                return next == OrderStatus.DELIVERED;
            case DELIVERED:
                return next == OrderStatus.RETURN_REQUESTED || next == OrderStatus.REPLACEMENT_REQUESTED;
            case RETURN_REQUESTED:
                return next == OrderStatus.RETURNED || next == OrderStatus.DELIVERED;
            case REPLACEMENT_REQUESTED:
                return next == OrderStatus.REPLACED || next == OrderStatus.DELIVERED;
            default:
                return false;
        }
    }
}