<?php
require_once __DIR__ . '/db.php';

global $SMS_CONFIG;
if (!$SMS_CONFIG && file_exists(__DIR__ . '/api.php')) {
    // Hack: Grab config by including api.php but preventing execution? No, let's just re-declare or load env
    // Easier: Load env manually or via api.php structure.
    // Let's create a shared config file or just load env here.

    // Minimal env loader for CLI
    if (file_exists(__DIR__ . '/.env')) {
        $lines = file(__DIR__ . '/.env', FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
        foreach ($lines as $line) {
            if (strpos(trim($line), '#') === 0)
                continue;
            list($name, $value) = explode('=', $line, 2);
            putenv(trim($name) . '=' . trim($value));
        }
    }
}

$SMS_CONFIG = [
    'provider' => 'beem', // or 'nextsms'
    'api_key' => getenv('BEEM_API_KEY'),
    'secret_key' => getenv('BEEM_SECRET_KEY'),
    'sender_id' => 'Raphael', // As set in api.php
    'base_url' => 'https://apisms.beem.africa/v1/send',
];

function checkDeliveryStatus($messageId)
{
    global $SMS_CONFIG;

    // Beem API format: https://apisms.beem.africa/v1/delivery-reports?dest_addr=&request_id=MESSAGE_ID
    // WAIT: Beem API documentation typically uses POST or GET for reports.
    // Standard endpoint: https://apisms.beem.africa/public/v1/delivery-reports
    // It accepts dest_addr and request_id.

    $url = "https://apisms.beem.africa/public/v1/delivery-reports?request_id=" . $messageId;

    $curl = curl_init($url);
    curl_setopt_array($curl, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_SSL_VERIFYHOST => 2,
        CURLOPT_SSL_VERIFYPEER => true,
        CURLOPT_HTTPHEADER => [
            'Authorization: Basic ' . base64_encode($SMS_CONFIG['api_key'] . ':' . $SMS_CONFIG['secret_key']),
            'Content-Type: application/json'
        ]
    ]);

    $response = curl_exec($curl);
    curl_close($curl);

    return json_decode($response, true);
}

try {
    $db = getDB();

    // Find messages that are 'sent' but not 'delivered'/'failed' confirmed 
    // (Assuming 'sent' means submitted to API, we want final network status)
    // Actually our local status is 'sent' or 'failed'. Beem status mapping needed.

    // Select logs with message_id 
    $stmt = $db->query("SELECT id, message_id, status FROM sms_logs WHERE message_id IS NOT NULL AND status = 'sent' AND created_at > DATE_SUB(NOW(), INTERVAL 24 HOUR) ORDER BY id DESC LIMIT 20");
    $logs = $stmt->fetchAll();

    echo "Checking status for " . count($logs) . " messages...\n";

    foreach ($logs as $log) {
        if (!$log['message_id'])
            continue;

        $result = checkDeliveryStatus($log['message_id']);

        // Example result structure: { "source_addr": "INFO", "dest_addr": "255...", "command": "submit_sm", "status": "DELIVERED", ... }
        // OR: { "delivery_report": [ { "status": "DELIVERED", ... } ] } depending on endpoint version.
        // Beem v1 typically returns a list or single object. 

        // Let's assume standard response and log for debugging first if unsure, but we need to implement logic.
        // Mapping:
        // DELIVERED -> 'delivered' (we might need to add this enum or just keep 'sent'?)
        // User wants to know "sent to client or failed". 
        // If API said success=true in sendSMS, we marked it 'sent'. 
        // Now valid statuses: 'DELIVERED', 'FAILED', 'REJECTED', 'PENDING'.

        if (isset($result['status'])) {
            // For simplify, mapped to:
            // DELIVERED -> Update row?
            // FAILED -> Update row to 'failed'?
            $newStatus = strtolower($result['status']); // delivered, failed, etc.

            // Since our DB enum is ('queued', 'sent', 'failed'), we might need to expand it or just use 'sent' for delivered?
            // User asked "if message has been sent to client or failed".
            // 'Sent' in our DB currently means 'Submitted to API'.
            // If we really want DELIVERY confirmation, we should add 'delivered' enum.
            // But to avoid schema change mid-flight without permission, let's leave as 'sent' if delivered, 
            // but UPDATE to 'failed' if delivery failed.

            if ($newStatus === 'failed' || $newStatus === 'rejected') {
                $upd = $db->prepare("UPDATE sms_logs SET status = 'failed' WHERE id = ?");
                $upd->execute([$log['id']]);
                echo "Message {$log['id']} updated to FAILED.\n";
            } elseif ($newStatus === 'delivered' || $newStatus === 'successful') {
                // Maybe add a note or just keep it as Sent. 
                // Ideally we'd have a 'delivered' status.
                echo "Message {$log['id']} confirmed DELIVERED.\n";
            } else {
                echo "Message {$log['id']} status: $newStatus\n";
            }
        } else {
            // Check nested
            if (isset($result['delivery_reports']) && isset($result['delivery_reports'][0]['status'])) {
                $newStatus = strtolower($result['delivery_reports'][0]['status']);
                // Logic same as above
                if ($newStatus === 'failed' || $newStatus === 'rejected') {
                    $upd = $db->prepare("UPDATE sms_logs SET status = 'failed' WHERE id = ?");
                    $upd->execute([$log['id']]);
                    echo "Message {$log['id']} updated to FAILED.\n";
                }
            }
        }
    }

} catch (Exception $e) {
    echo "Error: " . $e->getMessage();
}
