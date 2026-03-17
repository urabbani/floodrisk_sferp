#!/bin/bash
# Update systemd service configuration with cache settings

SERVICE_FILE="/etc/systemd/system/floodrisk-impact-api.service"

echo "Updating systemd service configuration..."

# Create backup
sudo cp $SERVICE_FILE ${SERVICE_FILE}.backup.$(date +%Y%m%d_%H%M%S)

# Add cache TTL environment variable (5 minutes = 300000ms)
sudo tee $SERVICE_FILE > /dev/null <<EOF
[Unit]
Description=Flood Risk Impact API Server
After=network.target

[Service]
Type=simple
User=umair
WorkingDirectory=/mnt/d/Scenario_results/floodrisk_sferp/api
ExecStart=/usr/bin/node impact-summary.mjs
Restart=on-failure
RestartSec=10
StandardOutput=syslog
StandardError=syslog
SyslogIdentifier=floodrisk-impact-api
Environment=NODE_ENV=production
Environment=PORT=3001
Environment=DB_HOST=10.0.0.205
Environment=DB_PORT=5432
Environment=DB_NAME=postgres
Environment=DB_USER=postgres
Environment=DB_PASSWORD=maltanadirSRV0
Environment=CACHE_TTL=300000

[Install]
WantedBy=multi-user.target
EOF

echo "✅ Service file updated"
echo "🔄 Reloading systemd daemon..."
sudo systemctl daemon-reload
echo "✅ Done! Cache TTL set to 5 minutes (300000ms)"
echo ""
echo "To change cache duration, update CACHE_TTL environment variable:"
echo "  - 5 minutes: CACHE_TTL=300000"
echo "  - 10 minutes: CACHE_TTL=600000"
echo "  - 1 hour: CACHE_TTL=3600000"
