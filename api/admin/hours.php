<?php

require_once __DIR__ . '/../../config/database.php';
requireRole(['admin', 'employe']);

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'POST') {
    jsonResponse(['error' => 'Méthode non autorisée.'], 405);
}

$data = requestData();
if (!isset($data['hours']) || !is_array($data['hours'])) {
    jsonResponse(['error' => 'Les horaires sont obligatoires.'], 400);
}

$update = $pdo->prepare('UPDATE business_hours SET opening_hours = ? WHERE day_of_week = ?');
foreach ($data['hours'] as $hour) {
    if (!isset($hour['day_of_week'], $hour['opening_hours'])) {
        jsonResponse(['error' => 'Horaire invalide.'], 400);
    }
    $update->execute([trim((string) $hour['opening_hours']), (int) $hour['day_of_week']]);
}
jsonResponse(['message' => 'Horaires mis à jour.']);
