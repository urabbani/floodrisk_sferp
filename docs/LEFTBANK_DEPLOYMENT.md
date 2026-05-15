# Left Bank Survey Page - Deployment Guide

## Overview
Live survey progress dashboard for Left Bank infrastructure survey at `/leftbank`.

## Architecture

```
Mergin Sync (v43, v44...)
    ↓
build-leftbank.sh (detects new version)
    ↓
ogr2ogr converts Data.gpkg → data.geojson
    ↓
/var/www/leftbank/data.geojson
    ↓
Browser: leftbank.html (auto-refreshes every 5 min)
```

## Files Created

1. **`scripts/build-leftbank.sh`** - Build script that detects new Mergin versions and converts to GeoJSON
2. **`leftbank.html`** - Frontend page with OpenLayers map
3. **`leftbank.service`** - Systemd service definition
4. **`leftbank.timer`** - Systemd timer (runs every 5 min)
5. **`leftbank-apache.conf`** - Apache configuration

## Deployment Steps

### 1. Create Output Directory

```bash
sudo mkdir -p /var/www/leftbank
sudo chown umair:umair /var/www/leftbank
```

### 2. Copy Files to Server

```bash
# Copy build script
cp scripts/build-leftbank.sh /home/umair/floodrisk_sferp/scripts/
chmod +x /home/umair/floodrisk_sferp/scripts/build-leftbank.sh

# Copy HTML page
cp leftbank.html /var/www/leftbank/index.html

# Create log file
sudo touch /var/log/leftbank-build.log
sudo chown umair:umair /var/log/leftbank-build.log
```

### 3. Install Dependencies

```bash
# Ensure ogr2ogr is installed (part of GDAL)
sudo apt install gdal-bin
```

### 4. Test Build Script Manually

```bash
/home/umair/floodrisk_sferp/scripts/build-leftbank.sh
```

Verify that `/var/www/leftbank/data.geojson` and `/var/www/leftbank/meta.json` are created.

### 5. Configure Apache

Add the configuration to your Apache config:

```bash
# Edit the floodrisk config
sudo nano /etc/apache2/sites-available/floodrisk.conf
```

Add the contents of `leftbank-apache.conf` to the file, then:

```bash
# Enable headers module if not already enabled
sudo a2enmod headers

# Test and reload Apache
sudo apache2ctl configtest
sudo systemctl reload apache2
```

### 6. Install Systemd Service

```bash
# Copy service files
sudo cp leftbank.service /etc/systemd/system/
sudo cp leftbank.timer /etc/systemd/system/

# Enable and start the timer
sudo systemctl daemon-reload
sudo systemctl enable leftbank.timer
sudo systemctl start leftbank.timer

# Verify it's running
sudo systemctl status leftbank.timer
```

### 7. Test the Page

Visit: `https://portal.srpsid-dss.gos.pk/leftbank`

## How It Works

1. **Auto-detection**: The systemd timer runs `build-leftbank.sh` every 5 minutes
2. **Version check**: Script finds the highest version folder (v43, v44, etc.)
3. **Conversion**: If new version detected, `ogr2ogr` converts `Data.gpkg` to `data.geojson`
4. **Frontend**: The HTML page loads the GeoJSON and displays points on an OpenLayers map
5. **Auto-refresh**: Browser polls for updates every 5 minutes

## Manual Operations

```bash
# Manually trigger a build
/home/umair/floodrisk_sferp/scripts/build-leftbank.sh

# View build log
tail -f /var/log/leftbank-build.log

# View systemd logs
sudo journalctl -u leftbank.service -f

# Check timer status
sudo systemctl list-timers leftbank.timer
```

## Troubleshooting

### Page shows "No survey points yet"
- Check if `data.geojson` exists: `ls -la /var/www/leftbank/`
- Run build script manually and check for errors
- Verify Mergin project path is correct in the script

### Apache 404 error
- Check Apache config: `sudo apache2ctl -S`
- Verify permissions: `ls -la /var/www/leftbank/`
- Check Apache error log: `sudo tail -f /var/log/apache2/error.log`

### Data not updating
- Check systemd timer: `sudo systemctl status leftbank.timer`
- Check build log: `tail -f /var/log/leftbank-build.log`
- Verify GDAL is installed: `ogr2ogr --version`

## Data Schema

The GeoJSON contains the following fields from `Data.gpkg`:

| Field | Type | Description |
|-------|------|-------------|
| fid | Integer | Feature ID |
| Date | DateTime | Survey date/time |
| X | Integer | X coordinate |
| Name | String | Asset name |
| Type | String | Asset type (culvert, bund, etc.) |
| RD | String | Reference/Designation |
| Village Name | String | Village location |
| Notes | String | Field notes |
| Photo1-4 | String | Photo URLs/paths |
| Surveyor | String | Surveyor name |
| geom | Point | WGS 84 coordinates |

## Future Enhancements

- Add authentication for admin-only features
- Export to Excel functionality
- Photo gallery view
- Survey statistics dashboard
- Filter by asset type, surveyor, date range
