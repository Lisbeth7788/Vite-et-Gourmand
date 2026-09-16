<?php

require_once __DIR__ . '/../../config/database.php';
enforceRateLimit('reset', 5, 3600);

$data = requestData();
if (requiredFields($data, ['email'])) {
    jsonResponse(['error' => 'Adresse e-mail obligatoire.'], 400);
}

jsonResponse(['message' => 'Si un compte correspond à cette adresse, un lien sera envoyé.']);
