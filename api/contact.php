<?php

require_once __DIR__ . '/../config/database.php';
enforceRateLimit('contact', 10, 600);

$data = requestData();
if (requiredFields($data, ['title', 'description', 'email'])) {
    jsonResponse(['error' => 'Tous les champs du message sont obligatoires.'], 400);
}

if (!validEmail($data['email'])) {
    jsonResponse(['error' => 'Adresse e-mail invalide.'], 400);
}

$insert = $pdo->prepare('INSERT INTO messages (title, description, email) VALUES (?, ?, ?)');
$insert->execute([
    trim($data['title']),
    trim($data['description']),
    strtolower(trim($data['email']))
]);

jsonResponse(['message' => 'Votre demande a bien été enregistrée.'], 201);
