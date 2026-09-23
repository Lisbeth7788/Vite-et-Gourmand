<?php

require_once __DIR__ . '/../../config/database.php';
requireRole(['admin', 'employe']);

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

if ($method === 'POST') {
    $data = requestData();
    $missing = requiredFields($data, ['id', 'name', 'price', 'minimum_people', 'theme', 'regime', 'description', 'stock']);
    if ($missing) {
        jsonResponse(['error' => 'Tous les champs du menu sont obligatoires.'], 400);
    }

    $query = $pdo->prepare(
        'INSERT INTO menus (id, name, price, minimum_people, theme, regime, description, stock)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE name = VALUES(name), price = VALUES(price),
         minimum_people = VALUES(minimum_people), theme = VALUES(theme),
         regime = VALUES(regime), description = VALUES(description), stock = VALUES(stock)'
    );
    $query->execute([
        trim($data['id']), trim($data['name']), (float) $data['price'],
        (int) $data['minimum_people'], trim($data['theme']), trim($data['regime']),
        trim($data['description']), (int) $data['stock']
    ]);
    jsonResponse(['message' => 'Menu enregistré.'], 201);
}

if ($method === 'DELETE') {
    $data = requestData();
    if (requiredFields($data, ['id'])) {
        jsonResponse(['error' => 'Identifiant du menu obligatoire.'], 400);
    }

    $query = $pdo->prepare('DELETE FROM menus WHERE id = ?');
    $query->execute([trim($data['id'])]);
    jsonResponse(['message' => 'Menu supprimé.']);
}

if ($method !== 'GET') {
    jsonResponse(['error' => 'Méthode non autorisée.'], 405);
}

$menus = $pdo->query(
    'SELECT id, name, price, minimum_people, theme, regime, description, stock
     FROM menus ORDER BY name'
)->fetchAll();

jsonResponse($menus);
