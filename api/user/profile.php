<?php

require_once __DIR__ . '/../../config/database.php';
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

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'GET') {
    jsonResponse(['error' => 'Méthode non autorisée.'], 405);
}

$query = $pdo->prepare('SELECT first_name, last_name, phone, email, address FROM users WHERE id = ?');
$query->execute([$user['id']]);
jsonResponse($query->fetch());
