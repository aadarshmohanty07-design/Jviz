#!/bin/bash
set -e

echo "==================================================="
echo " Interactive DSA Visualizer - Build & Run"
echo "==================================================="

mkdir -p out

echo "Compiling Java source files..."
javac -cp "lib/*:src/main/java" -d out src/main/java/Main.java src/main/java/core/*.java src/main/java/algorithms/*.java src/main/java/api/*.java

echo "Starting server on http://localhost:8080/ ..."
java -cp "lib/*:out" Main "$@"
