package com.ecommerce.controller;

import com.ecommerce.model.Admin;
import com.ecommerce.model.Seller;
import com.ecommerce.model.User;
import com.ecommerce.payload.*;
import com.ecommerce.security.JwtTokenProvider;
import com.ecommerce.service.*;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@CrossOrigin("*")
public class AuthController {

    private static final Logger logger = LoggerFactory.getLogger(AuthController.class);

    private final UserService userService;
    private final SellerService sellerService;
    private final AdminService adminService;
    private final JwtTokenProvider tokenProvider;
    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService;
    private final SmsService smsService;

    private static final Map<String, OtpDetails> otpCache = new ConcurrentHashMap<>();

    private static class OtpDetails {
        String otp;
        LocalDateTime expiry;

        OtpDetails(String otp, LocalDateTime expiry) {
            this.otp = otp;
            this.expiry = expiry;
        }
    }

    @PostMapping("/userRegister")
    public ResponseEntity<ApiResponse> registerUser(@RequestBody UserSignupRequest signupRequest) {
        // Check email uniqueness across all tables
        if (userService.existsByEmail(signupRequest.getEmail()) ||
                sellerService.existsByEmail(signupRequest.getEmail()) ||
                adminService.existsByEmail(signupRequest.getEmail())) {
            logger.warn("Registration failed: Email already in use: {}", signupRequest.getEmail());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(new ApiResponse(false, "Email is already in use"));
        }

        // Check phone uniqueness across all tables
        if (userService.existsByPhone(signupRequest.getPhone()) ||
                sellerService.existsByPhone(signupRequest.getPhone()) ||
                adminService.existsByPhone(signupRequest.getPhone())) {
            logger.warn("Registration failed: Phone number already in use: {}", signupRequest.getPhone());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(new ApiResponse(false, "Phone number is already in use"));
        }

        try {
            User user = User.builder()
                    .firstName(signupRequest.getFirstName())
                    .lastName(signupRequest.getLastName())
                    .email(signupRequest.getEmail())
                    .password(passwordEncoder.encode(signupRequest.getPassword()))
                    .phone(signupRequest.getPhone())
                    .role("USER")
                    .createdAt(LocalDateTime.now())
                    .updatedAt(LocalDateTime.now())
                    .addressLine1(signupRequest.getAddressLine1())
                    .addressLine2(signupRequest.getAddressLine2())
                    .city(signupRequest.getCity())
                    .state(signupRequest.getState())
                    .postalCode(signupRequest.getPostalCode())
                    .country(signupRequest.getCountry())
                    .dob(signupRequest.getDob())
                    .gender(signupRequest.getGender())
                    .build();

            userService.save(user);
            logger.info("User registered successfully: {}", signupRequest.getEmail());
            return ResponseEntity.ok(new ApiResponse(true, "User registered successfully"));
        } catch (Exception e) {
            logger.error("Failed to register user {}: {}", signupRequest.getEmail(), e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ApiResponse(false, "Failed to register user: " + e.getMessage()));
        }
    }

    @PostMapping("/sellerRegister")
    public ResponseEntity<ApiResponse> registerSeller(@RequestBody SellerSignupRequest signupRequest) {
        // Check email uniqueness across all tables
        if (userService.existsByEmail(signupRequest.getEmail()) ||
                sellerService.existsByEmail(signupRequest.getEmail()) ||
                adminService.existsByEmail(signupRequest.getEmail())) {
            logger.warn("Registration failed: Email already in use: {}", signupRequest.getEmail());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(new ApiResponse(false, "Email is already in use"));
        }

        // Check phone uniqueness across all tables
        if (userService.existsByPhone(signupRequest.getPhone()) ||
                sellerService.existsByPhone(signupRequest.getPhone()) ||
                adminService.existsByPhone(signupRequest.getPhone())) {
            logger.warn("Registration failed: Phone number already in use: {}", signupRequest.getPhone());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(new ApiResponse(false, "Phone number is already in use"));
        }

        try {
            Seller seller = Seller.builder()
                    .firstName(signupRequest.getFirstName())
                    .lastName(signupRequest.getLastName())
                    .email(signupRequest.getEmail())
                    .password(passwordEncoder.encode(signupRequest.getPassword()))
                    .phone(signupRequest.getPhone())
                    .role("SELLER")
                    .storeName(signupRequest.getStoreName())
                    .businessDetails(signupRequest.getBusinessDetails())
                    .addressLine1(signupRequest.getAddressLine1())
                    .addressLine2(signupRequest.getAddressLine2())
                    .city(signupRequest.getCity())
                    .state(signupRequest.getState())
                    .postalCode(signupRequest.getPostalCode())
                    .country(signupRequest.getCountry())
                    .gstNumber(signupRequest.getGstNumber())
                    .bankDetails(signupRequest.getBankDetails())
                    .createdAt(LocalDateTime.now())
                    .updatedAt(LocalDateTime.now())
                    .build();

            sellerService.addSeller(seller);
            logger.info("Seller registered successfully: {}", signupRequest.getEmail());
            return ResponseEntity.ok(new ApiResponse(true, "Seller registered successfully"));
        } catch (Exception e) {
            logger.error("Failed to register seller {}: {}", signupRequest.getEmail(), e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ApiResponse(false, "Failed to register seller: " + e.getMessage()));
        }
    }

    @PostMapping("/adminRegister")
    public ResponseEntity<ApiResponse> registerAdmin(@RequestBody AdminSignupRequest signupRequest) {
        // Check email uniqueness across all tables
        if (userService.existsByEmail(signupRequest.getEmail()) ||
                sellerService.existsByEmail(signupRequest.getEmail()) ||
                adminService.existsByEmail(signupRequest.getEmail())) {
            logger.warn("Registration failed: Email already in use: {}", signupRequest.getEmail());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(new ApiResponse(false, "Email is already in use"));
        }

        // Check phone uniqueness across all tables
        if (userService.existsByPhone(signupRequest.getPhone()) ||
                sellerService.existsByPhone(signupRequest.getPhone()) ||
                adminService.existsByPhone(signupRequest.getPhone())) {
            logger.warn("Registration failed: Phone number already in use: {}", signupRequest.getPhone());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(new ApiResponse(false, "Phone number is already in use"));
        }

        try {
            Admin admin = Admin.builder()
                    .firstName(signupRequest.getFirstName())
                    .lastName(signupRequest.getLastName())
                    .email(signupRequest.getEmail())
                    .phone(signupRequest.getPhone())
                    .password(passwordEncoder.encode(signupRequest.getPassword()))
                    .role("ADMIN")
                    .createdAt(LocalDateTime.now())
                    .updatedAt(LocalDateTime.now())
                    .build();

            adminService.addAdmin(admin);
            logger.info("Admin registered successfully: {}", signupRequest.getEmail());
            return ResponseEntity.ok(new ApiResponse(true, "Admin registered successfully"));
        } catch (Exception e) {
            logger.error("Failed to register admin {}: {}", signupRequest.getEmail(), e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ApiResponse(false, "Failed to register admin: " + e.getMessage()));
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> authenticateUser(@RequestBody LoginRequest loginRequest) {
        Optional<User> userOptional = userService.findByEmailOrMobile(loginRequest.getIdentifier());
        Optional<Admin> adminOptional = adminService.findByEmail(loginRequest.getIdentifier());
        Optional<Seller> sellerOptional = sellerService.findByEmailOrMobile(loginRequest.getIdentifier());

        if (userOptional.isEmpty() && adminOptional.isEmpty() && sellerOptional.isEmpty()) {
            logger.warn("Login attempt with invalid identifier: {}", loginRequest.getIdentifier());
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(new ApiResponse(false, "Invalid identifier"));
        }

        String email = loginRequest.getIdentifier();
        String password = null;
        String role = null;
        Long userId = null;
        Long sellerId = null;
        Long adminId = null;

        if (userOptional.isPresent()) {
            User user = userOptional.get();
            email = user.getEmail();
            password = user.getPassword();
            role = user.getRole();
            userId = user.getId();
        } else if (adminOptional.isPresent()) {
            Admin admin = adminOptional.get();
            email = admin.getEmail();
            password = admin.getPassword();
            role = admin.getRole();
            adminId = admin.getId();
        } else if (sellerOptional.isPresent()) {
            Seller seller = sellerOptional.get();
            email = seller.getEmail();
            password = seller.getPassword();
            role = seller.getRole();
            sellerId = seller.getId();
        }

        if (loginRequest.getOtp() != null && !loginRequest.getOtp().isEmpty()) {
            OtpDetails otpDetails = otpCache.get(loginRequest.getIdentifier());
            if (otpDetails == null || !otpDetails.otp.equals(loginRequest.getOtp()) || otpDetails.expiry.isBefore(LocalDateTime.now())) {
                logger.warn("Invalid or expired OTP for identifier: {}", loginRequest.getIdentifier());
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(new ApiResponse(false, "Invalid or expired OTP"));
            }
            otpCache.remove(loginRequest.getIdentifier());
            logger.info("OTP login successful for: {}", email);
        } else if (loginRequest.getPassword() != null && !loginRequest.getPassword().isEmpty()) {
            if (!passwordEncoder.matches(loginRequest.getPassword(), password)) {
                logger.warn("Invalid password for identifier: {}", loginRequest.getIdentifier());
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(new ApiResponse(false, "Invalid password"));
            }
            logger.info("Password login successful for: {}", email);
        } else {
            logger.warn("No authentication credential provided for: {}", loginRequest.getIdentifier());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(new ApiResponse(false, "Authentication credential required"));
        }

        Map<String, Object> claims = new HashMap<>();
        claims.put("role", role);
        String accessToken = tokenProvider.generateAccessToken(email, claims);
        String refreshToken = tokenProvider.generateRefreshToken(email);

        Map<String, Object> response = new HashMap<>();
        response.put("accessToken", accessToken);
        response.put("refreshToken", refreshToken);
        response.put("tokenType", "Bearer");
        if (userId != null) {
            response.put("userId", userId);
        }
        if (sellerId != null) {
            response.put("sellerId", sellerId);
        }
        if (adminId != null) {
            response.put("adminId", adminId);
        }

        return ResponseEntity.ok(response);
    }

    @PostMapping("/refresh-token")
    public ResponseEntity<?> refreshAccessToken(@RequestBody Map<String, String> request) {
        String refreshToken = request.get("refreshToken");
        if (refreshToken == null || !tokenProvider.validateToken(refreshToken)) {
            logger.warn("Invalid or missing refresh token: {}", refreshToken);
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(new ApiResponse(false, "Invalid or missing refresh token"));
        }

        String username = tokenProvider.getUsernameFromToken(refreshToken);
        String role = tokenProvider.getRoleFromToken(refreshToken);
        Map<String, Object> claims = new HashMap<>();
        if (role != null) {
            claims.put("role", role);
        }
        String newAccessToken = tokenProvider.generateAccessToken(username, claims);

        Map<String, String> response = new HashMap<>();
        response.put("accessToken", newAccessToken);
        response.put("refreshToken", refreshToken);
        logger.info("Access token refreshed for: {}", username);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/request-otp")
    public ResponseEntity<ApiResponse> requestOtp(@RequestParam String identifier) {
        String otp = String.valueOf(100000 + (int)(Math.random() * 900000));
        LocalDateTime expiry = LocalDateTime.now().plusMinutes(5);
        otpCache.put(identifier, new OtpDetails(otp, expiry));

        try {
            if (identifier.contains("@")) {
                emailService.sendSimpleMessage(identifier, "Your OTP Code", "Your OTP is: " + otp);
                logger.info("OTP sent via email to: {}", identifier);
            } else {
                smsService.sendSms(identifier, "Your OTP is: " + otp);
                logger.info("OTP sent via SMS to: {}", identifier);
            }
            return ResponseEntity.ok(new ApiResponse(true, "OTP sent successfully"));
        } catch (RuntimeException e) {
            logger.error("Failed to send OTP to {}: {}", identifier, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ApiResponse(false, "Failed to send OTP: " + e.getMessage()));
        }
    }
}