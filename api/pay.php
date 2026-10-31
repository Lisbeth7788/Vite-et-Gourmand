<?php

require_once __DIR__ . '/../config/database.php';
requireRole(['client', 'employe', 'admin']);
enforceRateLimit('pay', 20, 600);

$data = requestData();
if (requiredFields($data, ['order_id'])) {
    jsonResponse(['error' => 'Commande manquante.'], 400);
}

// Paiement simulé : à remplacer par l'appel au prestataire (Stripe, PayPal...) en production.
$update = $pdo->prepare(
    "UPDATE orders SET payment_status = 'paid', paid_at = NOW()
     WHERE id = ? AND user_id = ? AND status = 'pending' AND payment_status = 'unpaid'"
);
$update->execute([trim((string) $data['order_id']), $_SESSION['user']['id']]);
if ($update->rowCount() !== 1) {
    jsonResponse(['error' => 'Commande introuvable ou déjà payée.'], 409);
}

$history = $pdo->prepare("INSERT INTO order_status_history (order_id, status, note) VALUES (?, 'pending', 'Paiement en ligne reçu')");
$history->execute([trim((string) $data['order_id'])]);

jsonResponse(['paid' => true, 'message' => 'Paiement accepté.']);
