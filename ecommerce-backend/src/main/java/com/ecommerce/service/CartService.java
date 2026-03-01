package com.ecommerce.service;
import com.ecommerce.model.Cart;
import com.ecommerce.repository.CartRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Optional;
@Service
@RequiredArgsConstructor
public class CartService {
    private final CartRepository cartRepository;
    public List<Cart> findAll() { return cartRepository.findAll(); }
    public Optional<Cart> findById(Long id) { return cartRepository.findById(id); }
    public Optional<Cart> findByUserId(Long userId) { return cartRepository.findTopByUserIdOrderByUpdatedAtDesc(userId); }
    public Cart save(Cart cart) { return cartRepository.save(cart); }
}