package com.ecommerce.service;

import com.twilio.Twilio;
import com.twilio.exception.ApiException;
import com.twilio.rest.api.v2010.account.Message;
import com.twilio.type.PhoneNumber;
import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class SmsService {

    private static final Logger logger = LoggerFactory.getLogger(SmsService.class);

    @Value("${twilio.account.sid}")
    private String accountSid;

    @Value("${twilio.auth.token}")
    private String authToken;

    @Value("${twilio.phone.number}")
    private String fromNumber;

    @PostConstruct
    public void init() {
        if (accountSid == null || authToken == null || fromNumber == null) {
            throw new IllegalStateException("Twilio configuration is incomplete. Check account.sid, auth.token, and phone.number in application.properties.");
        }
        try {
            Twilio.init(accountSid, authToken);
            logger.info("Twilio initialized successfully with Account SID: {}", accountSid);
        } catch (Exception e) {
            logger.error("Failed to initialize Twilio: {}", e.getMessage(), e);
            throw new IllegalStateException("Twilio initialization failed", e);
        }
    }

    public void sendSms(String to, String messageBody) {
        if (to == null || !to.matches("^\\+[1-9]\\d{1,14}$")) {
            logger.warn("Invalid phone number format: {}", to);
            throw new IllegalArgumentException("Phone number must be in E.164 format (e.g., +1234567890)");
        }
        if (messageBody == null || messageBody.trim().isEmpty()) {
            logger.warn("Message body is empty for phone number: {}", to);
            throw new IllegalArgumentException("Message body cannot be empty");
        }

        try {
            Message message = Message.creator(
                    new PhoneNumber(to),
                    new PhoneNumber(fromNumber),
                    messageBody
            ).create();
            logger.info("SMS sent successfully to {} with SID: {}", to, message.getSid());
        } catch (ApiException e) {
            logger.error("Failed to send SMS to {}: {}", to, e.getMessage(), e);
            throw new RuntimeException("Failed to send SMS: " + e.getMessage(), e);
        }
    }
}