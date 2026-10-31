# Sales Service

Handles customers, orders, invoices, and payments. Calls Inventory Service to check and deduct stock.

- **Port:** 8083
- **Database:** `smartbiz_sales` (MongoDB)

## Modules

| Module    | Collections | Endpoints |
|-----------|------------|-----------|
| Customers | customers  | CRUD /api/customers |
| Orders    | orders     | POST /api/orders, GET /api/orders, GET /api/orders/{id}, PUT /api/orders/{id}/status |
| Invoices  | invoices   | POST /api/invoices, GET /api/invoices, GET /api/invoices/{id} |
| Payments  | payments   | POST /api/payments, GET /api/payments |

## Order Workflow

1. POST /api/orders with `customerId` and `items[]`
2. Sales Service checks stock for each item via Inventory Service
3. Order saved as CONFIRMED
4. Stock deducted via Inventory Service
5. POST /api/invoices with `{ orderId }` to generate invoice
6. POST /api/payments to record payment — marks invoice as PAID

## Configuration

```properties
inventory.service.url=http://localhost:8082   # URL of inventory service
```

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
