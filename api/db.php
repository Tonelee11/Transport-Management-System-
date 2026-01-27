<?php
// api/db.php - Database connection helper

function env($key, $default = null)
{
    $path = __DIR__ . '/.env';
    if (!file_exists($path))
        return $default;
    $contents = file_get_contents($path);
    $lines = explode("\n", $contents);
    foreach ($lines as $line) {
        $line = trim($line);
        if (empty($line) || strpos($line, '#') === 0)
            continue;
        list($k, $v) = explode('=', $line, 2);
        if (trim($k) === $key) {
            return trim($v);
        }
    }
    return $default;
}

function getDB()
{
    static $pdo = null;
    if ($pdo !== null)
        return $pdo;

    $host = env('DB_HOST', 'db');
    $dbname = env('DB_NAME', 'logistics');
    $user = env('DB_USER', 'root');
    $pass = env('DB_PASS', 'tw_pass');

    try {
        $dsn = "mysql:host={$host};dbname={$dbname};charset=utf8mb4";
        $options = [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
        ];
        $pdo = new PDO($dsn, $user, $pass, $options);

        // Synchronize PHP and DB timezones (East Africa Time)
        $pdo->exec("SET time_zone = '+03:00';");

        return $pdo;
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Database connection failed']);
        exit;
    }
}

/*
What this file does
- Reads database credentials from `.env` file
- Creates a PDO database connection
- Returns a reusable database connection
- Handles connection errors gracefully
*/