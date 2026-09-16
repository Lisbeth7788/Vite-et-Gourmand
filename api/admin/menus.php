<?php

require_once __DIR__ . '/../../config/database.php';
requireRole(['admin']);

$menus = $pdo->query(
    'SELECT id, name, price, minimum_people, theme, regime, description, stock
     FROM menus ORDER BY name'
)->fetchAll();

jsonResponse($menus);
