<?php
// api/db.php - Database connection helper

function env($key, $default = null)
{
    // Try system environment variables first (Render behavior)
    $val = getenv($key);
    if ($val !== false)
        return $val;

    $path = __DIR__ . '/.env';
    if (!file_exists($path))
        return $default;
    $contents = file_get_contents($path);
    $lines = explode("\n", $contents);
    foreach ($lines as $line) {
        $line = trim($line);
        if (empty($line) || strpos($line, '#') === 0)
            continue;
        $parts = explode('=', $line, 2);
        if (count($parts) === 2 && trim($parts[0]) === $key) {
            return trim($parts[1]);
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

    // TiDB Cloud often uses port 4000. If no port is specified, append it.
    if (strpos($host, 'tidbcloud.com') !== false && strpos($host, ':') === false) {
        $host .= ':4000';
    }

    try {
        $dsn = "mysql:host={$host};dbname={$dbname};charset=utf8mb4";
        $options = [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
            PDO::ATTR_TIMEOUT => 10, // 10 seconds timeout
        ];

        // Automatic SSL for TiDB Cloud or if DB_SSL is true
        if (strpos($host, 'tidbcloud.com') !== false || env('DB_SSL', 'false') === 'true') {
            $options[PDO::MYSQL_ATTR_SSL_VERIFY_SERVER_CERT] = false;
            // Force SSL even if not explicitly requested via env for TiDB
        }

        $pdo = new PDO($dsn, $user, $pass, $options);

        // Synchronize PHP and DB timezones (East Africa Time)
        $pdo->exec("SET time_zone = '+03:00';");

        return $pdo;
    } catch (PDOException $e) {
        // Re-throw the exception so callers can see the actual error message
        throw $e;
    }
}

/*
What this file does
- Reads database credentials from `.env` file
- Creates a PDO database connection
- Returns a reusable database connection
- Handles connection errors gracefully
*/