#!/bin/bash
# PostgreSQL Connection Monitoring Script for Flood Risk Assessment API
# This script checks connection pool status and alerts if approaching limits

DB_HOST="10.0.0.205"
DB_USER="postgres"
DB_NAME="postgres"
API_URL="http://localhost:3001"
WARNING_THRESHOLD=70  # Alert at 70% of max connections
CRITICAL_THRESHOLD=85  # Critical alert at 85%
LOG_FILE="$HOME/floodrisk-db-monitor.log"

echo "=== PostgreSQL Connection Monitor ===" | tee -a "$LOG_FILE"
date | tee -a "$LOG_FILE"

# Get max connections from PostgreSQL
MAX_CONNECTIONS=$(PGPASSWORD='maltanadirSRV0' psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -t -c "SHOW max_connections;" 2>/dev/null | xargs)

if [ -z "$MAX_CONNECTIONS" ]; then
    echo "ERROR: Cannot connect to PostgreSQL database!" | tee -a "$LOG_FILE"
    exit 1
fi

# Get current connection count
CURRENT_CONNECTIONS=$(PGPASSWORD='maltanadirSRV0' psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT count(*) FROM pg_stat_activity;" 2>/dev/null | xargs)

if [ -z "$CURRENT_CONNECTIONS" ]; then
    echo "ERROR: Cannot get connection count!" | tee -a "$LOG_FILE"
    exit 1
fi

# Calculate percentage
USAGE_PERCENTAGE=$((CURRENT_CONNECTIONS * 100 / MAX_CONNECTIONS))

echo "Max Connections: $MAX_CONNECTIONS" | tee -a "$LOG_FILE"
echo "Current Connections: $CURRENT_CONNECTIONS" | tee -a "$LOG_FILE"
echo "Usage: ${USAGE_PERCENTAGE}%" | tee -a "$LOG_FILE"

# Check API health
echo "" | tee -a "$LOG_FILE"
echo "=== API Health Check ===" | tee -a "$LOG_FILE"
HEALTH_RESPONSE=$(curl -s "$API_URL/api/health" 2>/dev/null)
API_HEALTH=$(echo "$HEALTH_RESPONSE" | grep -o '"status":"[^"]*"' | cut -d'"' -f4)
echo "API Status: $API_HEALTH" | tee -a "$LOG_FILE"

# Show connection pool status if API is healthy
if [ "$API_HEALTH" = "ok" ]; then
    echo "$HEALTH_RESPONSE" | grep -o '"pool":{[^}]*}' | tee -a "$LOG_FILE"
fi

echo "" | tee -a "$LOG_FILE"
echo "=================================" | tee -a "$LOG_FILE"

# Alert logic
if [ $USAGE_PERCENTAGE -ge $CRITICAL_THRESHOLD ]; then
    echo "CRITICAL: PostgreSQL connection usage at ${USAGE_PERCENTAGE}%!" | tee -a "$LOG_FILE"
    echo "Action required: Restart API service or investigate connection leaks" | tee -a "$LOG_FILE"
    # You could add email/webhook alerts here
    exit 2
elif [ $USAGE_PERCENTAGE -ge $WARNING_THRESHOLD ]; then
    echo "WARNING: PostgreSQL connection usage at ${USAGE_PERCENTAGE}%" | tee -a "$LOG_FILE"
    echo "Monitor closely, connections may be accumulating" | tee -a "$LOG_FILE"
    exit 1
else
    echo "OK: Connection usage is healthy" | tee -a "$LOG_FILE"
    exit 0
fi
