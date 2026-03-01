package com.ecommerce.service;

import com.ecommerce.model.User;
import com.ecommerce.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

/**
 * Service for managing User entities.
 */
@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;

    /**
     * Finds a user by their ID.
     * @param id The user ID.
     * @return Optional containing the User, or empty if not found.
     */
    public Optional<User> findById(Long id) {
        return userRepository.findById(id);
    }

    /**
     * Finds a user by their email.
     * @param email The user's email.
     * @return Optional containing the User, or empty if not found.
     */
    public Optional<User> findByEmail(String email) {
        return userRepository.findByEmail(email);
    }

    /**
     * Finds all users.
     * @return List of all users.
     */
    public List<User> findAll() {
        return userRepository.findAll();
    }

    /**
     * Finds users by their role.
     * @param role The role to filter by (e.g., "USER").
     * @return List of users with the specified role.
     */
    public List<User> findByRole(String role) {
        return userRepository.findByRole(role);
    }

    /**
     * Checks if an email is already registered.
     * @param email The email to check.
     * @return true if the email exists, false otherwise.
     */
    public boolean existsByEmail(String email) {
        return userRepository.existsByEmail(email);
    }

    /**
     * Checks if a phone number is already registered.
     * @param phone The phone number to check.
     * @return true if the phone exists, false otherwise.
     */
    public boolean existsByPhone(String phone) {
        return userRepository.findByPhone(phone).isPresent();
    }

    /**
     * Finds a user by their email or phone number.
     * @param identifier The email or phone number.
     * @return Optional containing the User, or empty if not found.
     */
    public Optional<User> findByEmailOrMobile(String identifier) {
        Optional<User> userOpt = userRepository.findByEmail(identifier);
        if (userOpt.isPresent()) {
            return userOpt;
        }
        return userRepository.findByPhone(identifier);
    }

    /**
     * Saves a user to the database.
     * @param user The user to save.
     * @return The saved User.
     */
    public User save(User user) {
        return userRepository.save(user);
    }

    /**
     * Deletes a user by their ID.
     * @param id The user ID.
     */
    public void delete(Long id) {
        userRepository.deleteById(id);
    }
}