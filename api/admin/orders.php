<?php

require_once __DIR__ . '/../../config/database.php';
requireRole(['admin']);

$orders = $pdo->query(
    'SELECT id, first_name, last_name, email, city, service_date, service_time,
            menu_id, people, total, status, created_at
     FROM orders ORDER BY created_at DESC'
)->fetchAll();

jsonResponse($orders);
