package com.ecommerce.service;

import com.ecommerce.model.Admin;
import com.ecommerce.repository.AdminRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * Service for managing Admin entities.
 */
@Service
@RequiredArgsConstructor
public class AdminService {

    private final AdminRepository adminRepository;

    /**
     * Adds a new admin to the database.
     * @param admin The admin to add.
     * @return The saved Admin.
     */
    public Admin addAdmin(Admin admin) {
        admin.setCreatedAt(LocalDateTime.now());
        admin.setUpdatedAt(LocalDateTime.now());
        return adminRepository.save(admin);
    }

    /**
     * Finds an admin by their ID.
     * @param id The admin ID.
     * @return Optional containing the Admin, or empty if not found.
     */
    public Optional<Admin> findById(Long id) {
        return adminRepository.findById(id);
    }

    /**
     * Retrieves all admins.
     * @return List of all admins.
     */
    public List<Admin> findAll() {
        return adminRepository.findAll();
    }

    /**
     * Checks if an email is already registered.
     * @param email The email to check.
     * @return true if the email exists, false otherwise.
     */
    public boolean existsByEmail(String email) {
        return adminRepository.existsByEmail(email);
    }

    /**
     * Finds an admin by their email.
     * @param email The admin's email.
     * @return Optional containing the Admin, or empty if not found.
     */
    public Optional<Admin> findByEmail(String email) {
        return adminRepository.findByEmail(email);
    }

    /**
     * Finds an admin by their phone number.
     * @param phone The phone number.
     * @return Optional containing the Admin, or empty if not found.
     */
    public Optional<Admin> findByPhone(String phone) {
        return adminRepository.findByPhone(phone);
    }

    /**
     * Checks if a phone number is already registered.
     * @param phone The phone number to check.
     * @return true if the phone exists, false otherwise.
     */
    public boolean existsByPhone(String phone) {
        return adminRepository.existsByPhone(phone);
    }
}