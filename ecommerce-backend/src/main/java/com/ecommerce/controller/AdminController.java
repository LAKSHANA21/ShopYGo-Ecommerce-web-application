package com.ecommerce.controller;

import com.ecommerce.exception.ResourceNotFoundException;
import com.ecommerce.model.Admin;
import com.ecommerce.model.Seller;
import com.ecommerce.model.SellerStatus;
import com.ecommerce.model.User;
import com.ecommerce.payload.ApiResponse;
import com.ecommerce.service.AdminService;
import com.ecommerce.service.SellerService;
import com.ecommerce.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {

    private final UserService userService;
    private final SellerService sellerService;
    private final AdminService adminService;

    @GetMapping("/dashboard")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> getAdminDashboard() {
        return ResponseEntity.ok(new ApiResponse(true, "Admin dashboard data (replace with actual logic)"));
    }

    // Fetch full details of all regular users (role "USER")
    @GetMapping("/users")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<User>> getAllUsers() {
        List<User> users = userService.findByRole("USER");
        return ResponseEntity.ok(users);
    }

    @PutMapping("/users/{id}/verify")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> verifyUser(@PathVariable Long id, @RequestParam boolean verified) {
        Optional<User> optionalUser = userService.findById(id);
        if (optionalUser.isEmpty()) {
            throw new ResourceNotFoundException("User not found with id " + id);
        }
        User user = optionalUser.get();
        user.setUpdatedAt(LocalDateTime.now());
        userService.save(user);
        return ResponseEntity.ok(new ApiResponse(true, "User verification status updated"));
    }

    // Fetch full details of all sellers from the seller table
    @GetMapping("/sellers")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<Seller>> getAllSellers() {
        List<Seller> sellers = sellerService.getAllSellers();
        return ResponseEntity.ok(sellers);
    }

    @PutMapping("/sellers/{id}/verify")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> verifySeller(@PathVariable Long id, @RequestParam boolean verified) {
        Optional<Seller> optionalSeller = sellerService.findById(id);
        if (optionalSeller.isEmpty()) {
            throw new ResourceNotFoundException("Seller not found with id " + id);
        }
        Seller seller = optionalSeller.get();
        seller.setStatus(verified ? SellerStatus.ACTIVE : SellerStatus.PENDING);
        seller.setUpdatedAt(LocalDateTime.now());
        sellerService.updateSeller(id, seller);
        return ResponseEntity.ok(new ApiResponse(true, "Seller verification status updated"));
    }

    // New endpoint to update seller status
    @PatchMapping("/sellers/{id}/status")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse> updateSellerStatus(
            @PathVariable Long id,
            @RequestParam("status") String status) {
        try {
            SellerStatus sellerStatus = SellerStatus.valueOf(status.toUpperCase());
            Seller updatedSeller = sellerService.updateSellerStatus(id, sellerStatus);
            return ResponseEntity.ok(new ApiResponse(true, "Seller status updated to " + updatedSeller.getStatus()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest()
                    .body(new ApiResponse(false, "Invalid status value: " + status));
        } catch (ResourceNotFoundException e) {
            return ResponseEntity.status(404)
                    .body(new ApiResponse(false, "Seller not found with id " + id));
        } catch (Exception e) {
            return ResponseEntity.status(500)
                    .body(new ApiResponse(false, "Failed to update seller status: " + e.getMessage()));
        }
    }

    // Fetch full details of all admins
    @GetMapping("/admins")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<Admin>> getAllAdmins() {
        List<Admin> admins = adminService.findAll();
        return ResponseEntity.ok(admins);
    }

    // Add a new admin (using the Admin model)
    @PostMapping("/create")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> addAdmin(@RequestBody Admin admin) {
        if (adminService.existsByEmail(admin.getEmail())) {
            return ResponseEntity.badRequest().body(new ApiResponse(false, "Email already exists"));
        }
        Admin savedAdmin = adminService.addAdmin(admin);
        return ResponseEntity.ok(new ApiResponse(true, "Admin added successfully"));
    }
}