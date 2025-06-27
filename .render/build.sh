#!/usr/bin/env bash

echo "📦 Installing backend dependencies..."
npm ci

echo "📦 Installing frontend dependencies and building React app..."
cd qr_generator
npm ci
npm run build
