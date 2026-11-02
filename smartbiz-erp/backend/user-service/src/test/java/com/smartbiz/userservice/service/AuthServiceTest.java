package com.smartbiz.userservice.service;

import com.smartbiz.userservice.config.JwtUtil;
import com.smartbiz.userservice.dto.LoginRequest;
import com.smartbiz.userservice.dto.LoginResponse;
import com.smartbiz.userservice.exception.ResourceNotFoundException;
import com.smartbiz.userservice.model.User;
import com.smartbiz.userservice.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock UserRepository userRepository;
    @Mock PasswordEncoder passwordEncoder;

    // Use a real JwtUtil instead of mocking it.
    // Byte Buddy (used by Mockito inline mocking) does not support Java 25 — 
    // mocking concrete classes fails. JwtUtil has no external dependencies so
    // using a real instance with a test secret is the correct approach.
    private JwtUtil jwtUtil;

    private AuthService authService;

    // Valid 256-bit base64 key — same value as src/test/resources/application.properties
    private static final String TEST_JWT_SECRET =
            "dGVzdC1qd3Qtc2VjcmV0LWtleS1mb3Itc21hcnRiaXotdW5pdC10ZXN0czEyMw==";

    @BeforeEach
    void setUp() {
        jwtUtil = new JwtUtil();
        // Inject the test secret and expiry via Spring's ReflectionTestUtils
        // (mirrors what @Value injects at runtime)
        ReflectionTestUtils.setField(jwtUtil, "secret", TEST_JWT_SECRET);
        ReflectionTestUtils.setField(jwtUtil, "expirationMs", 86400000L);

        authService = new AuthService(userRepository, passwordEncoder, jwtUtil);
    }

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

        LoginResponse response = authService.login(req);

        // Token is a real JWT — just verify it's non-null and non-empty
        assertThat(response.getToken()).isNotBlank();
        assertThat(response.getRole()).isEqualTo("ADMIN");
        assertThat(response.getEmail()).isEqualTo("admin@example.com");
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
