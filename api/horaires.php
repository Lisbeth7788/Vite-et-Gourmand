<?php

require_once __DIR__ . '/../config/database.php';

$methode = $_SERVER['REQUEST_METHOD'] ?? 'GET';

if ($methode === 'PATCH') {
    requireRole(['admin', 'employe']);
    $data = requestData();
    $jour = (int) ($data['day_of_week'] ?? 0);
    $horaires = trim((string) ($data['opening_hours'] ?? ''));
    if ($jour < 1 || $jour > 7 || $horaires === '' || mb_strlen($horaires) > 120) {
        jsonResponse(['error' => 'Jour ou horaires invalides.'], 400);
    }
    $pdo->prepare('UPDATE business_hours SET opening_hours = ? WHERE day_of_week = ?')->execute([$horaires, $jour]);
    jsonResponse(['message' => 'Horaires enregistrés.']);
}

if ($methode !== 'GET') {
    jsonResponse(['error' => 'Méthode non autorisée.'], 405);
}

jsonResponse($pdo->query('SELECT day_of_week, day_name, opening_hours FROM business_hours ORDER BY day_of_week')->fetchAll());
