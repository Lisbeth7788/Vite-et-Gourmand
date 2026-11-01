<?php

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/mongodb.php';
require_once __DIR__ . '/../config/tarifs.php';
requireRole(['client', 'employe', 'admin']);
enforceRateLimit('orders', 10, 600, 'user-' . $_SESSION['user']['id']);

$data = requestData();
$fields = ['first_name', 'last_name', 'email', 'phone', 'address', 'city', 'date', 'time', 'menu', 'people'];
if (requiredFields($data, $fields)) {
    jsonResponse(['error' => 'Tous les champs de commande sont obligatoires.'], 400);
}

$ville = trim((string) $data['city']);
$distance = estBordeaux($ville) ? 0.0 : (float) ($data['distance'] ?? 0);
if (!estBordeaux($ville) && ($distance <= 0 || $distance > 500)) {
    jsonResponse(['error' => 'Indiquez la distance en kilomètres entre Bordeaux et le lieu de livraison.'], 400);
}

if (!validEmail($data['email'])) {
    jsonResponse(['error' => 'Adresse e-mail invalide.'], 400);
}

$pdo->beginTransaction();
$menuQuery = $pdo->prepare('SELECT id, name, price, minimum_people, stock FROM menus WHERE id = ? FOR UPDATE');
$menuQuery->execute([$data['menu']]);
$menu = $menuQuery->fetch();
$people = (int) $data['people'];

if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', (string) $data['date']) || !preg_match('/^\d{2}:\d{2}$/', (string) $data['time']) || $data['date'] < date('Y-m-d')) {
    $pdo->rollBack();
    jsonResponse(['error' => 'Date ou heure de livraison invalide.'], 400);
}

if (!$menu || (int) $menu['stock'] <= 0 || $people < (int) $menu['minimum_people']) {
    $pdo->rollBack();
    jsonResponse(['error' => 'Le menu est indisponible ou le nombre de personnes est inférieur au minimum du menu.'], 400);
}

$tarifs = calculerTarifs((float) $menu['price'], (int) $menu['minimum_people'], $people, $ville, $distance);
$menuTotal = $tarifs['menuTotal'];
$discount = $tarifs['discount'];
$delivery = $tarifs['delivery'];
$total = $tarifs['total'];
$lieu = trim((string) ($data['delivery_place'] ?? '')) ?: 'Adresse de livraison';

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
        $ville,
        $distance,
        $data['date'],
        $data['time'],
        $lieu,
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

@mail($data['email'], 'Confirmation de votre réservation', "Bonjour,\n\nNous avons bien reçu votre commande pour le {$data['date']} à {$data['time']} (" . (int) $people . " personnes).\nMenu : " . number_format($menuTotal, 2, ',', ' ') . " €\nRemise : -" . number_format($discount, 2, ',', ' ') . " €\nLivraison : " . number_format($delivery, 2, ',', ' ') . " €\nTotal : " . number_format($total, 2, ',', ' ') . " €.\n\nMerci de votre confiance, Vite et Gourmand.");

jsonResponse([
    'orderId' => $id,
    'totals' => compact('menuTotal', 'discount', 'delivery', 'total')
], 201);
