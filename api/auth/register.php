<?php

require_once __DIR__ . '/../../config/database.php';

$data = requestData();
$missing = requiredFields($data, ['first_name', 'last_name', 'phone', 'email', 'address', 'password']);
if ($missing) {
    jsonResponse(['error' => 'Tous les champs sont obligatoires.'], 400);
}

$email = strtolower(trim($data['email']));
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

$profile = [
    'id' => $id,
    'firstName' => trim($data['first_name']),
    'lastName' => trim($data['last_name']),
    'email' => $email,
    'role' => 'client'
];
$_SESSION['user'] = $profile;

jsonResponse([
    'user' => $profile
], 201);
