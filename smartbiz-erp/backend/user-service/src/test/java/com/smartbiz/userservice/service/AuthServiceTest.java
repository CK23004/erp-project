package com.smartbiz.userservice.service;

import com.smartbiz.userservice.config.JwtUtil;
import com.smartbiz.userservice.dto.LoginRequest;
import com.smartbiz.userservice.dto.LoginResponse;
import com.smartbiz.userservice.exception.ResourceNotFoundException;
import com.smartbiz.userservice.model.User;
import com.smartbiz.userservice.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock UserRepository userRepository;
    @Mock PasswordEncoder passwordEncoder;
    @Mock JwtUtil jwtUtil;
    @InjectMocks AuthService authService;

    @Test
    void login_success() {
        User user = new User();
        user.setEmail("admin@example.com");
        user.setPassword("hashed");
        user.setName("Admin");
        user.setRole("ADMIN");

        LoginRequest req = new LoginRequest();
        req.setEmail("admin@example.com");
        req.setPassword("password");

        when(userRepository.findByEmail("admin@example.com")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("password", "hashed")).thenReturn(true);
        when(jwtUtil.generateToken("admin@example.com", "ADMIN")).thenReturn("jwt-token");

        LoginResponse response = authService.login(req);

        assertThat(response.getToken()).isEqualTo("jwt-token");
        assertThat(response.getRole()).isEqualTo("ADMIN");
    }

    @Test
    void login_wrongPassword_throwsException() {
        User user = new User();
        user.setEmail("admin@example.com");
        user.setPassword("hashed");

        LoginRequest req = new LoginRequest();
        req.setEmail("admin@example.com");
        req.setPassword("wrongpass");

        when(userRepository.findByEmail("admin@example.com")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("wrongpass", "hashed")).thenReturn(false);

        assertThatThrownBy(() -> authService.login(req))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("Invalid email or password");
    }

    @Test
    void login_userNotFound_throwsException() {
        LoginRequest req = new LoginRequest();
        req.setEmail("nobody@example.com");
        req.setPassword("pass");

        when(userRepository.findByEmail("nobody@example.com")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> authService.login(req))
                .isInstanceOf(ResourceNotFoundException.class);
    }
}
