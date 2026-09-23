<?php

require_once __DIR__ . '/../../config/database.php';
requireRole(['admin', 'employe']);

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
if ($method === 'GET') {
    $menuId = trim((string) ($_GET['menu_id'] ?? ''));
    if (!$menuId) {
        jsonResponse(['error' => 'Menu obligatoire.'], 400);
    }
    $query = $pdo->prepare('SELECT id, dish_type, name, allergens, position FROM menu_dishes WHERE menu_id = ? ORDER BY position');
    $query->execute([$menuId]);
    jsonResponse($query->fetchAll());
}

if ($method === 'POST') {
    $data = requestData();
    if (requiredFields($data, ['menu_id', 'dish_type', 'name', 'allergens', 'position'])) {
        jsonResponse(['error' => 'Menu, type, nom, allergènes et position sont obligatoires.'], 400);
    }
    $query = $pdo->prepare(
        'INSERT INTO menu_dishes (menu_id, dish_type, name, allergens, position)
         VALUES (?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE name = VALUES(name), allergens = VALUES(allergens)'
    );
    $query->execute([
        trim($data['menu_id']), trim($data['dish_type']), trim($data['name']),
        trim($data['allergens']), (int) $data['position']
    ]);
    jsonResponse(['message' => 'Plat enregistré.'], 201);
}

if ($method === 'DELETE') {
    $data = requestData();
    if (requiredFields($data, ['id'])) {
        jsonResponse(['error' => 'Identifiant du plat obligatoire.'], 400);
    }
    $query = $pdo->prepare('DELETE FROM menu_dishes WHERE id = ?');
    $query->execute([(int) $data['id']]);
    jsonResponse(['message' => 'Plat supprimé.']);
}

jsonResponse(['error' => 'Méthode non autorisée.'], 405);
