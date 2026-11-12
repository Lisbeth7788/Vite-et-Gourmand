<?php

require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../config/upstash.php';
$user = requireRole(['client', 'employe', 'admin']);

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'PATCH') {
    $data = requestData();
    if (requiredFields($data, ['first_name', 'last_name', 'phone', 'email', 'address']) || !validEmail($data['email'])) {
        jsonResponse(['error' => 'Les informations du profil sont invalides.'], 400);
    }

    $email = strtolower(trim($data['email']));
    $check = $pdo->prepare('SELECT id FROM users WHERE email = ? AND id <> ?');
    $check->execute([$email, $user['id']]);
    if ($check->fetch()) {
        jsonResponse(['error' => 'Cette adresse e-mail est déjà utilisée.'], 409);
    }

    $update = $pdo->prepare(
        'UPDATE users SET first_name = ?, last_name = ?, phone = ?, email = ?, address = ? WHERE id = ?'
    );
    $update->execute([
        trim($data['first_name']), trim($data['last_name']), trim($data['phone']),
        $email, trim($data['address']), $user['id']
    ]);
    $_SESSION['user'] = array_merge($_SESSION['user'], [
        'firstName' => trim($data['first_name']),
        'lastName' => trim($data['last_name']),
        'phone' => trim($data['phone']),
        'email' => $email,
        'address' => trim($data['address'])
    ]);
    jsonResponse(['message' => 'Profil mis à jour.', 'user' => $_SESSION['user']]);
}

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'DELETE') {
    if ($user['role'] !== 'client') {
        jsonResponse(['error' => 'Seuls les comptes clients peuvent être supprimés ici.'], 403);
    }
    $data = requestData();
    $hashQuery = $pdo->prepare('SELECT password_hash FROM users WHERE id = ?');
    $hashQuery->execute([$user['id']]);
    $hash = $hashQuery->fetchColumn();
    if (empty($data['password']) || !is_string($hash) || !password_verify((string) $data['password'], $hash)) {
        jsonResponse(['error' => 'Mot de passe incorrect.'], 403);
    }

    $pdo->beginTransaction();
    try {
        // Les réservations en attente sont annulées et leur stock est restitué.
        $pending = $pdo->prepare("SELECT id, menu_id FROM orders WHERE user_id = ? AND status = 'pending'");
        $pending->execute([$user['id']]);
        $commandesEnAttente = $pending->fetchAll(PDO::FETCH_ASSOC);
        $restore = $pdo->prepare('UPDATE menus SET stock = stock + 1 WHERE id = ?');
        $history = $pdo->prepare("INSERT INTO order_status_history (order_id, status, note) VALUES (?, 'cancelled', 'Compte supprimé par le client')");
        foreach ($commandesEnAttente as $order) {
            $restore->execute([$order['menu_id']]);
            $history->execute([$order['id']]);
        }
        $pdo->prepare("UPDATE orders SET status = 'cancelled', cancellation_reason = 'Compte supprimé par le client', cancellation_contact_method = 'espace client' WHERE user_id = ? AND status = 'pending'")
            ->execute([$user['id']]);
        // Les montants sont conservés pour la comptabilité, les données personnelles sont effacées.
        $pdo->prepare("UPDATE orders SET first_name = 'Compte', last_name = 'supprimé', email = 'supprime@invalid', phone = '', address = '', city = '' WHERE user_id = ?")
            ->execute([$user['id']]);
        $pdo->prepare('DELETE FROM users WHERE id = ?')->execute([$user['id']]);
        $pdo->commit();
    } catch (Throwable $error) {
        $pdo->rollBack();
        jsonResponse(['error' => 'Le compte n’a pas pu être supprimé.'], 500);
    }

    foreach ($commandesEnAttente as $commande) {
        synchroniserStatistiqueNoSQL($pdo, (string) $commande['id']);
    }

    $_SESSION = [];
    session_destroy();
    jsonResponse(['message' => 'Votre compte a été supprimé.']);
}

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'GET') {
    jsonResponse(['error' => 'Méthode non autorisée.'], 405);
}

$query = $pdo->prepare('SELECT first_name, last_name, phone, email, address FROM users WHERE id = ?');
$query->execute([$user['id']]);
jsonResponse($query->fetch());
