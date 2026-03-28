# Backend API Deployment Guide

This guide covers deploying the Impact Matrix backend API server to production.

## Prerequisites

- Node.js 18+ installed on the server
- PostgreSQL/PostGIS database accessible
- Apache web server with mod_proxy enabled

## Quick Deploy

Use the automated deployment script:

```bash
# Set your password in the script first
./deploy-backend.sh
```

## Manual Deploy

### 1. Upload API Files

```bash
# Create api directory on server
ssh umair@10.0.0.205 "mkdir -p /mnt/d/Scenario_results/floodrisk_sferp/api"

# Upload files
scp api/impact-summary.mjs umair@10.0.0.205:/mnt/d/Scenario_results/floodrisk_sferp/api/
scp api/package.json umair@10.0.0.205:/mnt/d/Scenario_results/floodrisk_sferp/api/
```

### 2. Install Dependencies

```bash
ssh umair@10.0.0.205
cd /mnt/d/Scenario_results/floodrisk_sferp/api
npm install --production
```

### 3. Setup Systemd Service

```bash
# Copy service file
sudo cp api/floodrisk-impact-api.service /etc/systemd/system/

# Reload systemd
sudo systemctl daemon-reload

# Enable service to start on boot
sudo systemctl enable floodrisk-impact-api

# Start the service
sudo systemctl start floodrisk-impact-api

# Check status
sudo systemctl status floodrisk-impact-api
```

### 4. Configure Apache Proxy

Add to your Apache VirtualHost configuration:

```apache
# Proxy API requests to backend
ProxyPreserveHost On
ProxyPass /api/ http://localhost:3001/api/
ProxyPassReverse /api/ http://localhost:3001/api/
```

Restart Apache:

```bash
sudo systemctl reload apache2
```

## Environment Variables

The backend uses these environment variables (configured in systemd service):

- `NODE_ENV`: production
- `PORT`: 3001
- `DB_HOST`: 10.0.0.205
- `DB_PORT`: 5432
- `DB_NAME`: postgres
- `DB_USER`: postgres
- `DB_PASSWORD`: (set via environment)

## Management Commands

```bash
# Start service
sudo systemctl start floodrisk-impact-api

# Stop service
sudo systemctl stop floodrisk-impact-api

# Restart service
sudo systemctl restart floodrisk-impact-api

# View logs
sudo journalctl -u floodrisk-impact-api -f

# Check status
sudo systemctl status floodrisk-impact-api
```

## Testing

Test the API endpoint:

```bash
# Test Present climate
curl http://localhost:3001/api/impact-summary?climate=present

# Test Future climate
curl http://localhost:3001/api/impact-summary?climate=future
```

## Troubleshooting

### Service won't start

Check logs:
```bash
sudo journalctl -u floodrisk-impact-api -n 50
```

### Port already in use

Find what's using port 3001:
```bash
sudo lsof -i :3001
```

### Database connection failed

Verify database is accessible:
```bash
psql -h 10.0.0.205 -U postgres -d postgres -c "SELECT 1;"
```

## Alternative: Using PM2

If you prefer PM2 over systemd:

```bash
# Install PM2 globally
npm install -g pm2

# Start application
pm2 start api/ecosystem.config.cjs

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup
```
