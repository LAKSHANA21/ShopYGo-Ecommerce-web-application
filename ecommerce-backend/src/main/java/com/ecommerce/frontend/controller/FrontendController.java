package com.ecommerce.frontend.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class FrontendController {

    @GetMapping("/")
    public String home() {
        return "redirect:/login";
    }

    @GetMapping("/login")
    public String showLoginPage() {
        return "auth/userAuth";
    }

    @GetMapping("/products")
    public String showProductPage() {
        return "user/products";
    }
    @GetMapping("/profile")
    public String showProfilePage() {
        return "user/profile";
    }
    @GetMapping("/orders")
    public String showOrdersPage() {
        return "user/orders";
    }
    @GetMapping("/checkout")
    public String showCheckoutPage() {
        return "user/checkout";
    }
    @GetMapping("/cart")
    public String showCartPage() {
        return "user/cart";
    }
    @GetMapping("/wishlist")
    public String showWishlistPage() {
        return "user/wishlist";
    }
}