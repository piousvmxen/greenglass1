@echo off
echo ========================================
echo   Creating Admin User - GlassCycle
echo ========================================
echo.

echo Checking MongoDB connection...
echo.

node create-admin.js

if errorlevel 1 (
    echo.
    echo ERROR: Failed to create admin user!
    echo Please check:
    echo 1. MongoDB is running
    echo 2. MONGODB_URI in .env is correct
    pause
    exit /b 1
)

echo.
echo Admin user created successfully!
echo.
pause
