<?php

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/mongodb.php';
requireRole(['client', 'employe', 'admin']);
enforceRateLimit('orders', 10, 600);

$data = requestData();
$fields = ['first_name', 'last_name', 'email', 'phone', 'address', 'city', 'date', 'time', 'place', 'menu', 'people'];
if (requiredFields($data, $fields)) {
    jsonResponse(['error' => 'Tous les champs de commande sont obligatoires.'], 400);
}

if (!validEmail($data['email'])) {
    jsonResponse(['error' => 'Adresse e-mail invalide.'], 400);
}

$pdo->beginTransaction();
$menuQuery = $pdo->prepare('SELECT id, name, price, minimum_people, stock FROM menus WHERE id = ? FOR UPDATE');
$menuQuery->execute([$data['menu']]);
$menu = $menuQuery->fetch();
$people = (int) $data['people'];
$distance = (float) ($data['distance'] ?? 0);

if (!$menu || (int) $menu['stock'] <= 0 || $people < (int) $menu['minimum_people'] || $distance < 0) {
    $pdo->rollBack();
    jsonResponse(['error' => 'Le menu ou le nombre de personnes est invalide.'], 400);
}

$isOutsideBordeaux = strtolower(trim($data['city'])) !== 'bordeaux';
if ($isOutsideBordeaux && $distance <= 0) {
    $pdo->rollBack();
    jsonResponse(['error' => 'La distance est obligatoire hors Bordeaux.'], 400);
}

$menuTotal = (float) $menu['price'] * $people;
$discount = $people >= (int) $menu['minimum_people'] + 5 ? $menuTotal * 0.1 : 0;
$delivery = $isOutsideBordeaux ? 5 + ($distance * 0.59) : 0;
$total = $menuTotal - $discount + $delivery;

$insert = $pdo->prepare(
    'INSERT INTO orders (
        id, user_id, first_name, last_name, email, phone, address, city, distance,
        service_date, service_time, delivery_place, menu_id, people,
        menu_total, discount, delivery, total, status
     ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
);
$id = bin2hex(random_bytes(16));
try {
    $insert->execute([
        $id,
        $_SESSION['user']['id'],
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
    $stockUpdate = $pdo->prepare('UPDATE menus SET stock = stock - 1 WHERE id = ? AND stock > 0');
    $stockUpdate->execute([$menu['id']]);
    if ($stockUpdate->rowCount() !== 1) {
        throw new RuntimeException('Stock indisponible.');
    }
    $history = $pdo->prepare("INSERT INTO order_status_history (order_id, status, note) VALUES (?, 'pending', 'Commande reçue')");
    $history->execute([$id]);
    recordOrderAnalytics($id, $menu['id'], $total, $data['date']);
    $pdo->commit();
} catch (Throwable $error) {
    $pdo->rollBack();
    jsonResponse(['error' => 'La commande n’a pas pu être enregistrée.'], 500);
}

jsonResponse([
    'orderId' => $id,
    'totals' => compact('menuTotal', 'discount', 'delivery', 'total')
], 201);
