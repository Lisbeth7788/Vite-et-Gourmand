<?php

require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../config/statistiques.php';
requireRole(['admin']);

try {
    $statistiques = lireStatistiquesCommandes($pdo, $_GET);
} catch (InvalidArgumentException $error) {
    jsonResponse(['error' => $error->getMessage()], 400);
} catch (PDOException $error) {
    error_log('Lecture des statistiques MySQL impossible : ' . $error->getMessage());
    jsonResponse(['error' => 'Lecture des statistiques impossible.'], 503);
}

jsonResponse($statistiques);
