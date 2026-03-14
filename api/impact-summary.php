<?php
/**
 * Flood Impact & Exposure API Endpoint (PHP Version)
 *
 * This PHP endpoint queries PostGIS and returns impact summary data.
 * Suitable for Apache deployments.
 *
 * Usage:
 *   Place this file in your web directory: /api/impact-summary.php
 *   Access: /api/impact-summary.php?climate=present
 *
 * Requirements:
 *   - PHP with PDO PostgreSQL extension
 *   - PostGIS database with impact_summary_vw view
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

/**
 * Database configuration
 */
define('DB_HOST', 'localhost');
define('DB_PORT', '5432');
define('DB_NAME', 'floodrisk');
define('DB_USER', 'username');
define('DB_PASS', 'password');

/**
 * Get query parameters
 */
$climate = $_GET['climate'] ?? null;
$maintenance = $_GET['maintenance'] ?? 'all';
$returnPeriod = $_GET['returnPeriod'] ?? null;
$depthThreshold = floatval($_GET['depthThreshold'] ?? '0');

/**
 * Validate required parameters
 */
if (!$climate || !in_array($climate, ['present', 'future'])) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'error' => 'Invalid climate parameter. Must be "present" or "future".',
        'data' => null
    ]);
    exit();
}

/**
 * Connect to database
 */
try {
    $dsn = sprintf(
        'pgsql:host=%s;port=%s;dbname=%s',
        DB_HOST,
        DB_PORT,
        DB_NAME
    );

    $pdo = new PDO($dsn, DB_USER, DB_PASS, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Database connection failed: ' . $e->getMessage(),
        'data' => null
    ]);
    exit();
}

/**
 * Build and execute query
 */
try {
    $sql = "
        SELECT
            climate,
            maintenance,
            return_period,
            exposure_type,
            total_features,
            affected_features,
            max_depth,
            bin_0_1_count,
            bin_1_2_count,
            bin_2_3_count,
            bin_3_4_count,
            bin_4_5_count,
            bin_5_plus_count,
            severity_level
        FROM impact_summary_vw
        WHERE climate = :climate
    ";

    $params = [':climate' => $climate];

    if ($maintenance !== 'all') {
        $sql .= " AND maintenance = :maintenance";
        $params[':maintenance'] = $maintenance;
    }

    if ($returnPeriod) {
        $sql .= " AND return_period = :returnPeriod";
        $params[':returnPeriod'] = $returnPeriod;
    }

    $sql .= " ORDER BY return_period, maintenance, exposure_type";

    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $rows = $stmt->fetchAll();

    /**
     * Process results into ImpactSummaryResponse format
     */
    $summaries = processResults($rows, $depthThreshold);

    $response = [
        'success' => true,
        'data' => [
            'climate' => $climate,
            'summaries' => $summaries,
            'metadata' => [
                'lastUpdated' => date('c'),
                'depthThreshold' => $depthThreshold,
                'totalScenarios' => count($summaries)
            ]
        ]
    ];

    echo json_encode($response, JSON_NUMERIC_CHECK | JSON_PRETTY_PRINT);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Query failed: ' . $e->getMessage(),
        'data' => null
    ]);
}

/**
 * Process database rows into ScenarioImpactSummary format
 */
function processResults($rows, $depthThreshold) {
    $scenarioMap = [];

    foreach ($rows as $row) {
        $scenarioId = "t3_{$row['return_period']}yrs_{$row['climate']}_{$row['maintenance']}";

        if (!isset($scenarioMap[$scenarioId])) {
            $scenarioMap[$scenarioId] = [
                'scenarioId' => $scenarioId,
                'climate' => $row['climate'],
                'maintenance' => $row['maintenance'],
                'returnPeriod' => $row['return_period'],
                'totalAffectedExposures' => 0,
                'severity' => 'low',
                'impacts' => []
            ];
        }

        $scenario = &$scenarioMap[$scenarioId];

        // Build depth bins
        $totalAffected = max(0, $row['affected_features']);
        $depthBins = [
            [
                'range' => '0-1m',
                'minDepth' => 0,
                'maxDepth' => 1,
                'count' => (int)$row['bin_0_1_count'],
                'percentage' => $totalAffected > 0 ? ($row['bin_0_1_count'] / $totalAffected) * 100 : 0
            ],
            [
                'range' => '1-2m',
                'minDepth' => 1,
                'maxDepth' => 2,
                'count' => (int)$row['bin_1_2_count'],
                'percentage' => $totalAffected > 0 ? ($row['bin_1_2_count'] / $totalAffected) * 100 : 0
            ],
            [
                'range' => '2-3m',
                'minDepth' => 2,
                'maxDepth' => 3,
                'count' => (int)$row['bin_2_3_count'],
                'percentage' => $totalAffected > 0 ? ($row['bin_2_3_count'] / $totalAffected) * 100 : 0
            ],
            [
                'range' => '3-4m',
                'minDepth' => 3,
                'maxDepth' => 4,
                'count' => (int)$row['bin_3_4_count'],
                'percentage' => $totalAffected > 0 ? ($row['bin_3_4_count'] / $totalAffected) * 100 : 0
            ],
            [
                'range' => '4-5m',
                'minDepth' => 4,
                'maxDepth' => 5,
                'count' => (int)$row['bin_4_5_count'],
                'percentage' => $totalAffected > 0 ? ($row['bin_4_5_count'] / $totalAffected) * 100 : 0
            ],
            [
                'range' => '5m+',
                'minDepth' => 5,
                'maxDepth' => null,
                'count' => (int)$row['bin_5_plus_count'],
                'percentage' => $totalAffected > 0 ? ($row['bin_5_plus_count'] / $totalAffected) * 100 : 0
            ]
        ];

        // Add exposure impact
        $scenario['impacts'][$row['exposure_type']] = [
            'layerType' => $row['exposure_type'],
            'totalFeatures' => (int)$row['total_features'],
            'affectedFeatures' => (int)$row['affected_features'],
            'maxDepth' => (float)$row['max_depth'],
            'depthBins' => $depthBins,
            'geoserverLayer' => "t3_{$row['return_period']}yrs_{$row['climate']}_{$row['maintenance']}_{$row['exposure_type']}",
            'workspace' => 'results',
            'geometryType' => getGeometryType($row['exposure_type'])
        ];

        // Count affected exposures
        if ($row['affected_features'] > $depthThreshold) {
            $scenario['totalAffectedExposures']++;
        }
    }

    // Calculate severity for each scenario
    foreach ($scenarioMap as &$scenario) {
        $scenario['severity'] = calculateSeverity($scenario['totalAffectedExposures']);
    }

    return array_values($scenarioMap);
}

/**
 * Get geometry type for exposure layer
 */
function getGeometryType($exposureType) {
    $pointLayers = ['BHU', 'Telecom_Towers'];
    $lineLayers = ['Electric_Grid', 'Railways', 'Roads'];
    $polygonLayers = ['Buildings', 'Built_up_Area', 'Cropped_Area', 'Settlements'];

    if (in_array($exposureType, $pointLayers)) return 'point';
    if (in_array($exposureType, $lineLayers)) return 'line';
    if (in_array($exposureType, $polygonLayers)) return 'polygon';
    return 'polygon';
}

/**
 * Calculate severity based on affected count
 */
function calculateSeverity($affectedCount) {
    if ($affectedCount <= 2) return 'low';
    if ($affectedCount <= 5) return 'medium';
    if ($affectedCount <= 7) return 'high';
    return 'extreme';
}
