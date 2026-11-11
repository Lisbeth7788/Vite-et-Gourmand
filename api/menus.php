<?php

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/menu_images.php';

try {
    assurerTableImages($pdo);
    actualiserPhotosMenus($pdo);
} catch (Throwable $erreur) {
    error_log('Mise à jour des photos des menus impossible : ' . $erreur->getMessage());
    jsonResponse(['error' => 'Les menus sont temporairement indisponibles.'], 500);
}

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
    $menu['images'] = imagesDuMenu($pdo, $menuId, (string) $menu['image_path']);
    jsonResponse($menu);
}

$menus = $pdo->query(
    'SELECT id, name, price, minimum_people AS minimum, theme, regime, description,
            image_path, conditions_text, stock
     FROM menus ORDER BY name'
)->fetchAll();

jsonResponse($menus);
