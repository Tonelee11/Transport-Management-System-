<?php
// health.php - Simple health check for Render
http_response_code(200);
header('Content-Type: application/json');
echo json_encode([
    'status' => 'ok',
    'timestamp' => date('Y-m-d H:i:s'),
    'message' => 'Web server is running'
]);
