package com.smartbiz.userservice.dto;

import com.smartbiz.userservice.model.User;
import java.time.LocalDateTime;

public class UserResponse {

    private String id;
    private String name;
    private String email;
    private String role;
    private boolean active;
    private LocalDateTime createdAt;

    public static UserResponse from(User user) {
        UserResponse r = new UserResponse();
        r.id = user.getId();
        r.name = user.getName();
        r.email = user.getEmail();
        r.role = user.getRole();
        r.active = user.isActive();
        r.createdAt = user.getCreatedAt();
        return r;
    }

    public String getId() { return id; }
    public String getName() { return name; }
    public String getEmail() { return email; }
    public String getRole() { return role; }
    public boolean isActive() { return active; }
    public LocalDateTime getCreatedAt() { return createdAt; }
}
