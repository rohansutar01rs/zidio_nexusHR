# NexusHR Backend Automatic Setup & Runner

$mavenVersion = "3.9.6"
$currentDir = $PSScriptRoot
$mavenDir = Join-Path $currentDir ".maven"
$zipPath = Join-Path $mavenDir "maven.zip"
$binPath = Join-Path $mavenDir "apache-maven-$mavenVersion\bin\mvn.cmd"

# 1. Setup Maven if not present
if (-not (Test-Path $binPath)) {
    Write-Output "Local Maven not found. Initializing portable Maven setup..."
    New-Item -ItemType Directory -Path $mavenDir -Force | Out-Null
    
    Write-Output "Downloading Apache Maven $mavenVersion..."
    $url = "https://archive.apache.org/dist/maven/maven-3/$mavenVersion/binaries/apache-maven-$mavenVersion-bin.zip"
    Invoke-WebRequest -Uri $url -OutFile $zipPath
    
    Write-Output "Extracting Maven..."
    Expand-Archive -Path $zipPath -DestinationPath $mavenDir -Force
    Remove-Item -Path $zipPath -Force
    Write-Output "Maven configuration complete."
}

Write-Output "Using Maven path: $binPath"

# 2. Start PostgreSQL and Redis Docker Containers
Write-Output "Starting Docker databases..."
docker-compose -f (Join-Path $currentDir "docker-compose.yml") up -d

# 3. Clean and build all modules
Write-Output "Compiling backend modules (this may take a minute)..."
& $binPath -f (Join-Path $currentDir "pom.xml") clean package -DskipTests

# 4. Launch Services in new windows
Write-Output "Launching Microservices in separate windows..."

# Gateway (Port 8080)
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Write-Host 'Starting API Gateway on port 8080...'; & '$binPath' -f '$currentDir\api-gateway\pom.xml' spring-boot:run"

# Auth Service (Port 8081)
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Write-Host 'Starting Auth Service on port 8081...'; & '$binPath' -f '$currentDir\auth-service\pom.xml' spring-boot:run"

# Employee Service (Port 8082)
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Write-Host 'Starting Employee Service on port 8082...'; & '$binPath' -f '$currentDir\employee-service\pom.xml' spring-boot:run"

# Payroll Service (Port 8083)
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Write-Host 'Starting Payroll Service on port 8083...'; & '$binPath' -f '$currentDir\payroll-service\pom.xml' spring-boot:run"

Write-Output "Backend modules launch sequence completed. You can check each PowerShell window for console logs."
