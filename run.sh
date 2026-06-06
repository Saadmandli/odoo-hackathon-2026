#!/usr/bin/env bash
# VendorBridge - zero-setup launcher (macOS / Linux). Only Node.js is required.
set -e
echo "============================================"
echo "  VendorBridge - starting up"
echo "============================================"
command -v node >/dev/null || { echo "[X] Node.js not found. Install from https://nodejs.org"; exit 1; }
[ -f .env ] || cp .env.example .env
echo "[1/2] Installing dependencies (first run can take a couple of minutes)..."
npm install
echo "[2/2] Starting database + app..."
echo "     Open http://localhost:3000  (login: officer@vendorbridge.com / password123)"
npm run dev:local
