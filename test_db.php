<?php
// test_db.php - Diagnostic script for database connection
header('Content-Type: application/json');

require_once __DIR__ . '/api/db.php';

try {
    $db = getDB();
    echo json_encode([
        'success' => true,
        'message' => 'Database connection successful!',
        'db_time' => $db->query("SELECT NOW()")->fetchColumn()
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage(),
        'hint' => 'Check your Render environment variables: DB_HOST, DB_NAME, DB_USER, DB_PASS'
    ]);
}
