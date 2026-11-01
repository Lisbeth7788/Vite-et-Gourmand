<?php

require_once __DIR__ . '/../../config/database.php';

if (!isset($_SESSION['user'])) {
    jsonResponse(['authenticated' => false], 401);
}

if (!isset($_SESSION['user']['accountRole'])) {
    $query = $pdo->prepare('SELECT role FROM users WHERE id = ?');
    $query->execute([$_SESSION['user']['id']]);
    $accountRole = $query->fetchColumn();
    if (is_string($accountRole)) {
        $_SESSION['user']['accountRole'] = $accountRole;
    }
}

jsonResponse([
    'authenticated' => true,
    'user' => $_SESSION['user'],
    'canSwitchExperience' => ($_SESSION['user']['accountRole'] ?? $_SESSION['user']['role']) === 'admin'
]);
