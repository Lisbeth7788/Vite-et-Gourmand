<?php

require_once __DIR__ . '/../config/mongodb.php';

$error = new RuntimeException(
    'Connexion échouée : mongodb://utilisateur:secret@mongo.example.test/base?password=secret2'
);
$details = detailsErreurMongoDB($error);

if (str_contains($details, 'secret') || str_contains($details, 'mongo.example.test')) {
    throw new RuntimeException('Les détails MongoDB sensibles doivent être masqués.');
}
if (!str_contains($details, '[URI MongoDB masquée]') || !str_contains($details, 'RuntimeException')) {
    throw new RuntimeException('Les détails de diagnostic non sensibles doivent être conservés.');
}

echo "Détails MongoDB sensibles masqués.\n";
