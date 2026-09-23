<?php

require_once __DIR__ . '/../../config/database.php';

if (!isset($_SESSION['user'])) {
    jsonResponse(['authenticated' => false], 401);
}

jsonResponse([
    'authenticated' => true,
    'user' => $_SESSION['user']
]);
