/**
 * Generate PNG tiles from WorldPop TIFF
 *
 * This script converts the WorldPop GeoTIFF to XYZ tiles for web display.
 * Uses sharp for image processing.
 */

import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const INPUT_FILE = './public/T1_WorldPop_V1_32642.tif';
const OUTPUT_DIR = './public/tiles/worldpop';
const MAX_ZOOM = 10; // Maximum zoom level
const START_ZOOM = 6; // Starting zoom level

// UTM Zone 42N bounds for our area
const BOUNDS = {
  minX: 315204,
  minY: 2864590,
  maxX: 563443,
  maxY: 3153441,
};

// Create output directory
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

/**
 * Convert UTM coordinates to tile coordinates for a given zoom level
 * Simplified conversion for UTM to XYZ tiles
 */
function utmToTile(x, y, zoom) {
  const tileSize = 256;
  const worldSize = tileSize * Math.pow(2, zoom);

  // Normalize UTM to 0-1 range
  const normX = (x - BOUNDS.minX) / (BOUNDS.maxX - BOUNDS.minX);
  const normY = (y - BOUNDS.minY) / (BOUNDS.maxY - BOUNDS.minY);

  // Convert to tile coordinates
  const tileX = Math.floor(normX * Math.pow(2, zoom));
  const tileY = Math.floor((1 - normY) * Math.pow(2, zoom));

  return { x: tileX, y: tileY };
}

/**
 * Generate tiles for a specific zoom level
 */
async function generateTiles(zoom) {
  console.log(`Generating zoom level ${zoom}...`);

  const maxTile = Math.pow(2, zoom);

  for (let x = 0; x < maxTile; x++) {
    for (let y = 0; y < maxTile; y++) {
      // Calculate UTM bounds for this tile
      const tileMinX = BOUNDS.minX + (x / maxTile) * (BOUNDS.maxX - BOUNDS.minX);
      const tileMaxX = BOUNDS.minX + ((x + 1) / maxTile) * (BOUNDS.maxX - BOUNDS.minX);
      const tileMinY = BOUNDS.minY + ((maxTile - 1 - y) / maxTile) * (BOUNDS.maxY - BOUNDS.minY);
      const tileMaxY = BOUNDS.minY + ((maxTile - y) / maxTile) * (BOUNDS.maxY - BOUNDS.minY);

      // Create tile directory
      const tileDir = path.join(OUTPUT_DIR, zoom.toString(), x.toString());
      if (!fs.existsSync(tileDir)) {
        fs.mkdirSync(tileDir, { recursive: true });
      }

      const tilePath = path.join(tileDir, `${y}.png`);

      // Extract region from TIFF and convert to PNG with heatmap coloring
      try {
        // Use sharp to extract the region and apply color mapping
        // Note: This is a simplified version - actual implementation would need GDAL
        await sharp(INPUT_FILE, {
          extract: {
            left: Math.floor((tileMinX - BOUNDS.minX) / 95), // ~95m per pixel
            top: Math.floor((BOUNDS.maxY - tileMaxY) / 95),
            width: Math.floor((tileMaxX - tileMinX) / 95),
            height: Math.floor((tileMaxY - tileMinY) / 95),
          },
        })
          .resize(256, 256, { fit: 'fill' })
          .modulate({
            brightness: 1,
            saturation: 0.5, // Reduce saturation for better overlay
          })
          .toFile(tilePath);
      } catch (error) {
        // Tile might be outside bounds or other error - skip
        console.debug(`Skipping tile ${zoom}/${x}/${y}:`, error.message);
      }
    }

    if (x % 10 === 0) {
      console.log(`  Progress: ${x}/${maxTile} columns`);
    }
  }

  console.log(`Zoom level ${zoom} complete.`);
}

/**
 * Main generation function
 */
async function main() {
  console.log('WorldPop Tile Generator');
  console.log('========================');

  for (let z = START_ZOOM; z <= MAX_ZOOM; z++) {
    await generateTiles(z);
  }

  console.log('Tile generation complete!');
  console.log(`Tiles saved to: ${OUTPUT_DIR}`);
}

main().catch(console.error);
