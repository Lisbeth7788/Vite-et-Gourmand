<?php

require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../config/upstash.php';
requireRole(['client', 'employe', 'admin']);
require_once __DIR__ . '/../../config/tarifs.php';

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
        $jourSemaine = null;
        $ville = trim((string) ($data['city'] ?? ''));
        $adresse = trim((string) ($data['address'] ?? ''));
        $distance = estBordeaux($ville) ? 0.0 : (float) ($data['distance'] ?? 0);
        if ($adresse === '' || $ville === '' || (!estBordeaux($ville) && ($distance <= 0 || $distance > 500))) {
            jsonResponse(['error' => 'Adresse, ville et distance (hors Bordeaux) obligatoires.'], 400);
        }

        $pdo->beginTransaction();
        $commande = $pdo->prepare("SELECT o.id, o.menu_id, m.price, m.minimum_people FROM orders o JOIN menus m ON m.id = o.menu_id WHERE o.id = ? AND o.user_id = ? AND o.status = 'pending' FOR UPDATE");
        $commande->execute([trim($data['id']), $_SESSION['user']['id']]);
        $ligne = $commande->fetch();
        if (!$ligne) {
            $pdo->rollBack();
            jsonResponse(['error' => 'Cette réservation ne peut plus être modifiée.'], 409);
        }
        if ($people < (int) $ligne['minimum_people']) {
            $pdo->rollBack();
            jsonResponse(['error' => 'Le nombre de personnes est inférieur au minimum du menu.'], 400);
        }
        $tarifs = calculerTarifs((float) $ligne['price'], (int) $ligne['minimum_people'], $people, $ville, $distance);
        $maj = $pdo->prepare('UPDATE orders SET service_date = ?, service_time = ?, people = ?, phone = ?, address = ?, city = ?, distance = ?, menu_total = ?, discount = ?, delivery = ?, total = ? WHERE id = ?');
        $maj->execute([$date, $time, $people, $telephone, $adresse, $ville, $distance, $tarifs['menuTotal'], $tarifs['discount'], $tarifs['delivery'], $tarifs['total'], $ligne['id']]);
        $historiqueModif = $pdo->prepare("INSERT INTO order_status_history (order_id, status, note) VALUES (?, 'pending', 'Réservation modifiée par le client')");
        $historiqueModif->execute([$ligne['id']]);
        $pdo->commit();
        synchroniserStatistiqueNoSQL($pdo, (string) $ligne['id']);
        jsonResponse(['message' => 'Réservation modifiée.']);
    }

    $pdo->beginTransaction();
    try {
        $query = $pdo->prepare(
            "UPDATE orders SET status = 'cancelled', cancellation_reason = 'Annulation demandée par le client', cancellation_contact_method = 'espace client'
             WHERE id = ? AND user_id = ? AND status = 'pending'"
        );
        $query->execute([trim($data['id']), $_SESSION['user']['id']]);
        if (!$query->rowCount()) {
            $pdo->rollBack();
            jsonResponse(['error' => 'Cette commande ne peut plus être annulée.'], 409);
        }

        $history = $pdo->prepare("INSERT INTO order_status_history (order_id, status, note) VALUES (?, 'cancelled', 'Annulation demandée par le client')");
        $history->execute([trim($data['id'])]);
        $stock = $pdo->prepare('UPDATE menus SET stock = stock + 1 WHERE id = (SELECT menu_id FROM orders WHERE id = ?)');
        $stock->execute([trim($data['id'])]);
        $pdo->commit();
    } catch (PDOException $error) {
        $pdo->rollBack();
        error_log('Annulation de la réservation impossible : ' . $error->getMessage());
        jsonResponse(['error' => 'L’annulation de la commande a échoué.'], 500);
    }
    synchroniserStatistiqueNoSQL($pdo, trim($data['id']));
    jsonResponse(['message' => 'Commande annulée.']);
}

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'GET') {
    jsonResponse(['error' => 'Méthode non autorisée.'], 405);
}

$query = $pdo->prepare(
    'SELECT o.id, o.menu_id, m.name AS menu_name, o.people, o.phone, o.address, o.city, o.distance, o.total, o.status, o.statut_paiement, o.service_date, o.service_time, o.created_at,
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
