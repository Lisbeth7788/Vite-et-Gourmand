<?php

require_once __DIR__ . '/../../config/database.php';
requireRole(['client', 'employe', 'admin']);

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'PATCH') {
    $data = requestData();
    if (requiredFields($data, ['id'])) {
        jsonResponse(['error' => 'Identifiant de commande obligatoire.'], 400);
    }

    // Modification : tout peut changer sauf le menu, tant que la réservation n'est pas acceptée.
    if (isset($data['date'])) {
        $people = (int) ($data['people'] ?? 0);
        $date = (string) $data['date'];
        $time = (string) ($data['time'] ?? '');
        $telephone = trim((string) ($data['phone'] ?? ''));
        if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $date) || !preg_match('/^\d{2}:\d{2}$/', $time) || $telephone === '' || $date < date('Y-m-d')) {
            jsonResponse(['error' => 'Date, heure ou téléphone invalide.'], 400);
        }
        $jourSemaine = (int) date('w', strtotime($date . ' 12:00:00'));
        $plages = in_array($jourSemaine, [0, 6], true) ? [['10:30', '15:00'], ['18:00', '22:00']] : [['11:30', '14:00'], ['18:00', '22:00']];
        $horaireValide = false;
        foreach ($plages as [$debut, $fin]) {
            if ($time >= $debut && $time < $fin) {
                $horaireValide = true;
            }
        }
        if (!$horaireValide) {
            jsonResponse(['error' => 'Le créneau choisi est en dehors des horaires d’ouverture.'], 400);
        }

        $pdo->beginTransaction();
        $commande = $pdo->prepare("SELECT o.id, o.menu_id, m.price, m.minimum_people FROM orders o JOIN menus m ON m.id = o.menu_id WHERE o.id = ? AND o.user_id = ? AND o.status = 'pending' FOR UPDATE");
        $commande->execute([trim($data['id']), $_SESSION['user']['id']]);
        $ligne = $commande->fetch();
        if (!$ligne) {
            $pdo->rollBack();
            jsonResponse(['error' => 'Cette réservation ne peut plus être modifiée.'], 409);
        }
        if ($people < (int) $ligne['minimum_people'] || $people > 10) {
            $pdo->rollBack();
            jsonResponse(['error' => 'Nombre de personnes invalide (minimum du menu, 10 maximum).'], 400);
        }
        $midi = $time < '16:00';
        $capacite = $pdo->prepare("SELECT COALESCE(SUM(people), 0) FROM orders WHERE service_date = ? AND status <> 'cancelled' AND id <> ? AND (service_time < '16:00:00') = ? FOR UPDATE");
        $capacite->execute([$date, $ligne['id'], $midi ? 1 : 0]);
        if ((int) $capacite->fetchColumn() + $people > 60) {
            $pdo->rollBack();
            jsonResponse(['error' => 'Ce service est complet pour cette date.'], 409);
        }
        $total = (float) $ligne['price'] * $people;
        $maj = $pdo->prepare('UPDATE orders SET service_date = ?, service_time = ?, people = ?, phone = ?, menu_total = ?, total = ? WHERE id = ?');
        $maj->execute([$date, $time, $people, $telephone, $total, $total, $ligne['id']]);
        $historiqueModif = $pdo->prepare("INSERT INTO order_status_history (order_id, status, note) VALUES (?, 'pending', 'Réservation modifiée par le client')");
        $historiqueModif->execute([$ligne['id']]);
        $pdo->commit();
        jsonResponse(['message' => 'Réservation modifiée.']);
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
    $stock = $pdo->prepare('UPDATE menus SET stock = stock + 1 WHERE id = (SELECT menu_id FROM orders WHERE id = ?)');
    $stock->execute([trim($data['id'])]);
    jsonResponse(['message' => 'Commande annulée.']);
}

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'GET') {
    jsonResponse(['error' => 'Méthode non autorisée.'], 405);
}

$query = $pdo->prepare(
    'SELECT o.id, o.menu_id, m.name AS menu_name, o.people, o.phone, o.total, o.status, o.statut_paiement, o.service_date, o.service_time, o.created_at,
            EXISTS (SELECT 1 FROM reviews r WHERE r.order_id = o.id) AS has_review
     FROM orders o LEFT JOIN menus m ON m.id = o.menu_id WHERE o.user_id = ? ORDER BY o.created_at DESC'
);
$query->execute([$_SESSION['user']['id']]);
$orders = $query->fetchAll();
$historyQuery = $pdo->prepare('SELECT order_id, status, note, created_at FROM order_status_history WHERE order_id = ? ORDER BY created_at');
foreach ($orders as &$order) {
    $historyQuery->execute([$order['id']]);
    $order['history'] = $historyQuery->fetchAll();
}
jsonResponse($orders);
