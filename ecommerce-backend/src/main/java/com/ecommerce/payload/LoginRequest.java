package com.ecommerce.payload;

import lombok.Data;

@Data
public class LoginRequest {
    // Can be either email or mobile
    private String identifier;
    private String password;  // Optional if using OTP
    private String otp;       // Optional if using password
}
