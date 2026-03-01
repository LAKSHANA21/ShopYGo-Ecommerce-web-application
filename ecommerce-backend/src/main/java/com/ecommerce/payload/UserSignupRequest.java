package com.ecommerce.payload;

import lombok.Data;
import java.time.LocalDate;

@Data
public class UserSignupRequest {
    // Basic user details
    private String firstName;
    private String lastName;
    private String email;
    private String password;
    private String phone;
    
    // Profile details
    private String addressLine1;
    private String addressLine2;
    private String city;
    private String state;
    private String postalCode;
    private String country;
    private LocalDate dob;
    private String gender;
}
