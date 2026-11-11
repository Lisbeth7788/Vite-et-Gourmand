<?php

require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../config/mongodb.php';
requireRole(['admin']);

$manager = analyticsManager();
if (!$manager) {
    jsonResponse(['error' => 'MongoDB n’est pas configurée.'], 503);
}

$grouped = [];
try {
    $configuration = configurationStatistiques();
    $champMenu = $configuration['francais'] ? 'id_menu' : 'menu_id';
    $champDate = $configuration['francais'] ? 'date_prestation' : 'service_date';
    $match = [];
    if (!empty($_GET['menu'])) {
        $match[$champMenu] = $_GET['menu'];
    }
    if (!empty($_GET['from'])) {
        $match[$champDate]['$gte'] = $_GET['from'];
    }
    if (!empty($_GET['to'])) {
        $match[$champDate]['$lte'] = $_GET['to'];
    }
    $classeRequeteMongo = 'MongoDB\\Driver\\Query';
    $query = new $classeRequeteMongo($match);
    $cursor = $manager->executeQuery($configuration['espace'], $query);
    foreach ($cursor as $row) {
        $menu = (string) $row->$champMenu;
        if (!isset($grouped[$menu])) {
            $grouped[$menu] = ['menu' => $menu, 'orders' => 0, 'revenue' => 0];
        }
        $grouped[$menu]['orders'] += 1;
        $grouped[$menu]['revenue'] += (float) $row->total;
    }
} catch (Throwable $error) {
    error_log('Lecture des statistiques MongoDB impossible.');
    jsonResponse(['error' => 'Lecture des statistiques impossible.'], 503);
}
$statistics = array_values($grouped);
usort($statistics, fn ($first, $second) => $second['orders'] <=> $first['orders']);
jsonResponse($statistics);
