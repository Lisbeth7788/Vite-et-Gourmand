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
if (requiredFields($data, ['order_id', 'rating', 'comment'])) {
    jsonResponse(['error' => 'Commande, note et commentaire obligatoires.'], 400);
}

$rating = (int) $data['rating'];
if ($rating < 1 || $rating > 5 || strlen(trim($data['comment'])) > 220) {
    jsonResponse(['error' => 'La note ou le commentaire est invalide.'], 400);
}

$order = $pdo->prepare("SELECT id FROM orders WHERE id = ? AND user_id = ? AND status = 'completed'");
$order->execute([trim($data['order_id']), $_SESSION['user']['id']]);
if (!$order->fetch()) {
    jsonResponse(['error' => 'Un avis est possible uniquement après une commande terminée.'], 403);
}

$insert = $pdo->prepare('INSERT INTO reviews (user_id, order_id, rating, comment) VALUES (?, ?, ?, ?)');
$insert->execute([$_SESSION['user']['id'], trim($data['order_id']), $rating, trim($data['comment'])]);
jsonResponse(['message' => 'Votre avis sera visible après validation.'], 201);
