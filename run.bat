@echo off
setlocal enabledelayedexpansion

echo ===================================================
echo  Interactive DSA Visualizer - Build & Run
echo ===================================================

:: Check for javac
where javac >nul 2>nul
if %errorlevel% equ 0 (
    set JAVAC_CMD=javac
    set JAVA_CMD=java
) else (
    if defined JAVA_HOME (
        set JAVAC_CMD="%JAVA_HOME%\bin\javac.exe"
        set JAVA_CMD="%JAVA_HOME%\bin\java.exe"
    ) else (
        if exist "C:\Program Files\Eclipse Adoptium\jdk-21.0.13.10002-hotspot\bin\javac.exe" (
            set JAVAC_CMD="C:\Program Files\Eclipse Adoptium\jdk-21.0.13.10002-hotspot\bin\javac.exe"
            set JAVA_CMD="C:\Program Files\Eclipse Adoptium\jdk-21.0.13.10002-hotspot\bin\java.exe"
        ) else (
            echo [ERROR] javac was not found on PATH or standard JDK directories.
            echo Please ensure JDK 17+ is installed and on PATH.
            exit /b 1
        )
    )
)

echo Using compiler: !JAVAC_CMD!

if not exist out mkdir out

echo Compiling Java source files...
!JAVAC_CMD! -cp "lib/*;src/main/java" -d out src/main/java/Main.java src/main/java/core/*.java src/main/java/algorithms/*.java src/main/java/api/*.java
if %errorlevel% neq 0 (
    echo [ERROR] Compilation failed!
    exit /b 1
)

echo Starting server on http://localhost:8080/ ...
!JAVA_CMD! -cp "lib/*;out" Main %*
