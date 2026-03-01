package com.ecommerce.service;

import com.ecommerce.model.CompleteOrder;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class EmailService {
    
    private final JavaMailSender mailSender;
    
    @Value("${spring.mail.username}")
    private String fromAddress;
    
    public void sendSimpleMessage(String to, String subject, String text) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(fromAddress);
        message.setTo(to);
        message.setSubject(subject);
        message.setText(text);
        mailSender.send(message);
    }

    public void sendOrderConfirmation(CompleteOrder order) {
        String userSubject = "Your Order #" + order.getId() + " has been placed";
        String userText = "Thank you for your order!\n\n" +
                "Order ID: " + order.getId() + "\n" +
                "Product: " + order.getProductId() + "\n" +
                "Quantity: " + order.getQuantity() + "\n" +
                "Total Amount: " + order.getTotalAmount() + "\n\n" +
                "We'll notify you when your order is shipped.";

        String sellerSubject = "New Order #" + order.getId() + " received";
        String sellerText = "You have received a new order!\n\n" +
                "Order ID: " + order.getId() + "\n" +
                "Product: " + order.getProductId() + "\n" +
                "Quantity: " + order.getQuantity() + "\n" +
                "Total Amount: " + order.getTotalAmount() + "\n\n" +
                "Please process this order soon.";

        // In a real application, you would get user and seller emails from user service
        sendSimpleMessage("user@example.com", userSubject, userText);
        sendSimpleMessage("seller@example.com", sellerSubject, sellerText);
    }

    public void sendStatusUpdateNotification(CompleteOrder order) {
        String subject = "Order #" + order.getId() + " status updated";
        String text = "Your order status has been updated to: " + order.getOrderStatus() + "\n\n" +
                "Order ID: " + order.getId() + "\n" +
                "Current Status: " + order.getOrderStatus() + "\n" +
                "Shipping Status: " + order.getShippingStatus() + "\n\n" +
                "Thank you for shopping with us!";

        sendSimpleMessage("user@example.com", subject, text);
    }

    public void sendOrderCancellationNotification(CompleteOrder order) {
        String userSubject = "Order #" + order.getId() + " has been cancelled";
        String userText = "Your order has been cancelled as requested.\n\n" +
                "Order ID: " + order.getId() + "\n" +
                "Product: " + order.getProductId() + "\n" +
                "Quantity: " + order.getQuantity() + "\n" +
                "Total Amount: " + order.getTotalAmount() + "\n\n" +
                "If this was a mistake, please contact support.";

        String sellerSubject = "Order #" + order.getId() + " has been cancelled";
        String sellerText = "An order has been cancelled.\n\n" +
                "Order ID: " + order.getId() + "\n" +
                "Product: " + order.getProductId() + "\n" +
                "Quantity: " + order.getQuantity() + "\n" +
                "Total Amount: " + order.getTotalAmount() + "\n\n" +
                "No further action is required.";

        sendSimpleMessage("user@example.com", userSubject, userText);
        sendSimpleMessage("seller@example.com", sellerSubject, sellerText);
    }

    public void sendShippingNotification(CompleteOrder order) {
        String subject = "Your Order #" + order.getId() + " has been shipped";
        String text = "Great news! Your order has been shipped.\n\n" +
                "Order ID: " + order.getId() + "\n" +
                "Shipping Status: " + order.getShippingStatus() + "\n\n" +
                "You can expect delivery soon. Thank you for shopping with us!";

        sendSimpleMessage("user@example.com", subject, text);
    }
}