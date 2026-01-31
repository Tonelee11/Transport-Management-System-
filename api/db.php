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
    $port = 3306;

    // Handle host:port format and set default port for TiDB
    if (strpos($host, ':') !== false) {
        list($host, $port) = explode(':', $host, 2);
    } elseif (strpos($host, 'tidbcloud.com') !== false) {
        $port = 4000;
    }

    try {
        $dsn = "mysql:host={$host};port={$port};dbname={$dbname};charset=utf8mb4";
        $options = [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
            PDO::ATTR_TIMEOUT => 10,
        ];

        // Automatic SSL for TiDB Cloud or if DB_SSL is true
        if (strpos($host, 'tidbcloud.com') !== false || env('DB_SSL', 'false') === 'true') {
            $options[PDO::MYSQL_ATTR_SSL_VERIFY_SERVER_CERT] = false;
            // PDO::MYSQL_ATTR_SSL_CA could be added here if needed, 
            // but VERIFY_SERVER_CERT=false is usually sufficient for TiDB Cloud on Render
        }

        $pdo = new PDO($dsn, $user, $pass, $options);

        // Synchronize PHP and DB timezones (East Africa Time)
        $pdo->exec("SET time_zone = '+03:00';");

        return $pdo;
    } catch (PDOException $e) {
        // Provide more context for debugging
        $errorMsg = "DB Connection Failed: " . $e->getMessage() . " (Host: $host, Port: $port)";
        throw new Exception($errorMsg);
    }
}

/*
What this file does
- Reads database credentials from `.env` file
- Creates a PDO database connection
- Returns a reusable database connection
- Handles connection errors gracefully
*/