<?php
// Enhanced test_db.php - Comprehensive Diagnostic
header('Content-Type: application/json');

// Check environment variables first
$env_status = [
    'DB_HOST' => getenv('DB_HOST') ? 'SET' : 'MISSING',
    'DB_NAME' => getenv('DB_NAME') ? 'SET' : 'MISSING',
    'DB_USER' => getenv('DB_USER') ? 'SET' : 'MISSING',
    'DB_PASS' => getenv('DB_PASS') ? 'SET' : 'MISSING',
    'DB_SSL' => getenv('DB_SSL') ? 'SET' : 'MISSING',
];

require_once __DIR__ . '/api/db.php';

try {
    $db = getDB();

    // Check if users table exists
    $table_check = $db->query("SHOW TABLES LIKE 'users'")->fetch();

    $response = [
        'success' => true,
        'message' => 'Connected to database server!',
        'environment' => $env_status,
        'schema' => [
            'users_table_exists' => (bool) $table_check,
            'current_db' => $db->query("SELECT DATABASE()")->fetchColumn()
        ],
        'db_time' => $db->query("SELECT NOW()")->fetchColumn(),
        'php_version' => PHP_VERSION
    ];

    if (!$table_check) {
        $response['hint'] = 'Connection works, but your tables are missing! Please run the init.sql script in your TiDB console.';
    }

    echo json_encode($response, JSON_PRETTY_PRINT);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage(),
        'environment' => $env_status,
        'hint' => 'Check your Render environment variables. Ensure DB_HOST is your TiDB hostname (e.g. gateway01.us-west-2.prod.aws.tidbcloud.com).'
    ], JSON_PRETTY_PRINT);
}
