@echo off
echo ========================================
echo   GlassCycle - Local Deployment
echo ========================================
echo.

echo [1/3] Checking Node.js installation...
node --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Node.js is not installed!
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)
echo Node.js is installed ✓
echo.

echo [2/3] Checking if dependencies are installed...
if not exist "node_modules" (
    echo Installing dependencies...
    call npm run install-all
    if errorlevel 1 (
        echo ERROR: Failed to install dependencies!
        pause
        exit /b 1
    )
) else (
    echo Dependencies are installed ✓
)
echo.

echo [3/3] Starting the application...
echo.
echo Backend will run on: http://localhost:5000
echo Frontend will run on: http://localhost:5173
echo.
echo Press Ctrl+C to stop the servers
echo.
call npm run dev
