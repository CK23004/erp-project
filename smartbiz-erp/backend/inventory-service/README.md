# Inventory Service

Handles products, categories, suppliers, purchases, and stock management.

- **Port:** 8082
- **Database:** `smartbiz_inventory` (MongoDB)

## Modules

| Module    | Collections | Endpoints |
|-----------|------------|-----------|
| Products  | products   | CRUD /api/products, POST /api/products/deduct-stock |
| Categories| categories | POST, GET /api/categories |
| Suppliers | suppliers  | POST, GET /api/suppliers, GET /api/suppliers/{id} |
| Purchases | purchases  | POST, GET /api/purchases (auto-adds stock) |
| Stock     | products   | GET /api/stock, GET /api/stock/low-stock |

## Internal Endpoints (called by Sales Service)

- `GET /api/products/{id}/availability?quantity={n}` — returns true/false
- `POST /api/products/deduct-stock` — body: `{ productId, quantity }`

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
