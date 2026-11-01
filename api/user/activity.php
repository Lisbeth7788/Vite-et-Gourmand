<?php

require_once __DIR__ . '/../../config/database.php';
requireRole(['client', 'employe', 'admin']);

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'GET') {
    jsonResponse(['error' => 'Méthode non autorisée.'], 405);
}

$userId = $_SESSION['user']['id'];
$query = $pdo->prepare(
    "(SELECT created_at AS event_at, 'compte' AS type, 'Création de votre compte' AS detail, NULL AS amount
      FROM users WHERE id = ?)
     UNION ALL
     (SELECT created_at, 'reservation',
             CONCAT('Réservation pour le ', service_date, ' à ', SUBSTRING(service_time, 1, 5), ' · ', people, ' personne(s)'), total
      FROM orders WHERE user_id = ?)
     UNION ALL
     (SELECT paye_le, 'paiement', CONCAT('Paiement de la réservation du ', service_date), total
      FROM orders WHERE user_id = ? AND statut_paiement = 'paye' AND paye_le IS NOT NULL)
     UNION ALL
     (SELECT h.created_at, 'suivi', CONCAT('Statut de la réservation du ', o.service_date, ' : ', h.status), NULL
      FROM order_status_history h JOIN orders o ON o.id = h.order_id
      WHERE o.user_id = ? AND (h.note IS NULL OR h.note <> 'Commande reçue'))
     UNION ALL
     (SELECT created_at, 'avis', CONCAT('Avis déposé : ', rating, '/5'), NULL FROM reviews WHERE user_id = ?)
     ORDER BY event_at DESC LIMIT 100"
);
$query->execute([$userId, $userId, $userId, $userId, $userId]);
jsonResponse($query->fetchAll());
