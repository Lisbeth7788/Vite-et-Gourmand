<?php

require_once __DIR__ . '/../../config/database.php';
requireRole(['admin']);

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

if ($method === 'POST') {
    $data = requestData();
    if (requiredFields($data, ['email', 'password'])) {
        jsonResponse(['error' => 'E-mail et mot de passe obligatoires.'], 400);
    }

    $email = strtolower(trim($data['email']));
    if (!validEmail($email) || strlen((string) $data['password']) < 10) {
        jsonResponse(['error' => 'E-mail invalide ou mot de passe trop court.'], 400);
    }

    $check = $pdo->prepare('SELECT id FROM users WHERE email = ?');
    $check->execute([$email]);
    if ($check->fetch()) {
        jsonResponse(['error' => 'Cette adresse e-mail est déjà utilisée.'], 409);
    }

    $id = bin2hex(random_bytes(16));
    $insert = $pdo->prepare(
        'INSERT INTO users (id, first_name, last_name, phone, email, address, password_hash, role, is_active)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, TRUE)'
    );
    $insert->execute([
        $id,
        trim((string) ($data['first_name'] ?? 'Employé')),
        trim((string) ($data['last_name'] ?? '')),
        trim((string) ($data['phone'] ?? '')),
        $email,
        trim((string) ($data['address'] ?? '')),
        password_hash($data['password'], PASSWORD_DEFAULT),
        'employe'
    ]);

    $subject = 'Votre compte employé Vite et Gourmand';
    $message = "Un compte employé a été créé pour vous. Contactez l'administrateur afin d'obtenir votre mot de passe.";
    @mail($email, $subject, $message);
    jsonResponse(['message' => 'Compte employé créé.'], 201);
}

if ($method === 'PATCH') {
    $data = requestData();
    if (requiredFields($data, ['id', 'is_active'])) {
        jsonResponse(['error' => 'Identifiant et état du compte obligatoires.'], 400);
    }

    $query = $pdo->prepare("UPDATE users SET is_active = ? WHERE id = ? AND role = 'employe'");
    $query->execute([(bool) $data['is_active'], trim($data['id'])]);
    jsonResponse(['message' => 'Compte employé mis à jour.']);
}

if ($method !== 'GET') {
    jsonResponse(['error' => 'Méthode non autorisée.'], 405);
}

$employees = $pdo->query(
    "SELECT id, email, first_name, last_name, is_active, created_at
     FROM users WHERE role = 'employe' ORDER BY email"
)->fetchAll();
jsonResponse($employees);
