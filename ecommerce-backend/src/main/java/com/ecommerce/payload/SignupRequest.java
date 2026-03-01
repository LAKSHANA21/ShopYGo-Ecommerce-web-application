package com.ecommerce.payload;

import lombok.Data;

@Data
public class SignupRequest {
    private String firstName;
    private String lastName;
    private String email;
    private String password;
    private String phone;
    private String role; // user, seller, admin
}
