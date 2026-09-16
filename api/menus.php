<?php

require_once __DIR__ . '/../config/database.php';

$menus = $pdo->query(
    'SELECT id, name, price, minimum_people AS minimum, theme, regime, description, stock
     FROM menus ORDER BY name'
)->fetchAll();

jsonResponse($menus);
