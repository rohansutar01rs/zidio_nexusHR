package com.nexushr.auth.service;

import com.nexushr.auth.dto.LoginRequest;
import com.nexushr.auth.dto.SignupRequest;
import com.nexushr.auth.dto.TokenResponse;
import com.nexushr.auth.dto.UserResponse;
import com.nexushr.auth.model.Role;
import com.nexushr.auth.model.User;
import com.nexushr.auth.repository.RoleRepository;
import com.nexushr.auth.repository.UserRepository;
import com.nexushr.auth.security.JwtTokenProvider;
import com.nexushr.common.enums.RoleType;
import com.nexushr.common.exception.ResourceNotFoundException;
import com.nexushr.common.exception.UnauthorizedException;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

@Service
public class AuthService {

    @Autowired
    private AuthenticationManager authenticationManager;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtTokenProvider tokenProvider;

    // In-memory token store (replaces Redis for standalone mode)
    private final Map<String, String> refreshTokenStore = new ConcurrentHashMap<>();

    @PostConstruct
    public void initRoles() {
        for (RoleType roleType : RoleType.values()) {
            if (roleRepository.findByName(roleType).isEmpty()) {
                roleRepository.save(Role.builder().name(roleType).build());
            }
        }
        
        // Also seed a default admin user if no users exist
        if (userRepository.count() == 0) {
            Role adminRole = roleRepository.findByName(RoleType.ROLE_ADMIN)
                    .orElseThrow(() -> new RuntimeException("Role Admin not found"));
            Role managerRole = roleRepository.findByName(RoleType.ROLE_MANAGER)
                    .orElseThrow(() -> new RuntimeException("Role Manager not found"));
            Role employeeRole = roleRepository.findByName(RoleType.ROLE_EMPLOYEE)
                    .orElseThrow(() -> new RuntimeException("Role Employee not found"));

            Set<Role> roles = new HashSet<>();
            roles.add(adminRole);
            roles.add(managerRole);
            roles.add(employeeRole);

            User admin = User.builder()
                    .username("admin")
                    .email("admin@nexushr.com")
                    .password(passwordEncoder.encode("admin123"))
                    .active(true)
                    .roles(roles)
                    .build();
            userRepository.save(admin);
        }
    }

    public TokenResponse login(LoginRequest loginRequest) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(loginRequest.getUsername(), loginRequest.getPassword())
        );

        SecurityContextHolder.getContext().setAuthentication(authentication);

        String accessToken = tokenProvider.generateAccessToken(authentication);
        String refreshToken = tokenProvider.generateRefreshToken(authentication);

        UserDetails userDetails = (UserDetails) authentication.getPrincipal();
        User user = userRepository.findByUsername(userDetails.getUsername())
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userDetails.getUsername()));

        // Store refresh token in memory
        refreshTokenStore.put("refresh:" + user.getUsername(), refreshToken);

        List<String> roles = userDetails.getAuthorities().stream()
                .map(item -> item.getAuthority())
                .collect(Collectors.toList());

        return TokenResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .username(user.getUsername())
                .email(user.getEmail())
                .roles(roles)
                .build();
    }

    public UserResponse signup(SignupRequest signupRequest) {
        if (userRepository.existsByUsername(signupRequest.getUsername())) {
            throw new IllegalArgumentException("Username already exists");
        }
        if (userRepository.existsByEmail(signupRequest.getEmail())) {
            throw new IllegalArgumentException("Email already exists");
        }

        Set<Role> roles = new HashSet<>();
        if (signupRequest.getRoles() == null || signupRequest.getRoles().isEmpty()) {
            Role userRole = roleRepository.findByName(RoleType.ROLE_EMPLOYEE)
                    .orElseThrow(() -> new ResourceNotFoundException("Role Employee not found"));
            roles.add(userRole);
        } else {
            for (RoleType roleType : signupRequest.getRoles()) {
                Role role = roleRepository.findByName(roleType)
                        .orElseThrow(() -> new ResourceNotFoundException("Role " + roleType + " not found"));
                roles.add(role);
            }
        }

        User user = User.builder()
                .username(signupRequest.getUsername())
                .email(signupRequest.getEmail())
                .password(passwordEncoder.encode(signupRequest.getPassword()))
                .roles(roles)
                .active(true)
                .build();

        User savedUser = userRepository.save(user);

        return UserResponse.builder()
                .id(savedUser.getId())
                .username(savedUser.getUsername())
                .email(savedUser.getEmail())
                .active(savedUser.isActive())
                .roles(savedUser.getRoles().stream()
                        .map(role -> role.getName().name())
                        .collect(Collectors.toList()))
                .build();
    }

    public TokenResponse refresh(String refreshToken) {
        if (!tokenProvider.validateToken(refreshToken)) {
            throw new UnauthorizedException("Invalid refresh token");
        }

        String username = tokenProvider.getUsernameFromJwt(refreshToken);
        String cachedToken = refreshTokenStore.get("refresh:" + username);

        if (cachedToken == null || !cachedToken.equals(refreshToken)) {
            throw new UnauthorizedException("Refresh token expired or blacklisted");
        }

        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + username));

        // Generate new access token
        UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
                new org.springframework.security.core.userdetails.User(
                        user.getUsername(),
                        user.getPassword(),
                        user.isActive(),
                        true,
                        true,
                        true,
                        user.getRoles().stream()
                                .map(role -> new org.springframework.security.core.authority.SimpleGrantedAuthority(role.getName().name()))
                                .collect(Collectors.toList())
                ),
                null,
                user.getRoles().stream()
                        .map(role -> new org.springframework.security.core.authority.SimpleGrantedAuthority(role.getName().name()))
                        .collect(Collectors.toList())
        );

        String newAccessToken = tokenProvider.generateAccessToken(authentication);
        String newRefreshToken = tokenProvider.generateRefreshToken(authentication);

        // Update in memory store
        refreshTokenStore.put("refresh:" + username, newRefreshToken);

        return TokenResponse.builder()
                .accessToken(newAccessToken)
                .refreshToken(newRefreshToken)
                .username(user.getUsername())
                .email(user.getEmail())
                .roles(user.getRoles().stream()
                        .map(role -> role.getName().name())
                        .collect(Collectors.toList()))
                .build();
    }

    public void logout(String username) {
        refreshTokenStore.remove("refresh:" + username);
    }

    public UserResponse getCurrentUser(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + username));

        return UserResponse.builder()
                .id(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .active(user.isActive())
                .roles(user.getRoles().stream()
                        .map(role -> role.getName().name())
                        .collect(Collectors.toList()))
                .build();
    }
}
