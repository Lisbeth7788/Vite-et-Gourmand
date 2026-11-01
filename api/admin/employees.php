<?php

require_once __DIR__ . '/../../config/database.php';
requireRole(['admin']);

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

if ($method === 'POST') {
    $data = requestData();
    if (requiredFields($data, ['first_name', 'last_name', 'phone', 'email', 'password'])) {
        jsonResponse(['error' => 'Tous les champs sont obligatoires.'], 400);
    }
    $email = strtolower(trim($data['email']));
    if (!validEmail($email)) {
        jsonResponse(['error' => 'Adresse e-mail invalide.'], 400);
    }
    if (!preg_match('/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/', (string) $data['password'])) {
        jsonResponse(['error' => 'Le mot de passe doit contenir 8 caractères minimum, une majuscule, une minuscule et un chiffre.'], 400);
    }
    $check = $pdo->prepare('SELECT id FROM users WHERE email = ?');
    $check->execute([$email]);
    if ($check->fetch()) {
        jsonResponse(['error' => 'Cette adresse e-mail est déjà utilisée.'], 409);
    }
    $jobs = ['patron', 'cuisinier', 'serveur', 'plongeur', 'livreur'];
    $job = strtolower(trim((string) ($data['job_title'] ?? '')));
    if (!in_array($job, $jobs, true)) {
        jsonResponse(['error' => 'Poste invalide.'], 400);
    }
    $insert = $pdo->prepare(
        "INSERT INTO users (id, first_name, last_name, phone, email, address, password_hash, role, job_title)
         VALUES (?, ?, ?, ?, ?, 'Vite et Gourmand', ?, 'employe', ?)"
    );
    $insert->execute([
        bin2hex(random_bytes(16)), trim($data['first_name']), trim($data['last_name']),
        trim($data['phone']), $email, password_hash((string) $data['password'], PASSWORD_DEFAULT), $job
    ]);
    jsonResponse(['message' => 'Compte employé créé.'], 201);
}

if ($method === 'PATCH') {
    $data = requestData();
    if (requiredFields($data, ['id']) || !isset($data['active'])) {
        jsonResponse(['error' => 'Employé ou état invalide.'], 400);
    }
    $update = $pdo->prepare("UPDATE users SET is_active = ? WHERE id = ? AND role = 'employe'");
    $update->execute([filter_var($data['active'], FILTER_VALIDATE_BOOLEAN) ? 1 : 0, trim($data['id'])]);
    jsonResponse(['message' => 'Compte employé mis à jour.']);
}

if ($method === 'DELETE') {
    $data = requestData();
    if (requiredFields($data, ['id'])) {
        jsonResponse(['error' => 'Employé invalide.'], 400);
    }
    $delete = $pdo->prepare("DELETE FROM users WHERE id = ? AND role = 'employe'");
    $delete->execute([trim($data['id'])]);
    jsonResponse(['message' => 'Compte employé supprimé.']);
}

if ($method !== 'GET') {
    jsonResponse(['error' => 'Méthode non autorisée.'], 405);
}

jsonResponse($pdo->query(
    "SELECT id, first_name, last_name, email, phone, job_title, is_active, created_at FROM users WHERE role = 'employe' ORDER BY created_at DESC"
)->fetchAll());
