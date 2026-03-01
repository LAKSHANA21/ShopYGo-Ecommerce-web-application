package com.ecommerce.security;

import com.ecommerce.model.Admin;
import com.ecommerce.model.Seller;
import com.ecommerce.model.User;
import com.ecommerce.repository.AdminRepository;
import com.ecommerce.repository.SellerRepository;
import com.ecommerce.repository.UserRepository;
import lombok.RequiredArgsConstructor;

import java.util.Optional;

import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class CustomUserDetailsService implements UserDetailsService {

    private final UserRepository userRepository;
    private final AdminRepository adminRepository;
    private final SellerRepository sellerRepository;

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        // Check users table
        Optional<User> userOpt = userRepository.findByEmail(username);
        if (userOpt.isPresent()) {
            User user = userOpt.get();
            return org.springframework.security.core.userdetails.User
                    .withUsername(user.getEmail())
                    .password(user.getPassword())
                    .authorities("ROLE_" + user.getRole().toUpperCase())
                    .build();
        }

        // Check admins table
        Optional<Admin> adminOpt = adminRepository.findByEmail(username);
        if (adminOpt.isPresent()) {
            Admin admin = adminOpt.get();
            return org.springframework.security.core.userdetails.User
                    .withUsername(admin.getEmail())
                    .password(admin.getPassword())
                    .authorities("ROLE_" + admin.getRole().toUpperCase())
                    .build();
        }

        // Check seller table
        Optional<Seller> sellerOpt = sellerRepository.findByEmail(username);
        if (sellerOpt.isPresent()) {
            Seller seller = sellerOpt.get();
            return org.springframework.security.core.userdetails.User
                    .withUsername(seller.getEmail())
                    .password(seller.getPassword())
                    .authorities("ROLE_" + seller.getRole().toUpperCase())
                    .build();
        }

        throw new UsernameNotFoundException("User not found with email: " + username);
    }
}