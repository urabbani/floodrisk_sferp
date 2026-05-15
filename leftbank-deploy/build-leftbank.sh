#!/bin/bash
# build-leftbank.sh - Build GeoJSON from latest Mergin Data.gpkg
# This script checks for new versions and converts to GeoJSON for the /survey page

MERGIN_PROJECT_PATH="/mnt/c/mergin-data/projects/b2/28e60668a94f0c2f88436e3e2c13d8b1"
OUTPUT_DIR="/var/www/leftbank"
OUTPUT_FILE="$OUTPUT_DIR/data.geojson"
VERSION_FILE="$OUTPUT_DIR/.current_version"
LOG_FILE="/var/log/leftbank-build.log"

# Create output directory if it doesn't exist
mkdir -p "$OUTPUT_DIR"

# Function to log messages
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# Function to find the latest version folder
find_latest_version() {
    ls -1d "$MERGIN_PROJECT_PATH"/v* 2>/dev/null | \
        sed 's/.*v//' | \
        sort -n | \
        tail -1
}

# Function to convert GPKG to GeoJSON
convert_to_geojson() {
    local version=$1
    local gpkg_path="$MERGIN_PROJECT_PATH/v${version}/Data.gpkg"

    log "Converting Data.gpkg to GeoJSON..."

    if ogr2ogr -f GeoJSON "$OUTPUT_FILE.tmp" "$gpkg_path" Data 2>>"$LOG_FILE"; then
        # Add metadata
        echo '{"version":"'"$version"'","lastUpdated":"'"$(date -Iseconds)"'"}' > "$OUTPUT_DIR/meta.json"

        mv "$OUTPUT_FILE.tmp" "$OUTPUT_FILE"
        echo "$version" > "$VERSION_FILE"
        log "Successfully built data.geojson for version $version"
        return 0
    else
        log "ERROR: Failed to convert Data.gpkg"
        rm -f "$OUTPUT_FILE.tmp"
        return 1
    fi
}

# Main script
log "=== Leftbank Data Build Started ==="

# Find latest version
LATEST_VERSION=$(find_latest_version)

if [ -z "$LATEST_VERSION" ]; then
    log "ERROR: No version folders found in $MERGIN_PROJECT_PATH"
    exit 1
fi

log "Latest version: v$LATEST_VERSION"

# Check if we need to rebuild
CURRENT_VERSION=""
if [ -f "$VERSION_FILE" ]; then
    CURRENT_VERSION=$(cat "$VERSION_FILE")
fi

if [ "$LATEST_VERSION" = "$CURRENT_VERSION" ]; then
    log "No new version detected (current: v$CURRENT_VERSION)"
    # Still refresh the GeoJSON for any data changes
    convert_to_geojson "$LATEST_VERSION"
else
    log "New version detected! v$CURRENT_VERSION -> v$LATEST_VERSION"
    convert_to_geojson "$LATEST_VERSION"
fi

log "=== Build Complete ==="
