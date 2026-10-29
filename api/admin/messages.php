<?php

require_once __DIR__ . '/../../config/database.php';
requireRole(['admin']);

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'DELETE') {
    $data = requestData();
    if (requiredFields($data, ['id'])) {
        jsonResponse(['error' => 'Message invalide.'], 400);
    }
    $delete = $pdo->prepare('DELETE FROM messages WHERE id = ?');
    $delete->execute([(int) $data['id']]);
    jsonResponse(['message' => 'Message supprimé.']);
}

$messages = $pdo->query(
    'SELECT id, title, description, email, created_at FROM messages ORDER BY created_at DESC'
)->fetchAll();

jsonResponse($messages);
