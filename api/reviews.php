<?php

require_once __DIR__ . '/../config/database.php';

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'GET') {
    $reviews = $pdo->query(
        "SELECT rating, comment, created_at FROM reviews WHERE status = 'approved' ORDER BY created_at DESC"
    )->fetchAll();
    jsonResponse($reviews);
}

requireRole(['client', 'employe', 'admin']);
$data = requestData();
$comment = trim((string) ($data['comment'] ?? $data['message'] ?? ''));
if ($comment === '' || !isset($data['rating'])) {
    jsonResponse(['error' => 'Note et commentaire obligatoires.'], 400);
}

$rating = (int) $data['rating'];
if ($rating < 1 || $rating > 5 || strlen($comment) > 220) {
    jsonResponse(['error' => 'La note ou le commentaire est invalide.'], 400);
}

$order = $pdo->prepare(
    "SELECT o.id FROM orders o
     WHERE o.user_id = ? AND o.status = 'completed'
       AND NOT EXISTS (SELECT 1 FROM reviews r WHERE r.order_id = o.id)
     ORDER BY o.created_at DESC LIMIT 1"
);
$order->execute([$_SESSION['user']['id']]);
$orderId = $order->fetchColumn();
if (!$orderId) {
    jsonResponse(['error' => 'Un avis est possible après une réservation terminée, une seule fois par réservation.'], 403);
}

$insert = $pdo->prepare('INSERT INTO reviews (user_id, order_id, rating, comment) VALUES (?, ?, ?, ?)');
$insert->execute([$_SESSION['user']['id'], $orderId, $rating, $comment]);
jsonResponse(['message' => 'Merci ! Votre avis sera visible après validation.'], 201);
