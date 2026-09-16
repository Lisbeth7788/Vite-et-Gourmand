<?php

require_once __DIR__ . '/../../config/database.php';

$data = requestData();
$missing = requiredFields($data, ['email', 'password']);
if ($missing) {
    jsonResponse(['error' => 'Adresse e-mail et mot de passe obligatoires.'], 400);
}

$query = $pdo->prepare('SELECT id, first_name, last_name, email, password_hash, role FROM users WHERE email = ?');
$query->execute([strtolower(trim($data['email']))]);
$user = $query->fetch();

if (!$user || !password_verify($data['password'], $user['password_hash'])) {
    jsonResponse(['error' => 'Adresse e-mail ou mot de passe incorrect.'], 401);
}

session_regenerate_id(true);
$profile = [
    'id' => $user['id'],
    'firstName' => $user['first_name'],
    'lastName' => $user['last_name'],
    'email' => $user['email'],
    'role' => $user['role']
];
$_SESSION['user'] = $profile;

jsonResponse([
    'user' => $profile
]);
