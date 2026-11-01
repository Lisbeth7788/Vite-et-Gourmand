<?php

require_once __DIR__ . '/../../config/database.php';

$_SESSION = [];
session_destroy();

if (str_contains($_SERVER['HTTP_ACCEPT'] ?? '', 'text/html')) {
    header('Location: ../../index.html');
    exit;
}

jsonResponse(['message' => 'Vous êtes déconnecté.']);
