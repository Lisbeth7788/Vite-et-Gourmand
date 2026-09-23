<?php

require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../config/mongodb.php';
requireRole(['admin']);

$manager = analyticsManager();
if (!$manager) {
    jsonResponse(['error' => 'MongoDB n’est pas configurée.'], 503);
}

$match = [];
if (!empty($_GET['menu'])) {
    $match['menu_id'] = $_GET['menu'];
}
if (!empty($_GET['from'])) {
    $match['service_date']['$gte'] = $_GET['from'];
}
if (!empty($_GET['to'])) {
    $match['service_date']['$lte'] = $_GET['to'];
}

$classeRequeteMongo = 'MongoDB\\Driver\\Query';
$query = new $classeRequeteMongo($match);
$grouped = [];
try {
    $cursor = $manager->executeQuery('vite_et_gourmand.order_analytics', $query);
    foreach ($cursor as $row) {
        $menu = (string) $row->menu_id;
        if (!isset($grouped[$menu])) {
            $grouped[$menu] = ['menu' => $menu, 'orders' => 0, 'revenue' => 0];
        }
        $grouped[$menu]['orders'] += 1;
        $grouped[$menu]['revenue'] += (float) $row->total;
    }
} catch (Throwable $error) {
    jsonResponse(['error' => 'Lecture des statistiques impossible.'], 503);
}
$statistics = array_values($grouped);
usort($statistics, fn ($first, $second) => $second['orders'] <=> $first['orders']);
jsonResponse($statistics);
