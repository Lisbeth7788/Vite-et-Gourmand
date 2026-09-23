<?php

require_once __DIR__ . '/../../config/database.php';
requireRole(['client', 'employe', 'admin']);

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'PATCH') {
    $data = requestData();
    if (requiredFields($data, ['id'])) {
        jsonResponse(['error' => 'Identifiant de commande obligatoire.'], 400);
    }

    $query = $pdo->prepare(
        "UPDATE orders SET status = 'cancelled', cancellation_reason = 'Annulation demandée par le client', cancellation_contact_method = 'espace client'
         WHERE id = ? AND user_id = ? AND status = 'pending'"
    );
    $query->execute([trim($data['id']), $_SESSION['user']['id']]);
    if (!$query->rowCount()) {
        jsonResponse(['error' => 'Cette commande ne peut plus être annulée.'], 409);
    }

    $history = $pdo->prepare("INSERT INTO order_status_history (order_id, status, note) VALUES (?, 'cancelled', 'Annulation demandée par le client')");
    $history->execute([trim($data['id'])]);
    jsonResponse(['message' => 'Commande annulée.']);
}

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'GET') {
    jsonResponse(['error' => 'Méthode non autorisée.'], 405);
}

$query = $pdo->prepare(
    'SELECT id, menu_id, people, total, status, service_date, service_time, created_at
     FROM orders WHERE user_id = ? ORDER BY created_at DESC'
);
$query->execute([$_SESSION['user']['id']]);
$orders = $query->fetchAll();
$historyQuery = $pdo->prepare('SELECT order_id, status, note, created_at FROM order_status_history WHERE order_id = ? ORDER BY created_at');
foreach ($orders as &$order) {
    $historyQuery->execute([$order['id']]);
    $order['history'] = $historyQuery->fetchAll();
}
jsonResponse($orders);
