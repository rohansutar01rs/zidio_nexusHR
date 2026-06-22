@echo off
echo ==========================================
echo Starting NexusHR Frontend...
echo ==========================================

cd frontend
call npm install
call npm run dev
pause
