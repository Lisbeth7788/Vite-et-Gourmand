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
                error_log('Configuration MongoDB invalide.');
                $manager = null;
            }
        }
    }

    return $manager;
}

function configurationStatistiques(): array
{
    $base = getenv('MONGODB_DATABASE') ?: 'vite_et_gourmand';
    $collection = getenv('MONGODB_COLLECTION') ?: 'order_analytics';
    if (!in_array($collection, ['order_analytics', 'statistiques_commandes'], true)) {
        throw new RuntimeException('Collection de statistiques MongoDB non reconnue.');
    }

    return [
        'espace' => $base . '.' . $collection,
        'francais' => $collection === 'statistiques_commandes'
    ];
}

function recordOrderAnalytics(string $orderId, string $menuId, float $total, string $serviceDate): void
{
    $manager = analyticsManager();
    if (!$manager) {
        error_log('Statistiques MongoDB indisponibles : connexion non configurée.');
        return;
    }

    try {
        $configuration = configurationStatistiques();
        $classeOperations = 'MongoDB\\Driver\\BulkWrite';
        $classeDate = 'MongoDB\\BSON\\UTCDateTime';
        $operations = new $classeOperations();
        $document = $configuration['francais'] ? [
            'id_commande' => $orderId,
            'id_menu' => $menuId,
            'total' => $total,
            'date_prestation' => $serviceDate,
            'date_creation' => new $classeDate()
        ] : [
            'order_id' => $orderId,
            'menu_id' => $menuId,
            'total' => $total,
            'service_date' => $serviceDate,
            'created_at' => new $classeDate()
        ];
        $operations->insert($document);
        $manager->executeBulkWrite($configuration['espace'], $operations);
    } catch (Throwable $error) {
        error_log('Échec de l’écriture des statistiques MongoDB.');
    }
}
