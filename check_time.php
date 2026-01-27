<?php
require_once '/var/www/html/api/db.php';
date_default_timezone_set('Africa/Dar_es_Salaam');

echo "PHP Time: " . date('Y-m-d H:i:s') . "\n";

$db = getDB();
$stmt = $db->query("SELECT NOW() as db_time");
$row = $stmt->fetch();
echo "DB Time:  " . $row['db_time'] . "\n";
?>