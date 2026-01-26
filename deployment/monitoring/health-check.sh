#!/bin/bash

# Continuous Health Check Script
# Run this with: ./health-check.sh &

INTERVAL=60  # Check every 60 seconds
LOG_FILE="/var/log/hashburst-health.log"

while true; do
  timestamp=$(date '+%Y-%m-%d %H:%M:%S')

  # Check Node 1
  if curl -sf "http://31.25.11.195:8002/api/status" > /dev/null; then
    echo "[$timestamp] Node 1: OK" >> "$LOG_FILE"
  else
    echo "[$timestamp] Node 1: DOWN - Attempting restart..." >> "$LOG_FILE"
    # Add restart logic here if needed
  fi

  # Check Node 2
  if curl -sf "http://85.187.128.14:8003/api/status" > /dev/null; then
    echo "[$timestamp] Node 2: OK" >> "$LOG_FILE"
  else
    echo "[$timestamp] Node 2: DOWN" >> "$LOG_FILE"
  fi

  # Check Node 3
  if curl -sf "http://85.187.128.14:8005/api/status" > /dev/null; then
    echo "[$timestamp] Node 3: OK" >> "$LOG_FILE"
  else
    echo "[$timestamp] Node 3: DOWN" >> "$LOG_FILE"
  fi

  sleep $INTERVAL
done
