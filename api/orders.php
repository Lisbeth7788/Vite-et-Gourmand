<?php

require_once __DIR__ . '/../config/database.php';
enforceRateLimit('orders', 10, 600);

$data = requestData();
$fields = ['first_name', 'last_name', 'email', 'phone', 'address', 'city', 'date', 'time', 'place', 'menu', 'people'];
if (requiredFields($data, $fields)) {
    jsonResponse(['error' => 'Tous les champs de commande sont obligatoires.'], 400);
}

if (!validEmail($data['email'])) {
    jsonResponse(['error' => 'Adresse e-mail invalide.'], 400);
}

$menuQuery = $pdo->prepare('SELECT id, name, price, minimum_people FROM menus WHERE id = ?');
$menuQuery->execute([$data['menu']]);
$menu = $menuQuery->fetch();
$people = (int) $data['people'];
$distance = (float) ($data['distance'] ?? 0);

if (!$menu || $people < (int) $menu['minimum_people'] || $distance < 0) {
    jsonResponse(['error' => 'Le menu ou le nombre de personnes est invalide.'], 400);
}

$isOutsideBordeaux = strtolower(trim($data['city'])) !== 'bordeaux';
if ($isOutsideBordeaux && $distance <= 0) {
    jsonResponse(['error' => 'La distance est obligatoire hors Bordeaux.'], 400);
}

$menuTotal = (float) $menu['price'] * $people;
$discount = $people >= (int) $menu['minimum_people'] + 5 ? $menuTotal * 0.1 : 0;
$delivery = $isOutsideBordeaux ? 5 + ($distance * 0.59) : 0;
$total = $menuTotal - $discount + $delivery;

$insert = $pdo->prepare(
    'INSERT INTO orders (
        id, first_name, last_name, email, phone, address, city, distance,
        service_date, service_time, delivery_place, menu_id, people,
        menu_total, discount, delivery, total, status
     ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
);
$id = bin2hex(random_bytes(16));
$insert->execute([
    $id,
    trim($data['first_name']),
    trim($data['last_name']),
    strtolower(trim($data['email'])),
    trim($data['phone']),
    trim($data['address']),
    trim($data['city']),
    $distance,
    $data['date'],
    $data['time'],
    trim($data['place']),
    $menu['id'],
    $people,
    $menuTotal,
    $discount,
    $delivery,
    $total,
    'pending'
]);

jsonResponse([
    'orderId' => $id,
    'totals' => compact('menuTotal', 'discount', 'delivery', 'total')
], 201);
