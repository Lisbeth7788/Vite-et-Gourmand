<?php

require_once __DIR__ . '/../config/database.php';

$menuId = trim((string) ($_GET['id'] ?? ''));
if ($menuId !== '') {
    $query = $pdo->prepare(
        'SELECT id, name, price, minimum_people AS minimum, theme, regime, description,
                image_path, conditions_text, stock
         FROM menus WHERE id = ?'
    );
    $query->execute([$menuId]);
    $menu = $query->fetch();
    if (!$menu) {
        jsonResponse(['error' => 'Menu introuvable.'], 404);
    }

    $dishes = $pdo->prepare(
        'SELECT dish_type, name, allergens FROM menu_dishes WHERE menu_id = ? ORDER BY position'
    );
    $dishes->execute([$menuId]);
    $menu['dishes'] = $dishes->fetchAll();
    jsonResponse($menu);
}

$menus = $pdo->query(
    'SELECT id, name, price, minimum_people AS minimum, theme, regime, description,
            image_path, conditions_text, stock
     FROM menus ORDER BY name'
)->fetchAll();

jsonResponse($menus);
