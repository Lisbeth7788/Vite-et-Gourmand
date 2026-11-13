<?php

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/avis.php';

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'GET') {
    $reviews = $pdo->query(
        "SELECT rating, comment, created_at FROM reviews WHERE status = 'approved' ORDER BY created_at DESC"
    )->fetchAll();
    jsonResponse($reviews);
}

requireRole(['client', 'employe', 'admin']);
$data = requestData();
$reservation = null;
if (array_key_exists('order_id', $data)) {
    if (!is_string($data['order_id']) || trim($data['order_id']) === '') {
        jsonResponse(['error' => 'Réservation invalide.'], 400);
    }
    $reservation = trim($data['order_id']);
}
$comment = trim((string) ($data['comment'] ?? $data['message'] ?? ''));
if ($comment === '' || !isset($data['rating'])) {
    jsonResponse(['error' => 'Note et commentaire obligatoires.'], 400);
}

$rating = (int) $data['rating'];
if ($rating < 1 || $rating > 5 || strlen($comment) > 220) {
    jsonResponse(['error' => 'La note ou le commentaire est invalide.'], 400);
}

$pdo->beginTransaction();
try {
    enregistrerAvis($pdo, (string) $_SESSION['user']['id'], $reservation, $rating, $comment);
    $pdo->commit();
} catch (DomainException $error) {
    $pdo->rollBack();
    jsonResponse(['error' => $error->getMessage()], 403);
} catch (PDOException $error) {
    $pdo->rollBack();
    error_log('Enregistrement de l’avis impossible : ' . $error->getMessage());
    jsonResponse(['error' => 'Votre avis n’a pas pu être enregistré.'], 500);
}
jsonResponse(['message' => 'Merci ! Votre avis sera visible après validation.'], 201);
