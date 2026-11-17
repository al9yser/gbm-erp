@echo off
where gradle >nul 2>nul
if errorlevel 1 (
  echo Gradle 8.9+ is required. Install Gradle or open this project with Android Studio.
  exit /b 1
)
gradle %*
