<?php

require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../config/statistiques.php';
require_once __DIR__ . '/../../config/upstash.php';
requireRole(['admin']);

try {
    $configurationNoSQL = configurationUpstash();
} catch (RuntimeException $error) {
    error_log('Configuration du service NoSQL invalide : ' . $error->getMessage());
    jsonResponse(['error' => 'Configuration des statistiques indisponible. ' . $error->getMessage()], 503);
}

if ($configurationNoSQL === null && (getenv('APP_ENV') ?: 'local') === 'production') {
    jsonResponse(['error' => 'Le service NoSQL des statistiques n’est pas configuré.'], 503);
}

try {
    if ($configurationNoSQL === null) {
        $statistiques = lireStatistiquesCommandes($pdo, $_GET);
    } else {
        initialiserStatistiquesNoSQL($pdo);
        $statistiques = lireStatistiquesNoSQL($_GET);
    }
} catch (InvalidArgumentException $error) {
    jsonResponse(['error' => $error->getMessage()], 400);
} catch (PDOException | RuntimeException | JsonException $error) {
    error_log('Lecture des statistiques impossible : ' . get_class($error) . ' : ' . $error->getMessage());
    jsonResponse(['error' => 'Lecture des statistiques impossible.'], 503);
}

jsonResponse($statistiques);
