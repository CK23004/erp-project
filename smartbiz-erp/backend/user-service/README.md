# User Service

Handles authentication, user management, employee management, and department management.

- **Port:** 8081
- **Database:** `smartbiz_users` (MongoDB)

## Modules

| Module      | Collections  | Endpoints |
|-------------|-------------|-----------|
| Auth        | users       | POST /api/auth/login |
| Users       | users       | CRUD /api/users |
| Employees   | employees   | CRUD /api/employees |
| Departments | departments | POST, GET /api/departments |

## Run

```bash
mvn spring-boot:run
```

## Test

```bash
mvn test
```

## SonarQube

```bash
export SONAR_TOKEN=<token>
mvn clean verify sonar:sonar -Dsonar.host.url=http://localhost:9000 -Dsonar.token=$SONAR_TOKEN
```

## Environment Variables

| Variable    | Default                        | Description |
|-------------|-------------------------------|-------------|
| JWT_SECRET  | (base64 default, change in prod) | 256-bit HMAC key shared across all services |
| server.port | 8081                           | Service port |
