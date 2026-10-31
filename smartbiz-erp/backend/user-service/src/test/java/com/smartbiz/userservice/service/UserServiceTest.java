package com.smartbiz.userservice.service;

import com.smartbiz.userservice.dto.UserRequest;
import com.smartbiz.userservice.dto.UserResponse;
import com.smartbiz.userservice.exception.DuplicateResourceException;
import com.smartbiz.userservice.exception.ResourceNotFoundException;
import com.smartbiz.userservice.model.User;
import com.smartbiz.userservice.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @InjectMocks
    private UserService userService;

    private User sampleUser;

    @BeforeEach
    void setUp() {
        sampleUser = new User();
        sampleUser.setId("u1");
        sampleUser.setName("John Doe");
        sampleUser.setEmail("john@example.com");
        sampleUser.setPassword("hashed");
        sampleUser.setRole("USER");
    }

    @Test
    void createUser_success() {
        UserRequest req = new UserRequest();
        req.setName("John Doe");
        req.setEmail("john@example.com");
        req.setPassword("secret");

        when(userRepository.existsByEmail(req.getEmail())).thenReturn(false);
        when(passwordEncoder.encode(any())).thenReturn("hashed");
        when(userRepository.save(any())).thenReturn(sampleUser);

        UserResponse response = userService.createUser(req);

        assertThat(response.getEmail()).isEqualTo("john@example.com");
        verify(userRepository).save(any(User.class));
    }

    @Test
    void createUser_duplicateEmail_throwsException() {
        UserRequest req = new UserRequest();
        req.setEmail("john@example.com");
        req.setPassword("secret");

        when(userRepository.existsByEmail(req.getEmail())).thenReturn(true);

        assertThatThrownBy(() -> userService.createUser(req))
                .isInstanceOf(DuplicateResourceException.class)
                .hasMessageContaining("Email already in use");
    }

    @Test
    void getAllUsers_returnsList() {
        when(userRepository.findAll()).thenReturn(List.of(sampleUser));
        List<UserResponse> users = userService.getAllUsers();
        assertThat(users).hasSize(1);
    }

    @Test
    void getUserById_notFound_throwsException() {
        when(userRepository.findById("bad-id")).thenReturn(Optional.empty());
        assertThatThrownBy(() -> userService.getUserById("bad-id"))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void deleteUser_notFound_throwsException() {
        when(userRepository.existsById("bad-id")).thenReturn(false);
        assertThatThrownBy(() -> userService.deleteUser("bad-id"))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void deleteUser_success() {
        when(userRepository.existsById("u1")).thenReturn(true);
        userService.deleteUser("u1");
        verify(userRepository).deleteById("u1");
    }
}
