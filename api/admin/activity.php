<?php

require_once __DIR__ . '/../../config/database.php';
requireRole(['admin']);

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'GET') {
    jsonResponse(['error' => 'Méthode non autorisée.'], 405);
}

$events = $pdo->query(
    "(SELECT created_at AS event_at, 'inscription' AS type, CONCAT(first_name, ' ', last_name) AS client, email,
             'Création du compte client' AS detail, NULL AS amount
      FROM users WHERE role = 'client')
     UNION ALL
     (SELECT created_at, 'reservation', CONCAT(first_name, ' ', last_name), email,
             CONCAT('Réservation pour le ', service_date, ' à ', SUBSTRING(service_time, 1, 5), ' · ', people, ' personne(s)'), total
      FROM orders)
     UNION ALL
     (SELECT paye_le, 'paiement', CONCAT(first_name, ' ', last_name), email,
             CONCAT('Paiement de la réservation du ', service_date), total
      FROM orders WHERE statut_paiement = 'paye' AND paye_le IS NOT NULL)
     UNION ALL
     (SELECT h.created_at, 'statut', CONCAT(o.first_name, ' ', o.last_name), o.email,
             CONCAT('Statut : ', h.status, IF(h.note IS NULL OR h.note = '', '', CONCAT(' - ', h.note))), NULL
      FROM order_status_history h JOIN orders o ON o.id = h.order_id WHERE h.note IS NULL OR h.note <> 'Commande reçue')
     UNION ALL
     (SELECT r.created_at, 'avis', COALESCE(CONCAT(u.first_name, ' ', u.last_name), 'Client'), u.email,
             CONCAT('Avis déposé : ', r.rating, '/5'), NULL
      FROM reviews r LEFT JOIN users u ON u.id = r.user_id)
     ORDER BY event_at DESC LIMIT 300"
)->fetchAll();

$summary = $pdo->query(
    "SELECT COALESCE(SUM(CASE WHEN statut_paiement = 'paye' THEN total END), 0) AS total_paid,
            COUNT(CASE WHEN statut_paiement = 'paye' THEN 1 END) AS payments,
            COUNT(*) AS reservations
     FROM orders WHERE status <> 'cancelled'"
)->fetch();

$days = $pdo->query(
    "SELECT service_date, COUNT(*) AS orders, SUM(people) AS people, SUM(total) AS total FROM orders
     WHERE status <> 'cancelled' AND service_date >= CURDATE()
     GROUP BY service_date ORDER BY service_date LIMIT 120"
)->fetchAll();

jsonResponse(['summary' => $summary, 'events' => $events, 'days' => $days]);
