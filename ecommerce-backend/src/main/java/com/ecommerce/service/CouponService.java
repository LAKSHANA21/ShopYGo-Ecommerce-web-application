package com.ecommerce.service;

import com.ecommerce.model.Coupon;
import com.ecommerce.repository.CouponRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class CouponService {

    private final CouponRepository couponRepository;
    
    public List<Coupon> findAll() {
        return couponRepository.findAll();
    }
    
    public Optional<Coupon> findById(Long id) {
        return couponRepository.findById(id);
    }
    
    public Coupon save(Coupon coupon) {
        return couponRepository.save(coupon);
    }
}
