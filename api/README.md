# Flood Impact & Exposure API

This directory contains API endpoints for fetching flood impact and exposure summary data from PostGIS.

## Setup Instructions

### Option 1: Node.js/Express Server

**Prerequisites:**
- Node.js installed
- PostGIS database with impact data
- Impact summary view created (see `../sql/impact_summary_query.sql`)

**Installation:**

1. Install dependencies:
```bash
cd api
npm install express pg cors
```

2. Configure database connection:
```bash
export DATABASE_URL="postgresql://username:password@localhost:5432/floodrisk"
```

Or edit the connection string directly in `impact-summary.js`.

3. Run the server:
```bash
node impact-summary.js
```

The server will start on port 3001 (configurable via PORT environment variable).

**Endpoints:**
- `GET /api/health` - Health check
- `GET /api/impact/summary?climate=present` - Get impact summary

### Option 2: PHP Endpoint (Recommended for Apache)

**Prerequisites:**
- PHP with PDO PostgreSQL extension
- PostGIS database with impact data
- Impact summary view created (see `../sql/impact_summary_query.sql`)
- Apache web server

**Installation:**

1. Edit database credentials in `impact-summary.php`:
```php
define('DB_HOST', 'localhost');
define('DB_PORT', '5432');
define('DB_NAME', 'floodrisk');
define('DB_USER', 'your_username');
define('DB_PASS', 'your_password');
```

2. Ensure the file is accessible via Apache:
```bash
# Copy to web directory
cp api/impact-summary.php /var/www/html/api/

# Or create a symlink
ln -s /mnt/d/floodrisk_sferp/api/impact-summary.php /var/www/html/api/
```

3. Access the endpoint:
```
http://your-server/api/impact-summary.php?climate=present
```

## API Documentation

### GET /api/impact/summary

Fetch impact summary data for flood scenarios.

**Query Parameters:**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `climate` | string | Yes | - | 'present' or 'future' |
| `maintenance` | string | No | 'all' | 'breaches', 'redcapacity', 'perfect', or 'all' |
| `returnPeriod` | string | No | - | '2.3', '5', '10', '25', '50', '100', or '500' |
| `depthThreshold` | number | No | 0 | Minimum depth to count as "affected" |

**Request Examples:**

```bash
# Get all impacts for present climate
curl "http://localhost:3001/api/impact/summary?climate=present"

# Get impacts for specific maintenance
curl "http://localhost:3001/api/impact/summary?climate=present&maintenance=breaches"

# Get impacts for specific return period
curl "http://localhost:3001/api/impact/summary?climate=present&returnPeriod=25"

# Get impacts with depth threshold
curl "http://localhost:3001/api/impact/summary?climate=present&depthThreshold=1.5"
```

**Response Format:**

```json
{
  "success": true,
  "data": {
    "climate": "present",
    "summaries": [
      {
        "scenarioId": "t3_25yrs_present_breaches",
        "climate": "present",
        "maintenance": "breaches",
        "returnPeriod": "25",
        "totalAffectedExposures": 7,
        "severity": "high",
        "impacts": {
          "Buildings": {
            "layerType": "Buildings",
            "totalFeatures": 5432,
            "affectedFeatures": 1245,
            "maxDepth": 2.3,
            "depthBins": [
              {
                "range": "0-1m",
                "minDepth": 0,
                "maxDepth": 1,
                "count": 234,
                "percentage": 18.8
              },
              {
                "range": "1-2m",
                "minDepth": 1,
                "maxDepth": 2,
                "count": 567,
                "percentage": 45.5
              },
              ...
            ],
            "geoserverLayer": "t3_25yrs_present_breaches_Buildings",
            "workspace": "results",
            "geometryType": "polygon"
          },
          ...
        }
      },
      ...
    ],
    "metadata": {
      "lastUpdated": "2026-03-13T10:30:00Z",
      "depthThreshold": 0,
      "totalScenarios": 21
    }
  }
}
```

**Error Response:**

```json
{
  "success": false,
  "error": "Error message here",
  "data": null
}
```

## Database Setup

Before using the API, you need to set up the database views and functions.

1. Run the SQL setup script:
```bash
psql -U username -d floodrisk -f sql/impact_summary_query.sql
```

This will create:
- `get_impact_summary()` function - Get stats for a single scenario/exposure
- `impact_summary_vw` view - Comprehensive impact summary
- Indexes for performance (optional)

2. Verify the view is working:
```sql
SELECT * FROM impact_summary_vw
WHERE climate = 'present'
LIMIT 10;
```

## Troubleshooting

**Connection Issues:**
- Verify database credentials
- Check database is accessible: `psql -U username -d floodrisk`
- For PHP, ensure PDO PostgreSQL extension is enabled: `php -m | grep pdo`

**No Data Returned:**
- Verify impact layers exist in database
- Check layer naming convention matches: `t3_{rp}yrs_{climate}_{maintenance}_{type}`
- Ensure `depth_bin` column exists and has data

**Performance Issues:**
- Create indexes on `depth_bin` columns
- Consider materialized views for large datasets
- Use connection pooling for high traffic

## Security Considerations

1. **Database Credentials:** Never commit credentials to git
2. **CORS:** Configure allowed origins appropriately
3. **Rate Limiting:** Implement rate limiting for production
4. **SSL:** Use HTTPS in production
5. **Input Validation:** All inputs are validated/sanitized

## Deployment

### Node.js (PM2)

```bash
# Install PM2
npm install -g pm2

# Start server
pm2 start api/impact-summary.js --name impact-api

# Configure to start on boot
pm2 startup
pm2 save
```

### PHP (Apache)

Ensure Apache has PHP PostgreSQL extension:

```bash
# Ubuntu/Debian
sudo apt install php-pgsql

# Restart Apache
sudo systemctl restart apache2
```

Configure Apache virtual host if needed:

```apache
<VirtualHost *:80>
    ServerName your-domain.com
    DocumentRoot /var/www/html

    <Directory "/var/www/html/api">
        Options -Indexes +FollowSymLinks
        AllowOverride All
        Require all granted
    </Directory>
</VirtualHost>
```

## Testing

Test the API endpoints:

```bash
# Health check
curl http://localhost:3001/api/health

# Get impact data
curl "http://localhost:3001/api/impact/summary?climate=present" | jq

# Test with filters
curl "http://localhost:3001/api/impact/summary?climate=present&maintenance=breaches&returnPeriod=25" | jq
```

## Support

For issues or questions, refer to:
- Main project README
- IMPACT_MATRIX_PLAN.md for architecture details
- SQL file comments for database schema
