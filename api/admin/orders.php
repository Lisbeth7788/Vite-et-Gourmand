<?php

require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../config/upstash.php';
requireRole(['admin', 'employe']);

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

if ($method === 'PATCH') {
    $data = requestData();
    $allowedStatuses = ['pending', 'accepted', 'preparing', 'delivery', 'delivered', 'material_return', 'completed', 'cancelled'];
    if (requiredFields($data, ['id', 'status']) || !in_array($data['status'], $allowedStatuses, true)) {
        jsonResponse(['error' => 'Commande ou statut invalide.'], 400);
    }

    if ($data['status'] === 'cancelled' && requiredFields($data, ['reason', 'contact_method'])) {
        jsonResponse(['error' => 'Le motif et le mode de contact sont obligatoires pour une annulation.'], 400);
    }

    $pdo->beginTransaction();
    try {
        $update = $pdo->prepare(
            'UPDATE orders SET status = ?, cancellation_reason = ?, cancellation_contact_method = ? WHERE id = ?'
        );
        $update->execute([
            $data['status'],
            $data['status'] === 'cancelled' ? trim($data['reason']) : null,
            $data['status'] === 'cancelled' ? trim($data['contact_method']) : null,
            trim($data['id'])
        ]);

        $history = $pdo->prepare('INSERT INTO order_status_history (order_id, status, note) VALUES (?, ?, ?)');
        $history->execute([trim($data['id']), $data['status'], trim((string) ($data['note'] ?? '')) ?: null]);
        $pdo->commit();
    } catch (Throwable $error) {
        $pdo->rollBack();
        jsonResponse(['error' => 'La mise à jour de la commande a échoué.'], 500);
    }

    synchroniserStatistiqueNoSQL($pdo, trim($data['id']));

    $client = $pdo->prepare('SELECT email, first_name FROM orders WHERE id = ?');
    $client->execute([trim($data['id'])]);
    $destinataire = $client->fetch();
    $messagesStatut = [
        'accepted' => 'Bonne nouvelle : votre réservation a été acceptée. Nous la préparons avec soin. Vous pouvez suivre son avancement depuis votre espace client.',
        'material_return' => "Du matériel vous a été prêté. S'il n'est pas rendu sous 10 jours ouvrés, 600 € de frais vous seront facturés (voir nos conditions générales de vente). Pour organiser le retour, contactez-nous.",
        'completed' => 'Votre réservation est terminée. Connectez-vous à votre compte pour donner votre avis (note de 1 à 5 et commentaire).'
    ];
    if ($destinataire && isset($messagesStatut[$data['status']])) {
        @mail($destinataire['email'], 'Votre réservation Vite et Gourmand', 'Bonjour ' . $destinataire['first_name'] . ",\n\n" . $messagesStatut[$data['status']] . "\n\nVite et Gourmand");
    }

    jsonResponse(['message' => 'Commande mise à jour.']);
}

if ($method !== 'GET') {
    jsonResponse(['error' => 'Méthode non autorisée.'], 405);
}

$conditions = [];
$parameters = [];
if (!empty($_GET['status'])) {
    $conditions[] = 'o.status = ?';
    $parameters[] = $_GET['status'];
}
if (!empty($_GET['paiement']) && in_array($_GET['paiement'], ['paye', 'impaye'], true)) {
    $conditions[] = 'o.statut_paiement = ?';
    $parameters[] = $_GET['paiement'];
}
if (!empty($_GET['email'])) {
    $conditions[] = 'o.email LIKE ?';
    $parameters[] = '%' . $_GET['email'] . '%';
}
$where = $conditions ? ' WHERE ' . implode(' AND ', $conditions) : '';

$query = $pdo->prepare(
    'SELECT id, first_name, last_name, email, city, service_date, service_time,
            phone, menu_id, people, total, status, statut_paiement, paye_le, cancellation_reason,
            cancellation_contact_method, created_at, updated_at
     FROM orders o' . $where . ' ORDER BY created_at DESC'
);
$query->execute($parameters);
$orders = $query->fetchAll();

jsonResponse($orders);
