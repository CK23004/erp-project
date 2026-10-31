package com.smartbiz.userservice.config;

import com.smartbiz.userservice.model.Department;
import com.smartbiz.userservice.model.User;
import com.smartbiz.userservice.repository.DepartmentRepository;
import com.smartbiz.userservice.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

/**
 * Runs once on startup and creates default admin user + departments
 * if they don't already exist.
 *
 * This ensures:
 *  - The app is immediately usable after docker compose up
 *  - Passwords are always hashed with the real BCryptPasswordEncoder
 *  - Re-running never creates duplicates (checks existsByEmail first)
 *
 * Default credentials: admin@smartbiz.com / admin123
 * CHANGE the password after first login in production.
 */
@Component
public class DataSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final DepartmentRepository departmentRepository;
    private final PasswordEncoder passwordEncoder;

    public DataSeeder(UserRepository userRepository,
                      DepartmentRepository departmentRepository,
                      PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.departmentRepository = departmentRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) {

        // ── Seed admin user ───────────────────────────────────────────────
        if (!userRepository.existsByEmail("admin@smartbiz.com")) {
            User admin = new User();
            admin.setName("Admin User");
            admin.setEmail("admin@smartbiz.com");
            // Password encoded by Spring's real BCryptPasswordEncoder at startup
            admin.setPassword(passwordEncoder.encode("admin123"));
            admin.setRole("ADMIN");
            admin.setActive(true);
            userRepository.save(admin);
            System.out.println("[DataSeeder] Created admin user: admin@smartbiz.com");
        }

        // ── Seed manager user ─────────────────────────────────────────────
        if (!userRepository.existsByEmail("manager@smartbiz.com")) {
            User manager = new User();
            manager.setName("John Manager");
            manager.setEmail("manager@smartbiz.com");
            manager.setPassword(passwordEncoder.encode("admin123"));
            manager.setRole("MANAGER");
            manager.setActive(true);
            userRepository.save(manager);
            System.out.println("[DataSeeder] Created manager user: manager@smartbiz.com");
        }

        // ── Seed default departments ──────────────────────────────────────
        if (departmentRepository.count() == 0) {
            departmentRepository.save(makeDept("Engineering",  "Software Engineering Team"));
            departmentRepository.save(makeDept("Sales",        "Sales & Business Development"));
            departmentRepository.save(makeDept("HR",           "Human Resources"));
            departmentRepository.save(makeDept("Operations",   "Operations & Logistics"));
            System.out.println("[DataSeeder] Created default departments");
        }
    }

    private Department makeDept(String name, String description) {
        Department dept = new Department();
        dept.setName(name);
        dept.setDescription(description);
        return dept;
    }
}
