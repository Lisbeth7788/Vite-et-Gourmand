<?php

$autoload = __DIR__ . '/../vendor/autoload.php';
if (is_file($autoload)) {
    require_once $autoload;
}

function analyticsManager()
{
    static $manager;
    static $initialized = false;

    if (!$initialized) {
        $initialized = true;
        $uri = getenv('MONGODB_URI') ?: 'mongodb://127.0.0.1:27017';
        if (extension_loaded('mongodb') && $uri) {
            try {
                $classeGestionnaire = 'MongoDB\\Driver\\Manager';
                $manager = new $classeGestionnaire($uri);
            } catch (Throwable $error) {
                $manager = null;
            }
        }
    }

    return $manager;
}

function recordOrderAnalytics(string $orderId, string $menuId, float $total, string $serviceDate): void
{
    $manager = analyticsManager();
    if (!$manager) {
        return;
    }

    try {
        $classeOperations = 'MongoDB\\Driver\\BulkWrite';
        $classeDate = 'MongoDB\\BSON\\UTCDateTime';
        $operations = new $classeOperations();
        $operations->insert([
            'order_id' => $orderId,
            'menu_id' => $menuId,
            'total' => $total,
            'service_date' => $serviceDate,
            'created_at' => new $classeDate()
        ]);
        $manager->executeBulkWrite('vite_et_gourmand.order_analytics', $operations);
    } catch (Throwable $error) {
        error_log('Echec de l’écriture des statistiques MongoDB : ' . $error->getMessage());
    }
}
