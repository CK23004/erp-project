# ── Stage 1: Build ────────────────────────────────────────────────────────
# Use the official Maven image with Java 21 to compile and package the app.
# We use a multi-stage build so the final image does NOT contain Maven or
# any build-time dependencies — keeps the image lean.
FROM maven:3.9.6-eclipse-temurin-21 AS builder

WORKDIR /app

# Copy pom.xml first and download dependencies separately.
# This layer is cached by Docker — dependencies are only re-downloaded
# when pom.xml changes, not on every source code change.
COPY pom.xml .
RUN mvn dependency:go-offline -B

# Copy source and build the fat JAR
COPY src ./src
RUN mvn clean package -DskipTests -B

# ── Stage 2: Runtime ──────────────────────────────────────────────────────
# Use a minimal JRE-only image — no compiler, no Maven, smaller attack surface.
FROM eclipse-temurin:21-jre-alpine

WORKDIR /app

# Create a non-root user to run the application.
# Running as root inside a container is a security risk.
RUN addgroup -S smartbiz && adduser -S smartbiz -G smartbiz

# Copy only the packaged JAR from the build stage
COPY --from=builder /app/target/*.jar app.jar

# Switch to non-root user
USER smartbiz

# Expose the port this service listens on
EXPOSE 8081

# JVM flags:
#   -XX:+UseContainerSupport  → respects Docker CPU/memory limits
#   -XX:MaxRAMPercentage=75.0 → use max 75% of container memory for heap
ENTRYPOINT ["java", "-XX:+UseContainerSupport", "-XX:MaxRAMPercentage=75.0", "-jar", "app.jar"]
