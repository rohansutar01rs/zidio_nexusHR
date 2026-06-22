package com.nexushr.auth.controller;

import com.nexushr.auth.dto.LoginRequest;
import com.nexushr.auth.dto.SignupRequest;
import com.nexushr.auth.dto.TokenResponse;
import com.nexushr.auth.dto.UserResponse;
import com.nexushr.auth.service.AuthService;
import com.nexushr.common.dto.ApiResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController
@RequestMapping
public class AuthController {

    @Autowired
    private AuthService authService;

    @PostMapping("/signup")
    public ResponseEntity<ApiResponse<UserResponse>> signup(@RequestBody SignupRequest signupRequest) {
        try {
            UserResponse userResponse = authService.signup(signupRequest);
            return ResponseEntity.ok(ApiResponse.<UserResponse>builder()
                    .success(true)
                    .message("User registered successfully")
                    .data(userResponse)
                    .build());
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(ApiResponse.<UserResponse>builder()
                    .success(false)
                    .message(e.getMessage())
                    .build());
        }
    }

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<TokenResponse>> login(@RequestBody LoginRequest loginRequest) {
        try {
            TokenResponse tokenResponse = authService.login(loginRequest);
            return ResponseEntity.ok(ApiResponse.<TokenResponse>builder()
                    .success(true)
                    .message("Login successful")
                    .data(tokenResponse)
                    .build());
        } catch (Exception e) {
            return ResponseEntity.status(401).body(ApiResponse.<TokenResponse>builder()
                    .success(false)
                    .message("Invalid username or password: " + e.getMessage())
                    .build());
        }
    }

    @PostMapping("/refresh")
    public ResponseEntity<ApiResponse<TokenResponse>> refresh(@RequestBody Map<String, String> request) {
        String refreshToken = request.get("refreshToken");
        if (refreshToken == null) {
            return ResponseEntity.badRequest().body(ApiResponse.<TokenResponse>builder()
                    .success(false)
                    .message("Refresh token is required")
                    .build());
        }
        try {
            TokenResponse tokenResponse = authService.refresh(refreshToken);
            return ResponseEntity.ok(ApiResponse.<TokenResponse>builder()
                    .success(true)
                    .message("Token refreshed successfully")
                    .data(tokenResponse)
                    .build());
        } catch (Exception e) {
            return ResponseEntity.status(401).body(ApiResponse.<TokenResponse>builder()
                    .success(false)
                    .message(e.getMessage())
                    .build());
        }
    }

    @PostMapping("/logout")
    public ResponseEntity<ApiResponse<Void>> logout() {
        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        if (principal instanceof UserDetails) {
            String username = ((UserDetails) principal).getUsername();
            authService.logout(username);
        }
        return ResponseEntity.ok(ApiResponse.<Void>builder()
                .success(true)
                .message("Logged out successfully")
                .build());
    }

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<UserResponse>> me() {
        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        if (principal instanceof UserDetails) {
            String username = ((UserDetails) principal).getUsername();
            UserResponse userResponse = authService.getCurrentUser(username);
            return ResponseEntity.ok(ApiResponse.<UserResponse>builder()
                    .success(true)
                    .message("User details retrieved successfully")
                    .data(userResponse)
                    .build());
        }
        return ResponseEntity.status(401).body(ApiResponse.<UserResponse>builder()
                .success(false)
                .message("Unauthorized")
                .build());
    }
}
