package com.smartbiz.userservice;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.security.servlet.UserDetailsServiceAutoConfiguration;

// Exclude the default UserDetailsServiceAutoConfiguration so Spring Boot
// does not generate a random in-memory user and override our JWT security.
@SpringBootApplication(exclude = { UserDetailsServiceAutoConfiguration.class })
public class UserServiceApplication {
    public static void main(String[] args) {
        SpringApplication.run(UserServiceApplication.class, args);
    }
}
