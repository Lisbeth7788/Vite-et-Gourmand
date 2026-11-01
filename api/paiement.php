<?php

require_once __DIR__ . '/../config/database.php';
requireRole(['client', 'employe', 'admin']);
enforceRateLimit('paiement', 20, 600, 'user-' . $_SESSION['user']['id']);

$donnees = requestData();
if (requiredFields($donnees, ['commande_id'])) {
    jsonResponse(['error' => 'Commande manquante.'], 400);
}

// Paiement simulé : à remplacer par l'appel au prestataire (Stripe, PayPal...) en production.
$identifiant = trim((string) $donnees['commande_id']);
$miseAJour = $pdo->prepare(
    "UPDATE orders SET statut_paiement = 'paye', paye_le = NOW()
     WHERE id = ? AND user_id = ? AND status = 'pending' AND statut_paiement = 'impaye'"
);
$miseAJour->execute([$identifiant, $_SESSION['user']['id']]);
if ($miseAJour->rowCount() !== 1) {
    jsonResponse(['error' => 'Commande introuvable ou déjà payée.'], 409);
}

$historique = $pdo->prepare("INSERT INTO order_status_history (order_id, status, note) VALUES (?, 'pending', 'Paiement en ligne reçu')");
$historique->execute([$identifiant]);

jsonResponse(['paye' => true, 'message' => 'Paiement accepté.']);
