package com.ecommerce.security;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.security.Key;
import java.util.Date;
import java.util.Map;

@Component
public class JwtTokenProvider {

    private final Key key;

    @Value("${jwt.access.expiration.ms}")
    private long accessTokenExpirationMs;

    @Value("${jwt.refresh.expiration.ms}")
    private long refreshTokenExpirationMs;

    public JwtTokenProvider(@Value("${jwt.secret}") String jwtSecret) {
        this.key = Keys.hmacShaKeyFor(java.util.Base64.getDecoder().decode(jwtSecret));
    }

    // Generate Access Token with Claims
    public String generateAccessToken(String username, Map<String, Object> claims) {
        return Jwts.builder()
                .setSubject(username) // Set subject first
                .addClaims(claims)    // Add custom claims (e.g., role)
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + accessTokenExpirationMs))
                .signWith(key, SignatureAlgorithm.HS256)
                .compact();
    }

    // Generate Refresh Token
    public String generateRefreshToken(String username) {
        return Jwts.builder()
                .setSubject(username)
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + refreshTokenExpirationMs))
                .signWith(key, SignatureAlgorithm.HS256)
                .compact();
    }

    // Validate Token
    public boolean validateToken(String token) {
        try {
            Jwts.parserBuilder().setSigningKey(key).build().parseClaimsJws(token);
            return true;
        } catch (ExpiredJwtException e) {
            System.out.println("Token expired: " + e.getMessage());
        } catch (UnsupportedJwtException e) {
            System.out.println("Unsupported token: " + e.getMessage());
        } catch (MalformedJwtException e) {
            System.out.println("Malformed token: " + e.getMessage());
        } catch (Exception e) {
            System.out.println("Invalid token: " + e.getMessage());
        }
        return false;
    }

    // Extract Username from Token
    public String getUsernameFromToken(String token) {
        return Jwts.parserBuilder().setSigningKey(key).build().parseClaimsJws(token).getBody().getSubject();
    }

    // Extract Role from Token (optional, for debugging)
    public String getRoleFromToken(String token) {
        Claims claims = Jwts.parserBuilder().setSigningKey(key).build().parseClaimsJws(token).getBody();
        return (String) claims.get("role");
    }
}