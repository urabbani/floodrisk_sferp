# Flood Risk Assessment - Project Info

## Project Status
- **Status:** Live Production
- **Live URL:** https://portal.srpsid-dss.gos.pk
- **Last Deployed:** February 21, 2026

## Server Information
- **Internal IP:** 10.0.0.205
- **Public IP:** 124.29.217.193
- **SSH User:** umair
- **Document Root:** `/mnt/d/Scenario_results/floodrisk_sferp/dist/`
- **Apache Config:** `/etc/apache2/sites-available/floodrisk.conf`

## Tech Stack
- **Frontend:** React 19, TypeScript, Vite 7.3
- **Styling:** Tailwind CSS 3.x
- **Map:** OpenLayers (EPSG:32642 - UTM Zone 42N)
- **UI:** shadcn/ui (Radix UI)
- **Data:** GeoServer WMS at `http://10.0.0.205:8080/geoserver`

## Deployment Workflow
```bash
# 1. Build
npm run build

# 2. Upload to server
sshpass -p 'password' scp -r dist/* umair@10.0.0.205:/mnt/d/Scenario_results/floodrisk_sferp/dist/

# 3. Sync git repo on server
sshpass -p 'password' ssh umair@10.0.0.205 "cd /mnt/d/Scenario_results/floodrisk_sferp && git pull"
```

## Credits
- **Design & Structure:** Kimi-K2.5
- **Build, Maintain & Deploy:** Claude Code (Z.AI's GLM series)
- **Orchestrator:** Dr. Umair Rabbani

## Backup & Rollback
- **Backup Config:** `/etc/apache2/sites-available/qgis-web-client.conf.backup`
- **To Rollback:**
  ```bash
  sudo a2dissite floodrisk.conf
  sudo a2ensite qgis-web-client.conf
  sudo systemctl reload apache2
  ```
