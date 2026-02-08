#!/bin/bash

# Get the project directory
PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"

# Start frontend dev server in a new terminal window
osascript -e "tell application \"Terminal\"
    do script \"cd '$PROJECT_DIR/frontend' && npm run dev\"
end tell"

# Wait a moment before opening the next terminal
sleep 0.5

# Start backend dev server in a new terminal window
osascript -e "tell application \"Terminal\"
    do script \"cd '$PROJECT_DIR/backend' && npm run dev\"
end tell"

# Wait a moment before opening the next terminal
sleep 0.5

# Start cloudflared tunnel in a new terminal window
osascript -e "tell application \"Terminal\"
    do script \"cd '$PROJECT_DIR' && cloudflared tunnel run --token eyJhIjoiOWIzODRkZjVkNmRhNGEyMGZhNWE4YjM4MzVhODI1NmIiLCJ0IjoiNjVkN2MxN2EtMGE0ZC00ZWQyLTgyNTAtOTY5MjQzNzM1N2E1IiwicyI6Ik16bGhOelZpWTJJdFlqVmpaUzAwWXpBMExXSXlaV0V0TWpnM01tSmxObVpsWWpVeSJ9\"
end tell"

echo "All development servers started in separate terminal windows!"
