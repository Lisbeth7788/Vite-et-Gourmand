<?php

require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../config/maj_menus.php';
requireRole(['admin']);

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    jsonResponse(['error' => 'Méthode non autorisée.'], 405);
}

try {
    appliquerMenusTraiteur($pdo);
    jsonResponse(['message' => 'Les menus de traiteur ont été mis à jour et les anciennes commandes de test ont été supprimées.']);
} catch (Throwable $erreur) {
    error_log('Mise à jour des menus impossible : ' . $erreur->getMessage());
    jsonResponse(['error' => 'La mise à jour des menus a échoué.'], 500);
}
