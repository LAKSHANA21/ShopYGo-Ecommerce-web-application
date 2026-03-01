package com.ecommerce.payload;

import lombok.Data;

@Data
public class AdminSignupRequest {
    // Basic admin details
    private String firstName;
    private String lastName;
    private String email;
    private String password;
    private String phone;
}
