# SmartBiz ERP

A full-stack Business Management System built with **React + Vite** (frontend) and three independent **Java 21 Spring Boot** microservices (backend), each with its own MongoDB database.

> 📖 **Complete deployment guide:** See [DEPLOYMENT.md](./DEPLOYMENT.md) for step-by-step instructions to deploy to AWS EKS + S3.

---

## Architecture

![SmartBiz ERP System Architecture](./SmartBiz%20ERP%20AWS%20Architecture%20Diagram.png)

---

## Microservices Architecture

![Microservices Architecture](./SmartBiz%20ERP%20Microservices%20Architecture.png)

---

## Multi-Environment Infrastructure

![Multi-Environment Infrastructure](./SmartBiz%20ERP%20Multi-Environment%20Architecture.png)

---

## Technology Stack

| Layer      | Technology                                      |
|------------|-------------------------------------------------|
| Frontend   | React 18, Vite, JavaScript, MUI v5, Recharts   |
| Backend    | Java 21, Spring Boot 3.2, Maven                |
| Database   | MongoDB (3 separate databases)                  |
| Auth       | Spring Security + JWT (jjwt 0.12)              |
| Testing    | JUnit 5, Mockito, JaCoCo                        |
| Quality    | SonarQube + Sonar Maven Scanner                 |

---

## Folder Structure

```
smartbiz-erp/
├── frontend/                  React + Vite application
│   ├── src/
│   │   ├── api/               Axios API clients (userApi, inventoryApi, salesApi)
│   │   ├── components/        Reusable UI (Layout, DataTable, ConfirmDialog, Notify)
│   │   ├── context/           AuthContext (JWT storage)
│   │   └── pages/             One page per module
│   └── .env                   Backend base URLs
├── backend/
│   ├── user-service/          Spring Boot :8081
│   ├── inventory-service/     Spring Boot :8082
│   └── sales-service/         Spring Boot :8083
└── README.md
```

---

## Prerequisites

- Java 21
- Maven 3.9+
- Node.js 20+ and npm
- MongoDB running on `localhost:27017`
- (Optional) SonarQube on `localhost:9000`

---

## Running MongoDB

MongoDB creates databases automatically on first write. No manual setup needed.

```bash
# Start MongoDB (if installed locally)
mongod --dbpath /data/db

# Or with Docker
docker run -d -p 27017:27017 --name mongo mongo:7
```

---

## Running the Backend Services

Each service is independent. Open three terminals.

```bash
# Terminal 1 — User Service (port 8081)
cd backend/user-service
mvn spring-boot:run

# Terminal 2 — Inventory Service (port 8082)
cd backend/inventory-service
mvn spring-boot:run

# Terminal 3 — Sales Service (port 8083)
cd backend/sales-service
mvn spring-boot:run
```

**JWT Secret** — override the default secret in production:
```bash
export JWT_SECRET=<your-256-bit-base64-encoded-key>
```
All three services must use the same secret so tokens issued by user-service are accepted by inventory-service and sales-service.

---

## Running the Frontend

```bash
cd frontend
npm install
npm run dev
# Opens at http://localhost:5173
```

**First login** — create an admin user by calling the user-service directly:

```bash
curl -X POST http://localhost:8081/api/users \
  -H "Content-Type: application/json" \
  -d '{"name":"Admin","email":"admin@smartbiz.com","password":"admin123","role":"ADMIN"}'
```
Then log in at `http://localhost:5173/login`.

---

## Running Tests

```bash
# Run tests for all three services
cd backend/user-service      && mvn test
cd backend/inventory-service && mvn test
cd backend/sales-service     && mvn test
```

---

## SonarQube Analysis

Start SonarQube (`http://localhost:9000`), create a token, then:

```bash
# Set token as environment variable — never hardcode it
export SONAR_TOKEN=<your-token>

# Analyse each service
cd backend/user-service
mvn clean verify sonar:sonar \
  -Dsonar.host.url=http://localhost:9000 \
  -Dsonar.token=$SONAR_TOKEN

cd backend/inventory-service
mvn clean verify sonar:sonar \
  -Dsonar.host.url=http://localhost:9000 \
  -Dsonar.token=$SONAR_TOKEN

cd backend/sales-service
mvn clean verify sonar:sonar \
  -Dsonar.host.url=http://localhost:9000 \
  -Dsonar.token=$SONAR_TOKEN
```

Project keys: `smartbiz-user-service`, `smartbiz-inventory-service`, `smartbiz-sales-service`

---

## API Overview

| Service   | Base URL               | Key Endpoints |
|-----------|------------------------|---------------|
| User      | `localhost:8081`       | POST /api/auth/login, CRUD /api/users, /api/employees, /api/departments |
| Inventory | `localhost:8082`       | CRUD /api/products, /api/categories, /api/suppliers, POST /api/purchases, GET /api/stock/low-stock |
| Sales     | `localhost:8083`       | CRUD /api/customers, /api/orders, POST /api/invoices, /api/payments |

---

## Service-to-Service Communication

When a sales order is placed:
1. **Sales Service** checks stock via `GET /api/products/{id}/availability` on Inventory Service
2. If stock is available, the order is saved as `CONFIRMED`
3. **Sales Service** deducts stock via `POST /api/products/deduct-stock` on Inventory Service
4. The JWT token from the original request is forwarded automatically

---

## Docker — Quick Spin Up

The fastest way to run the entire stack is with Docker Compose.  
It starts MongoDB, all three backend services, and the frontend in the correct order.

### Prerequisites

- Docker 24+
- Docker Compose v2 (`docker compose` — not the old `docker-compose`)

### 1. Configure environment variables

```bash
# The .env file is already pre-filled with safe defaults for local dev.
# Edit it if you want to change the JWT secret or backend URLs.
cat .env
```

### 2. Build and start everything

```bash
cd smartbiz-erp
docker compose up --build
```

First run takes ~3–5 minutes to download base images and compile the Maven projects.  
Subsequent starts are fast because Docker caches the Maven dependency layer.

### 3. Create the first admin user

Wait until all services are healthy (you'll see `started` in the logs), then:

```bash
curl -X POST http://localhost:8081/api/users \
  -H "Content-Type: application/json" \
  -d '{"name":"Admin","email":"admin@smartbiz.com","password":"admin123","role":"ADMIN"}'
```

### 4. Open the app

```
http://localhost
```

Login with `admin@smartbiz.com` / `admin123`.

---

### Service URLs (after compose up)

| Service           | URL                          |
|-------------------|------------------------------|
| Frontend (Nginx)  | http://localhost             |
| User Service      | http://localhost:8081        |
| Inventory Service | http://localhost:8082        |
| Sales Service     | http://localhost:8083        |
| MongoDB           | mongodb://localhost:27017    |

---

### Useful Docker commands

```bash
# Start in background (detached)
docker compose up --build -d

# View logs for a specific service
docker compose logs -f user-service
docker compose logs -f inventory-service
docker compose logs -f sales-service
docker compose logs -f frontend

# Check health status of all containers
docker compose ps

# Stop all containers (keeps data volume)
docker compose down

# Stop and delete all data (wipes MongoDB)
docker compose down -v

# Rebuild only one service after a code change
docker compose up --build user-service
```

---

### Docker architecture

```
┌─────────────────────────────────────────────────────────────┐
│                   smartbiz-network (bridge)                  │
│                                                               │
│  ┌──────────┐   ┌──────────────┐   ┌──────────────────────┐ │
│  │  mongo   │   │ user-service │   │  inventory-service   │ │
│  │  :27017  │◄──│    :8081     │   │       :8082          │ │
│  │          │   └──────────────┘   └──────────────────────┘ │
│  │          │   ┌──────────────┐         ▲                  │
│  │          │◄──│sales-service │─────────┘  REST calls      │
│  │          │   │    :8083     │                             │
│  └──────────┘   └──────────────┘                            │
│                                                               │
│  ┌────────────────────────────────────────────────────────┐  │
│  │           frontend (Nginx)  :80                        │  │
│  │  Serves Vite static build — browser calls backends     │  │
│  │  directly via localhost ports (not via Docker network) │  │
│  └────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

> **Note on frontend URLs:** Vite bakes the backend API URLs into the JS bundle at build time.
> The default values (`http://localhost:8081` etc.) work when the browser and Docker are on the same machine.
> For deployment to a remote server, set `VITE_USER_API`, `VITE_INVENTORY_API`, `VITE_SALES_API` in `.env`
> to your server's IP/domain before running `docker compose up --build`.

---

### Production JWT secret

The default JWT secret in `.env` is for local development only.  
Generate a strong secret before any real deployment:

```bash
# Generate a secure 256-bit Base64 key
openssl rand -base64 32

# Set it in .env
JWT_SECRET=<paste output here>
```

---

## MongoDB Atlas (Cloud Database)

By default the app uses a local MongoDB instance. Switching to Atlas requires only one change per service — no code changes needed.

### Why Atlas

- No MongoDB to manage or back up
- Built-in replication and automatic failover
- Free M0 tier works for dev/stage
- Use M10+ for production workloads

### How to switch

**Step 1 — Create a cluster on Atlas**

1. Go to [cloud.mongodb.com](https://cloud.mongodb.com)
2. Create three databases: `smartbiz_users`, `smartbiz_inventory`, `smartbiz_sales`
3. Create a database user with read/write access
4. Add your IP (or `0.0.0.0/0` for EKS) to the Network Access allowlist
5. Copy the connection string from Atlas → Connect → Drivers

Connection string format:
```
mongodb+srv://<username>:<password>@<cluster>.mongodb.net/<database>?retryWrites=true&w=majority
```

**Step 2 — Set environment variables**

For local dev (`.env` file):
```bash
# user-service
SPRING_DATA_MONGODB_URI=mongodb+srv://myuser:mypass@cluster0.abc123.mongodb.net/smartbiz_users?retryWrites=true&w=majority

# inventory-service
SPRING_DATA_MONGODB_URI=mongodb+srv://myuser:mypass@cluster0.abc123.mongodb.net/smartbiz_inventory?retryWrites=true&w=majority

# sales-service
SPRING_DATA_MONGODB_URI=mongodb+srv://myuser:mypass@cluster0.abc123.mongodb.net/smartbiz_sales?retryWrites=true&w=majority
```

For Docker Compose (`.env` at project root):
```bash
# Each service reads SPRING_DATA_MONGODB_URI from the environment.
# Atlas URIs override the default localhost URIs in application.properties.
SPRING_DATA_MONGODB_URI_USERS=mongodb+srv://...
```
Update `docker-compose.yml` to pass per-service Atlas URIs if all three databases live in the same cluster.

For Kubernetes (Jenkins injects from credentials):
```bash
kubectl create secret generic smartbiz-secrets -n smartbiz \
  --from-literal=MONGO_URI_USERS="mongodb+srv://..." \
  --from-literal=MONGO_URI_INVENTORY="mongodb+srv://..." \
  --from-literal=MONGO_URI_SALES="mongodb+srv://..."
```
The Kubernetes secret is created/updated automatically by `Jenkinsfile.backend` Stage 7.

---

## CI/CD Deployment Pipelines

Two separate Jenkinsfiles handle application deployment — one for backend (EKS), one for frontend (S3).  
The infra pipelines in `infra/` must be run first to provision the EKS clusters and S3 buckets.

```
infra/backend/eks/Jenkinsfile        ← provisions EKS clusters
infra/frontend/Jenkinsfile           ← provisions S3 + CloudFront
smartbiz-erp/Jenkinsfile.backend     ← deploys app to EKS  ← this section
smartbiz-erp/Jenkinsfile.frontend    ← deploys app to S3   ← this section
```

### Prerequisites

**One-time bootstrap (run once per AWS account):**
```bash
# 1. Create ECR repositories
./scripts/bootstrap-ecr.sh us-east-1

# 2. Provision infra (EKS + S3) via the infra pipelines
#    Run infra/backend/eks/Jenkinsfile   → creates eks-dev / eks-stage / eks-prod
#    Run infra/frontend/Jenkinsfile      → creates S3 buckets + CloudFront
```

**Jenkins credentials to create (Manage Jenkins → Credentials):**

| Credential ID             | Kind           | Value |
|---------------------------|----------------|-------|
| `aws-terraform-credentials` | AWS Credentials | AWS access key + secret |
| `sonar-token`             | Secret text    | SonarQube user token |
| `jwt-secret`              | Secret text    | Base64 256-bit JWT key |
| `mongo-uri-users`         | Secret text    | Atlas or local MongoDB URI for users |
| `mongo-uri-inventory`     | Secret text    | Atlas or local MongoDB URI for inventory |
| `mongo-uri-sales`         | Secret text    | Atlas or local MongoDB URI for sales |

Generate a JWT secret:
```bash
openssl rand -base64 32
```

### Backend Pipeline (`Jenkinsfile.backend`)

![Backend CI/CD Pipeline](./SmartBiz%20ERP%20Backend%20CI_CD%20Pipeline.png)

**Parameters:**

| Parameter | Values | Description |
|---|---|---|
| `ENVIRONMENT` | dev / stage / prod | Target EKS cluster |
| `SKIP_SONAR` | true / false | Skip SonarQube (emergencies only) |
| `SKIP_TESTS` | true / false | Skip unit tests (not recommended) |

**Stages:**

```
Pull → Test (parallel) → SonarQube (parallel, quality gate) → Build JARs
     → Docker Build+Push ECR (parallel) → Approval (prod only)
     → Deploy to EKS → Verify Rollout
```

**SonarQube quality gate** — the pipeline fails if any service does not pass.  
Project keys: `smartbiz-user-service`, `smartbiz-inventory-service`, `smartbiz-sales-service`

Configure SonarQube URL in `Jenkinsfile.backend`:
```groovy
SONAR_HOST = "http://your-sonarqube-host:9000"
```

**How to run:**
1. Create a Jenkins Pipeline job pointing to `Jenkinsfile.backend` in the repo
2. Click "Build with Parameters"
3. Select environment → `dev` for first run
4. Watch stages — SonarQube results appear at `http://sonarqube:9000/projects`

### Frontend Pipeline (`Jenkinsfile.frontend`)

![Frontend CI/CD Pipeline](./SmartBiz%20ERP%20Frontend%20CI_CD%20Pipeline.png)

**Parameters:**

| Parameter | Values | Description |
|---|---|---|
| `ENVIRONMENT` | dev / stage / prod | Target S3 bucket (`erp-frontend-<env>`) |
| `API_BASE_URL` | ALB DNS hostname | Single backend URL (get from `kubectl get ingress -n smartbiz`) |
| `INVALIDATE_CDN` | true / false | Invalidate CloudFront cache after sync |

**Stages:**

```
Pull → Install → Lint → Vite Build (with injected API URLs)
     → Approval (prod only) → S3 Sync → CloudFront Invalidation
```

**After backend deploy, get the ALB URL:**
```bash
aws eks update-kubeconfig --name eks-dev --region us-east-1
kubectl get ingress -n smartbiz
# Copy the ADDRESS column — use as API_BASE_URL
```

**Cache strategy:**
- HTML files → `no-cache` (always fresh)
- JS/CSS/images → `max-age=31536000, immutable` (1 year, Vite hashes filenames)

### Full Deployment Order

```
1. Run infra/backend/eks/Jenkinsfile  (ENVIRONMENT=dev, ACTION=apply)
2. Run infra/frontend/Jenkinsfile     (ENVIRONMENT=dev, ACTION=apply)
3. Run Jenkinsfile.backend            (ENVIRONMENT=dev)
4. kubectl get ingress -n smartbiz    → copy ALB hostname
5. Run Jenkinsfile.frontend           (ENVIRONMENT=dev, API_BASE_URL=<alb-hostname>)
6. Open CloudFront URL from infra frontend output
```

### K8s Manifests

![Combined Full Stack Architecture](./SmartBiz%20ERP%20Full%20Stack%20Production%20Architecture%20Diagram.png)

> **Note:** After `kubectl apply -f k8s/ingress.yaml`, get the ALB DNS name and add a Route53 A alias record:
> ```
> api.example.com  →  A alias  →  <alb-dns>.us-east-1.elb.amazonaws.com
> ```
> Get the ALB DNS: `kubectl get ingress smartbiz-ingress -n smartbiz`

All manifests live in `smartbiz-erp/k8s/`:

```
k8s/
├── namespace.yaml                    ← creates "smartbiz" namespace
├── secret.template.yaml              ← template only — never commit real values
├── ingress.yaml                      ← ALB ingress — routes /api/* paths to services
├── user-service/
│   ├── deployment.yaml               ← 2 replicas, rolling update, health probes
│   └── service.yaml                  ← ClusterIP on port 80
├── inventory-service/
│   ├── deployment.yaml
│   └── service.yaml
└── sales-service/
    ├── deployment.yaml
    └── service.yaml
```

The `ingress.yaml` routes all `/api/*` paths via a single ALB — no separate ingress per service needed. The ALB hostname is used as the single `API_BASE_URL` for the frontend.
