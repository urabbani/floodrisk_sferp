#!/bin/bash
# deploy.sh - Quick setup script for Left Bank Survey Page on production server

set -e

echo "=== Left Bank Survey Page - Deployment ==="
echo ""

# Configuration
OUTPUT_DIR="/var/www/leftbank"
SCRIPT_DIR="/home/umair/floodrisk_sferp/scripts"
SERVICE_DIR="/etc/systemd/system"

# Check if running as root for certain operations
if [ "$EUID" -ne 0 ]; then
    echo "Note: Some steps require sudo. You'll be prompted for password."
    echo ""
fi

echo "Step 1: Creating output directory..."
sudo mkdir -p "$OUTPUT_DIR"
sudo chown umair:umair "$OUTPUT_DIR"
echo "✓ Created $OUTPUT_DIR"
echo ""

echo "Step 2: Installing files..."
# Copy HTML
cp index.html "$OUTPUT_DIR/"
echo "✓ Installed index.html"

# Copy build script
mkdir -p "$SCRIPT_DIR"
cp build-leftbank.sh "$SCRIPT_DIR/"
chmod +x "$SCRIPT_DIR/build-leftbank.sh"
echo "✓ Installed build-leftbank.sh"

# Create log file
sudo touch /var/log/leftbank-build.log
sudo chown umair:umair /var/log/leftbank-build.log
echo "✓ Created log file"
echo ""

echo "Step 3: Installing systemd service..."
sudo cp leftbank.service "$SERVICE_DIR/"
sudo cp leftbank.timer "$SERVICE_DIR/"
sudo systemctl daemon-reload
echo "✓ Service files installed"
echo ""

echo "Step 4: Testing build script..."
"$SCRIPT_DIR/build-leftbank.sh"
if [ -f "$OUTPUT_DIR/data.geojson" ]; then
    echo "✓ Build successful - data.geojson created"
else
    echo "✗ Build failed - data.geojson not found"
    exit 1
fi
echo ""

echo "Step 5: Installing systemd timer..."
sudo systemctl enable leftbank.timer
sudo systemctl start leftbank.timer
echo "✓ Timer enabled and started"
echo ""

echo "Step 6: Checking timer status..."
sudo systemctl status leftbank.timer --no-pager
echo ""

echo "=== Setup Summary ==="
echo ""
echo "Files installed:"
echo "  - HTML:          $OUTPUT_DIR/index.html"
echo "  - Build script:  $SCRIPT_DIR/build-leftbank.sh"
echo "  - Systemd:       $SERVICE_DIR/leftbank.{service,timer}"
echo "  - Log:           /var/log/leftbank-build.log"
echo ""
echo "NEXT STEPS:"
echo "  1. Configure Apache:"
echo "     sudo nano /etc/apache2/sites-available/floodrisk.conf"
echo "     # Add contents of leftbank-apache.conf"
echo "     sudo a2enmod headers"
echo "     sudo systemctl reload apache2"
echo ""
echo "  2. Visit: https://portal.srpsid-dss.gos.pk/leftbank"
echo ""
echo "To check status:"
echo "  - Build log:  tail -f /var/log/leftbank-build.log"
echo "  - Systemd:    sudo journalctl -u leftbank.service -f"
echo "  - Timer:      sudo systemctl status leftbank.timer"
echo ""
