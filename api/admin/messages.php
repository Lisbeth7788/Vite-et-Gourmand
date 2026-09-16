<?php

require_once __DIR__ . '/../../config/database.php';
requireRole(['admin']);

$messages = $pdo->query(
    'SELECT id, title, description, email, created_at FROM messages ORDER BY created_at DESC'
)->fetchAll();

jsonResponse($messages);
