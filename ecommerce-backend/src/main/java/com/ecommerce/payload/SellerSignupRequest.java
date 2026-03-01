package com.ecommerce.payload;

import lombok.Data;
import java.time.LocalDate;

@Data
public class SellerSignupRequest {
    // Basic seller details
    private String firstName;
    private String lastName;
    private String email;
    private String password;
    private String phone;

    // Common profile details
    private String addressLine1;
    private String addressLine2;
    private String city;
    private String state;
    private String postalCode;
    private String country;
    private LocalDate dob;
    private String gender;

    // Seller-specific details
    private String storeName;
    private String businessDetails;
    private String gstNumber;
    private String bankDetails;
}