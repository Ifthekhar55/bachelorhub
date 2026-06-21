@echo off
echo ========================================
echo Fixing Port 5004 - Bachelor Housing
echo ========================================
echo.

echo Finding process on port 5004...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :5004 ^| findstr LISTENING') do (
    echo Found process with PID: %%a
    echo Killing process...
    taskkill /PID %%a /F
    echo Process killed!
)

echo.
echo Port 5004 is now free!
echo.
echo Starting backend server...
echo.

npm run dev