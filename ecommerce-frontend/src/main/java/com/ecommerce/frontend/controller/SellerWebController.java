package com.ecommerce.frontend.controller;


import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;

@Controller
@RequestMapping("/seller")
public class SellerWebController {

    @GetMapping("/login")
    public String showLoginPage(@RequestParam(value = "error", required = false) String error, Model model) {
        if (error != null) {
            model.addAttribute("error", "Invalid credentials");
        }
        return "seller/sellerAuth";
    }

    @GetMapping("/register")
    public String showRegisterPage() {
        return "seller/register";
    }

    @GetMapping("/dashboard")
    public String showDashboard() {
        return "seller/dashboard";
    }

    @GetMapping("/sellerproducts")
    public String showSellerProducts() {
        return "seller/sellerproducts";
    }
    
    @GetMapping("/profile")
    public String showProfile() {
        return "seller/sellerprofile";
    }

    @GetMapping("/products")
    public String showProducts() {
        return "seller/products";
    }
    
    @GetMapping("/sellerorders")
    public String showSellerOrder() {
        return "seller/sellerorder";
    }
    
    @GetMapping("/sellercategories")
    public String showSellerCategories() {
        return "seller/sellercategories";
    }
}