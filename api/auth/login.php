<?php

require_once __DIR__ . '/../../config/database.php';
enforceRateLimit('login', 10, 900);

$data = requestData();
$missing = requiredFields($data, ['email', 'password']);
if ($missing) {
    jsonResponse(['error' => 'Adresse e-mail et mot de passe obligatoires.'], 400);
}

$identifiant = strtr(mb_strtolower(trim($data['email'])), ['é' => 'e', 'è' => 'e', 'ê' => 'e']);
$query = $pdo->prepare('SELECT id, first_name, last_name, phone, email, address, password_hash, role, is_active FROM users WHERE email = ?');
$query->execute([$identifiant]);
$user = $query->fetch();

// Le compte employé partagé accepte le mot de passe en majuscules ou en minuscules.
$motDePasse = $user && $user['email'] === 'employe' ? mb_strtoupper($data['password']) : $data['password'];

if (!$user || !$user['is_active'] || !password_verify($motDePasse, $user['password_hash'])) {
    jsonResponse(['error' => 'Adresse e-mail ou mot de passe incorrect.'], 401);
}

// Chaque espace de connexion n'accepte que son type de compte.
$space = $data['space'] ?? 'client';
if (!in_array($space, ['client', 'employe', 'admin'], true) || ($user['role'] !== $space && $user['role'] !== 'admin')) {
    jsonResponse(['error' => 'Ce compte ne correspond pas à cet espace de connexion.'], 403);
}

session_regenerate_id(true);
$profile = [
    'id' => $user['id'],
    'firstName' => $user['first_name'],
    'lastName' => $user['last_name'],
    'phone' => $user['phone'],
    'email' => $user['email'],
    'address' => $user['address'],
    'role' => $user['role']
];
$_SESSION['user'] = $profile;

jsonResponse([
    'user' => $profile
]);
