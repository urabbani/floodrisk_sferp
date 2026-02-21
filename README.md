# Flood Risk Assessment - Indus River

A web-based interactive flood risk assessment tool for the Indus River region in Sindh Province, Pakistan. Built with React 19, TypeScript, Vite, Tailwind CSS, and OpenLayers.

![Flood Risk Assessment](https://img.shields.io/badge/React-19-61DAFB?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?logo=typescript)
![Vite](https://img.shields.io/badge/Vite-7.3-646CFF?logo=vite)
![OpenLayers](https://img.shields.io/badge/OpenLayers-Latest-1F6F75)

## Features

- **Interactive Map Viewer** - OpenLayers-based map with dynamic north arrow and multiple base map options (Google Satellite, OpenStreetMap, Terrain)
- **GeoServer Integration** - WMS services for flood scenario layers
- **Layer Management** - Hierarchical layer tree with:
  - Group and individual layer visibility toggles
  - Opacity control for each layer
  - Expandable/collapsible groups
  - Search functionality with recursive filtering
  - Active layers overlay showing all visible layers
- **Climate Scenarios** - Compare Present vs Future climate conditions
- **Multiple Parameters** - Max Depth, Max Velocity, Duration, V×h
- **Return Periods** - Analyze flood events from 2.3 to 500 years
- **Maintenance Levels** - Breaches (2022), Reduced Capacity, Perfect conditions
- **Mobile Responsive** - Adaptive UI with sidebar toggle for mobile/desktop

## Tech Stack

- **Frontend Framework:** React 19 with TypeScript
- **Build Tool:** Vite 7.3
- **Styling:** Tailwind CSS 3.x
- **Map Library:** OpenLayers
- **UI Components:** shadcn/ui (Radix UI)
- **Map Projection:** UTM Zone 42N (EPSG:32642)

## Prerequisites

Before running this application, ensure you have:

- **Node.js** (v18 or higher) - [Download](https://nodejs.org/)
- **npm** (comes with Node.js)
- **GeoServer** instance with flood risk data configured

## Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/urabbani/floodrisk_sferp.git
   cd floodrisk_sferp
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

   *Note: On WSL (Windows Subsystem for Linux), use `npm install --no-bin-links` to avoid symlink issues.*

3. **Configure GeoServer**

   Edit `src/config/layers.ts` to match your GeoServer setup:
   ```typescript
   const GEOSERVER_CONFIG = {
     baseUrl: '/geoserver',  // Proxied to GeoServer via Vite
     workspaces: {
       results: 'results',
       dem: 'DEM',
     },
     wmsVersion: '1.1.1',
   };
   ```

## Development

Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:5173/`

To expose on network (for testing on other devices):
```bash
npm run dev -- --host
```

## Build for Production

```bash
npm run build
```

The built files will be in the `dist` directory.

Preview the production build locally:
```bash
npm run preview
```

## Project Structure

```
floodrisk_sferp/
├── public/                 # Static assets
├── src/
│   ├── components/
│   │   ├── Header.tsx     # Application header
│   │   ├── layer-tree/    # Layer tree component
│   │   ├── map/           # Map viewer & legend panel
│   │   ├── scenario-explorer/  # Scenario matrix view
│   │   └── ui/            # shadcn/ui components
│   ├── config/
│   │   └── layers.ts      # Layer configuration & GeoServer settings
│   ├── types/
│   │   └── layers.ts      # TypeScript type definitions
│   ├── hooks/
│   │   └── use-mobile.ts  # Mobile detection hook
│   ├── lib/
│   │   └── utils.ts       # Utility functions
│   ├── App.tsx            # Main application component
│   ├── main.tsx           # Application entry point
│   └── index.css          # Global styles
├── index.html
├── package.json
├── vite.config.ts
├── tailwind.config.js
└── tsconfig.json
```

## Layer Configuration

All layers are defined in `src/config/layers.ts`. The layer tree structure is:

```
Layers
├── Survey
│   └── DGPS Survey Points
├── Structures
│   ├── Canal Network
│   └── Drains
├── Supporting Layers
│   ├── Area of Interest
│   ├── Sindh Province
│   └── Sub-Catchments
├── Present Climate
│   ├── Maintenance - Breaches
│   │   └── Depth, Velocity, Duration, V×h
│   ├── Maintenance - Reduced Capacity
│   └── Maintenance - Perfect
├── Future Climate
│   └── (same structure as Present)
├── Flood 2022 (Actual Event)
│   └── Max Depth, Max Velocity, Duration, V×h
└── HDTM
    └── High-resolution DEM tiles (9 tiles)
```

**Layer naming convention:** `t3_{returnPeriod}yrs_{scenario}_{maintenance}_{parameter}`
- Example: `t3_25yrs_present_perfect_maxdepth`

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server with HMR |
| `npm run build` | TypeScript check + production build |
| `npm run lint` | Run ESLint |
| `npm run preview` | Preview production build locally |

## Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)

## Production Deployment (Apache on WSL with HTTPS)

**Live Site:** https://portal.srpsid-dss.gos.pk

This application is deployed on Apache running in WSL with HTTPS enabled.

### 1. Build the Application

```bash
npm run build
```

### 2. Apache Configuration

Create or update the Apache virtual host configuration:

```apache
<VirtualHost *:443>
    ServerName portal.srpsid-dss.gos.pk
    DocumentRoot /mnt/d/Scenario_results/floodrisk_sferp/dist

    # SSL Configuration (Let's Encrypt)
    SSLEngine on
    SSLCertificateFile "/etc/letsencrypt/live/portal.srpsid-dss.gos.pk/fullchain.pem"
    SSLCertificateKeyFile "/etc/letsencrypt/live/portal.srpsid-dss.gos.pk/privkey.pem"

    # Proxy GeoServer WMS requests
    ProxyPreserveHost On
    ProxyPass /geoserver http://10.0.0.205:8080/geoserver
    ProxyPassReverse /geoserver http://10.0.0.205:8080/geoserver

    # SPA routing - redirect all requests to index.html
    <Directory "/mnt/d/Scenario_Reullts/dist">
        RewriteEngine On
        RewriteBase /
        RewriteRule ^index\.html$ - [L]
        RewriteCond %{REQUEST_FILENAME} !-f
        RewriteCond %{REQUEST_FILENAME} !-d
        RewriteRule . /index.html [L]

        Options -Indexes +FollowSymLinks
        AllowOverride All
        Require all granted
    </Directory>

    # Enable compression
    <IfModule mod_deflate.c>
        AddOutputFilterByType DEFLATE text/html text/plain text/xml text/css text/javascript application/javascript application/json
    </IfModule>

    # Cache static assets
    <IfModule mod_expires.c>
        ExpiresActive On
        ExpiresByType image/gif "access plus 1 year"
        ExpiresByType image/jpeg "access plus 1 year"
        ExpiresByType image/png "access plus 1 year"
        ExpiresByType image/svg+xml "access plus 1 year"
        ExpiresByType application/javascript "access plus 1 year"
        ExpiresByType text/css "access plus 1 year"
    </IfModule>

    ErrorLog ${APACHE_LOG_DIR}/floodrisk-error.log
    CustomLog ${APACHE_LOG_DIR}/floodrisk-access.log combined
</VirtualHost>

# Redirect HTTP to HTTPS
<VirtualHost *:80>
    ServerName your-domain.com
    Redirect permanent / https://your-domain.com/
</VirtualHost>
```

### 3. Deploy

Copy the built files to the Apache document root:

```bash
# Local build
npm run build

# Upload to server (using sshpass)
sshpass -p 'password' scp -r dist/* umair@10.0.0.205:/mnt/d/Scenario_results/floodrisk_sferp/dist/

# Or if on server directly
sudo cp -r dist/* /mnt/d/Scenario_results/floodrisk_sferp/dist/
sudo systemctl reload apache2
```

### 4. GeoServer Configuration

The application proxies GeoServer requests through Apache. Ensure:
- GeoServer is accessible at `http://10.0.0.205:8080/geoserver`
- Apache `proxy`, `proxy_http`, and `rewrite` modules are enabled:
  ```bash
  sudo a2enmod proxy proxy_http rewrite ssl
  ```

### 5. Server Details

**Production Server:**
- Host: `10.0.0.205` (internal WSL)
- Domain: `portal.srpsid-dss.gos.pk`
- Public IP: `124.29.217.193`
- Document Root: `/mnt/d/Scenario_results/floodrisk_sferp/dist/`
- Apache Config: `/etc/apache2/sites-available/floodrisk.conf`
- SSL: Let's Encrypt certificates

**GeoServer:**
- URL: `http://10.0.0.205:8080/geoserver`
- Proxy: Apache proxies `/geoserver` to GeoServer

### 6. Updating the Production Site

After the initial deployment, use this workflow to update the site with new features or fixes:

```bash
# 1. Pull latest changes from git (if applicable)
git pull origin main

# 2. Install any new dependencies
npm install --no-bin-links

# 3. Build the production bundle
npm run build

# 4. Backup current production (optional but recommended)
sudo cp -r /var/www/html/floodrisk /var/www/html/floodrisk.backup.$(date +%Y%m%d_%H%M%S)

# 5. Deploy to production
sudo rm -rf /var/www/html/floodrisk/*
sudo cp -r dist/* /var/www/html/floodrisk/

# 6. Clear browser cache (users may need to hard refresh: Ctrl+Shift+R)
```

#### Quick Deploy Script

Create a script `deploy.sh` for faster deployments:

```bash
#!/bin/bash
set -e

echo "Building application..."
npm run build

echo "Backing up current version..."
sudo cp -r /var/www/html/floodrisk /var/www/html/floodrisk.backup.$(date +%Y%m%d_%H%M%S)

echo "Deploying to production..."
sudo rm -rf /var/www/html/floodrisk/*
sudo cp -r dist/* /var/www/html/floodrisk/

echo "Deployment complete! Clear browser cache if needed."
```

Make it executable: `chmod +x deploy.sh`

Then deploy with: `./deploy.sh`

## Credits

Designed and structured using Kimi-K2.5

Built, maintained and deployed using Claude Code with Z.AI's GLM series of models

Orchestrated by Dr. Umair Rabbani

## Known Issues

- **WSL Symlink Issues:** On WSL, use `npm install --no-bin-links` to avoid EPERM errors

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is proprietary and confidential.

## Contact

For questions or feedback, please contact the project maintainers.

---

**Note:** This application requires a running GeoServer instance with properly configured flood risk data layers. Ensure your GeoServer workspace matches the configuration in `src/config/layers.ts`.
