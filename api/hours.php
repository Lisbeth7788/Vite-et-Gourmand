<?php

require_once __DIR__ . '/../config/database.php';

$hours = $pdo->query('SELECT day_of_week, day_name, opening_hours FROM business_hours ORDER BY day_of_week')->fetchAll();
jsonResponse($hours);
