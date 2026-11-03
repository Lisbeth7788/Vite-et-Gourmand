<?php

require_once __DIR__ . '/../config/database.php';

$methode = $_SERVER['REQUEST_METHOD'] ?? 'GET';

if ($methode === 'PATCH') {
    requireRole(['admin', 'employe']);
    $data = requestData();
    $horaires = trim((string) ($data['opening_hours'] ?? ''));
    $jours = isset($data['days']) && is_array($data['days'])
        ? array_map('intval', $data['days'])
        : [(int) ($data['day_of_week'] ?? 0)];
    foreach ($jours as $jour) {
        if ($jour < 1 || $jour > 7) {
            jsonResponse(['error' => 'Jour ou horaires invalides.'], 400);
        }
    }
    if ($jours === [] || $horaires === '' || mb_strlen($horaires) > 120) {
        jsonResponse(['error' => 'Jour ou horaires invalides.'], 400);
    }
    $requete = $pdo->prepare('UPDATE business_hours SET opening_hours = ? WHERE day_of_week = ?');
    foreach ($jours as $jour) {
        $requete->execute([$horaires, $jour]);
    }
    jsonResponse(['message' => 'Horaires enregistrés.']);
}

if ($methode !== 'GET') {
    jsonResponse(['error' => 'Méthode non autorisée.'], 405);
}

jsonResponse($pdo->query('SELECT day_of_week, day_name, opening_hours FROM business_hours ORDER BY day_of_week')->fetchAll());
