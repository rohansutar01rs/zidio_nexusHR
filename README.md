# ============================================================
# NexusHR - Running Instructions
# ============================================================

## Prerequisites

1. **Java 21 (JDK)** - Ensure `java` is in your PATH.
2. **Maven** - Will be auto-downloaded by the included `mvnw.cmd` wrapper if you don't have it.

*Note: This project is fully standalone. It uses an H2 in-memory database and an in-memory token cache. No external database (PostgreSQL) or cache (Redis) installations are required!*

## Quick Start

### Step 1: Build the project

Open a terminal in the `nexushr` folder and run:

```powershell
.\mvnw.cmd clean compile -DskipTests
```

This will auto-download Maven if not installed and build the whole project.

### Step 2: Run Each Service

Open **separate terminals** for each service:

**Terminal 1 - Auth Service (port 8081):**
```powershell
.\mvnw.cmd -pl auth-service spring-boot:run
```

**Terminal 2 - Employee Service (port 8082):**
```powershell
.\mvnw.cmd -pl employee-service spring-boot:run
```

**Terminal 3 - Payroll Service (port 8083):**
```powershell
.\mvnw.cmd -pl payroll-service spring-boot:run
```

**Terminal 4 - API Gateway (port 8080):**
```powershell
.\mvnw.cmd -pl api-gateway spring-boot:run
```

### Step 3: Run the Frontend

Open a new terminal in the `frontend` folder and run:
```powershell
cd frontend
npm install
npm run dev
```

Then open `http://localhost:5173` in your browser.

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
