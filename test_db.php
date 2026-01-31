<?php
// Enhanced test_db.php - Comprehensive Diagnostic
header('Content-Type: application/json');
error_reporting(E_ALL);
ini_set('display_errors', '1');

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
    // Basic diagnostic info
    $diagnostics = [
        'php_version' => PHP_VERSION,
        'pdo_mysql_enabled' => extension_loaded('pdo_mysql'),
        'environment' => $env_status,
    ];

    $db = getDB();

    // Check if users table exists
    $table_check = $db->query("SHOW TABLES LIKE 'users'")->fetch();

    $response = [
        'success' => true,
        'message' => 'Connected to database server!',
        'diagnostics' => $diagnostics,
        'schema' => [
            'users_table_exists' => (bool) $table_check,
            'current_db' => $db->query("SELECT DATABASE()")->fetchColumn()
        ],
        'db_time' => $db->query("SELECT NOW()")->fetchColumn()
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
        'diagnostics' => $diagnostics ?? ['pdo_mysql_enabled' => extension_loaded('pdo_mysql')],
        'hint' => 'Check your Render environment variables. Ensure DB_HOST is your TiDB hostname and DB_SSL is true.'
    ], JSON_PRETTY_PRINT);
}
