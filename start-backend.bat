@echo off
echo ==========================================
echo Starting NexusHR Backend Services...
echo ==========================================

echo Starting PostgreSQL and Redis containers...
call docker-compose up -d

echo Building the project...
call mvnw.cmd clean install -DskipTests

echo Starting Auth Service (Port 8081)...
start "Auth Service" cmd /c "mvnw.cmd -pl auth-service spring-boot:run"

echo Starting Employee Service (Port 8082)...
start "Employee Service" cmd /c "mvnw.cmd -pl employee-service spring-boot:run"

echo Starting Payroll Service (Port 8083)...
start "Payroll Service" cmd /c "mvnw.cmd -pl payroll-service spring-boot:run"

echo Starting API Gateway (Port 8080)...
start "API Gateway" cmd /c "mvnw.cmd -pl api-gateway spring-boot:run"

echo ==========================================
echo All backend services are starting in new windows!
echo Please wait about 15-20 seconds for them to fully boot up.
echo ==========================================
pause
