<?php

require_once __DIR__ . '/../../config/database.php';

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'POST') {
    jsonResponse(['error' => 'Méthode non autorisée.'], 405);
}

if (!isset($_SESSION['user'])) {
    jsonResponse(['error' => 'Connexion requise.'], 401);
}

if (!isset($_SESSION['user']['accountRole'])) {
    $query = $pdo->prepare('SELECT role FROM users WHERE id = ?');
    $query->execute([$_SESSION['user']['id']]);
    $accountRole = $query->fetchColumn();
    if (is_string($accountRole)) {
        $_SESSION['user']['accountRole'] = $accountRole;
    }
}

if (($_SESSION['user']['accountRole'] ?? null) !== 'admin') {
    jsonResponse(['error' => 'Seul un compte administrateur peut changer d’expérience.'], 403);
}

$data = requestData();
if (!isset($data['space']) || !in_array($data['space'], ['client', 'employe', 'admin'], true)) {
    jsonResponse(['error' => 'Espace invalide.'], 400);
}

$_SESSION['user']['role'] = $data['space'];
session_regenerate_id(true);

jsonResponse([
    'message' => 'Espace actif modifié.',
    'user' => $_SESSION['user']
]);
