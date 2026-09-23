<?php

require_once __DIR__ . '/../../config/database.php';
requireRole(['admin', 'employe']);

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
if ($method === 'PATCH') {
    $data = requestData();
    if (requiredFields($data, ['id', 'status']) || !in_array($data['status'], ['approved', 'rejected'], true)) {
        jsonResponse(['error' => 'Avis ou décision invalide.'], 400);
    }
    $query = $pdo->prepare('UPDATE reviews SET status = ? WHERE id = ?');
    $query->execute([$data['status'], (int) $data['id']]);
    jsonResponse(['message' => 'Avis modéré.']);
}

if ($method !== 'GET') {
    jsonResponse(['error' => 'Méthode non autorisée.'], 405);
}

$reviews = $pdo->query(
    'SELECT id, rating, comment, status, created_at FROM reviews ORDER BY created_at DESC'
)->fetchAll();
jsonResponse($reviews);
