package com.ecommerce.service;

import com.ecommerce.exception.ResourceNotFoundException;
import com.ecommerce.model.Seller;
import com.ecommerce.model.SellerStatus;
import com.ecommerce.repository.SellerRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * Service for managing Seller entities.
 */
@Service
@RequiredArgsConstructor
public class SellerService {

    private final SellerRepository sellerRepository;

    /**
     * Adds a new seller to the database.
     * @param seller The seller to add.
     * @return The saved Seller.
     */
    public Seller addSeller(Seller seller) {
        seller.setCreatedAt(LocalDateTime.now());
        seller.setUpdatedAt(LocalDateTime.now());
        return sellerRepository.save(seller);
    }

    /**
     * Retrieves a seller by their ID.
     * @param id The seller ID.
     * @return The Seller.
     * @throws ResourceNotFoundException if seller not found.
     */
    public Seller getSellerById(Long id) {
        return sellerRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Seller not found with ID " + id));
    }

    /**
     * Retrieves all sellers.
     * @return List of all sellers.
     */
    public List<Seller> getAllSellers() {
        return sellerRepository.findAll();
    }

    /**
     * Updates an existing seller.
     * @param id The seller ID.
     * @param updatedSeller The updated seller data.
     * @return The updated Seller.
     * @throws ResourceNotFoundException if seller not found.
     */
    public Seller updateSeller(Long id, Seller updatedSeller) {
        Seller existingSeller = getSellerById(id);
        existingSeller.setFirstName(updatedSeller.getFirstName());
        existingSeller.setLastName(updatedSeller.getLastName());
        existingSeller.setEmail(updatedSeller.getEmail());
        existingSeller.setPassword(updatedSeller.getPassword());
        existingSeller.setPhone(updatedSeller.getPhone());
        existingSeller.setStoreName(updatedSeller.getStoreName());
        existingSeller.setBusinessDetails(updatedSeller.getBusinessDetails());
        existingSeller.setAddressLine1(updatedSeller.getAddressLine1());
        existingSeller.setAddressLine2(updatedSeller.getAddressLine2());
        existingSeller.setCity(updatedSeller.getCity());
        existingSeller.setState(updatedSeller.getState());
        existingSeller.setPostalCode(updatedSeller.getPostalCode());
        existingSeller.setCountry(updatedSeller.getCountry());
        existingSeller.setGstNumber(updatedSeller.getGstNumber());
        existingSeller.setBankDetails(updatedSeller.getBankDetails());
        existingSeller.setStatus(updatedSeller.getStatus());
        existingSeller.setUpdatedAt(LocalDateTime.now());
        return sellerRepository.save(existingSeller);
    }

    /**
     * Updates a seller's status.
     * @param id The seller ID.
     * @param status The new status.
     * @return The updated Seller.
     * @throws ResourceNotFoundException if seller not found.
     */
    public Seller updateSellerStatus(Long id, SellerStatus status) {
        Seller seller = getSellerById(id);
        seller.setStatus(status);
        seller.setUpdatedAt(LocalDateTime.now());
        return sellerRepository.save(seller);
    }

    /**
     * Deletes a seller by their ID.
     * @param id The seller ID.
     * @throws ResourceNotFoundException if seller not found.
     */
    public void deleteSeller(Long id) {
        Seller seller = getSellerById(id);
        sellerRepository.delete(seller);
    }

    /**
     * Finds a seller by their email or phone number.
     * @param identifier The email or phone number.
     * @return Optional containing the Seller, or empty if not found.
     */
    public Optional<Seller> findByEmailOrMobile(String identifier) {
        Optional<Seller> sellerOpt = sellerRepository.findByEmail(identifier);
        if (sellerOpt.isPresent()) {
            return sellerOpt;
        }
        return sellerRepository.findByPhone(identifier);
    }

    /**
     * Finds a seller by their ID.
     * @param id The seller ID.
     * @return Optional containing the Seller, or empty if not found.
     */
    public Optional<Seller> findById(Long id) {
        return sellerRepository.findById(id);
    }

    /**
     * Checks if an email is already registered.
     * @param email The email to check.
     * @return true if the email exists, false otherwise.
     */
    public boolean existsByEmail(String email) {
        return sellerRepository.existsByEmail(email);
    }

    /**
     * Finds a seller by their phone number.
     * @param phone The phone number.
     * @return Optional containing the Seller, or empty if not found.
     */
    public Optional<Seller> findByPhone(String phone) {
        return sellerRepository.findByPhone(phone);
    }

    /**
     * Checks if a phone number is already registered.
     * @param phone The phone number to check.
     * @return true if the phone exists, false otherwise.
     */
    public boolean existsByPhone(String phone) {
        return sellerRepository.findByPhone(phone).isPresent();
    }
}