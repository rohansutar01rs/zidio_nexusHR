# ============================================================
# NexusHR - Running Instructions
# ============================================================

## Prerequisites

1. **Java 21 (JDK)** - Ensure `java` is in your PATH.
2. **Maven** - Will be auto-downloaded by the included `mvnw.cmd` wrapper if you don't have it.
3. **Docker Desktop** - Required to spin up the PostgreSQL and Redis containers.

*Note: This project is a production-grade system. It uses PostgreSQL 17 for persistent data storage and Redis 7+ for caching. The included startup scripts automatically spin these up using Docker Compose.*

## Quick Start

### Backend

Open a terminal in the project root and run:

```powershell
.\start-backend.bat
```

*This single script automatically runs `docker-compose up -d` to start the PostgreSQL and Redis databases, compiles the Java code, and opens new terminal windows for the API Gateway and the three Spring Boot microservices.*

### Frontend

Open a second terminal in the project root and run:

```powershell
.\start-frontend.bat
```

*This script installs dependencies and starts the React/Vite development server.*

Then open the URL printed in your terminal (usually `http://localhost:5173` or `http://localhost:5174`) in your browser to view the custom NexusHR Landing Page and Dashboard.

## Default Admin Credentials

- Username: `admin`
- Password: `admin123`

## API Endpoints

### Auth Service (http://localhost:8081/api/auth)
- POST `/signup` - Register new user
- POST `/login` - Login and get JWT token
- POST `/refresh` - Refresh JWT token
- GET `/me` - Get current user info

### Employee Service (http://localhost:8082/api)
- GET/POST `/employees` - List/Create employees
- GET/PUT/DELETE `/employees/{id}` - Get/Update/Delete employee
- GET `/departments` - List departments
- POST `/attendance/check-in/{id}` - Check in
- POST `/attendance/check-out/{id}` - Check out
- POST `/leaves` - Apply for leave
- GET `/ai-insights/employee/{id}` - AI insights for employee
- GET `/ai-insights/summary` - Global AI summary

### Payroll Service (http://localhost:8083/api)
- POST `/payroll/run` - Run payroll for all employees
- GET `/payslips/employee/{id}` - Get employee payslips
- GET `/payroll/config/{employeeId}` - Get salary config

## Troubleshooting

- **Build failures**: Run `.\mvnw.cmd clean compile -DskipTests`
- **Port conflicts**: Check that ports 8080-8083 and 5173 are available on your system.
