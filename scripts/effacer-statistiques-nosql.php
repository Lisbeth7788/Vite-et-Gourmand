<?php

if (PHP_SAPI !== 'cli') {
    http_response_code(404);
    exit;
}

require_once __DIR__ . '/../config/upstash.php';

try {
    $nombre = effacerStatistiquesNoSQL();
} catch (RuntimeException | JsonException $erreur) {
    fwrite(STDERR, 'Effacement des statistiques NoSQL impossible : ' . $erreur->getMessage() . PHP_EOL);
    exit(1);
}

echo $nombre . " document(s) NoSQL effacé(s).\n";
