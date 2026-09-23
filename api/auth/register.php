<?php

require_once __DIR__ . '/../../config/database.php';
enforceRateLimit('register', 5, 3600);

$data = requestData();
$missing = requiredFields($data, ['first_name', 'last_name', 'phone', 'email', 'address', 'password']);
if ($missing) {
    jsonResponse(['error' => 'Tous les champs sont obligatoires.'], 400);
}

$email = strtolower(trim($data['email']));
if (!validEmail($email)) {
    jsonResponse(['error' => 'Adresse e-mail invalide.'], 400);
}

if (!preg_match('/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^\w\s]).{10,}$/', (string) $data['password'])) {
    jsonResponse(['error' => 'Le mot de passe doit contenir 10 caractères, une majuscule, une minuscule, un chiffre et un caractère spécial.'], 400);
}

$check = $pdo->prepare('SELECT id FROM users WHERE email = ?');
$check->execute([$email]);
if ($check->fetch()) {
    jsonResponse(['error' => 'Cette adresse e-mail est déjà utilisée.'], 409);
}

$id = bin2hex(random_bytes(16));
$passwordHash = password_hash($data['password'], PASSWORD_DEFAULT);
$insert = $pdo->prepare(
    'INSERT INTO users (id, first_name, last_name, phone, email, address, password_hash, role)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
);
$insert->execute([
    $id,
    trim($data['first_name']),
    trim($data['last_name']),
    trim($data['phone']),
    $email,
    trim($data['address']),
    $passwordHash,
    'client'
]);

session_regenerate_id(true);
$profile = [
    'id' => $id,
    'firstName' => trim($data['first_name']),
    'lastName' => trim($data['last_name']),
    'phone' => trim($data['phone']),
    'email' => $email,
    'address' => trim($data['address']),
    'role' => 'client'
];
$_SESSION['user'] = $profile;

jsonResponse([
    'user' => $profile
], 201);
