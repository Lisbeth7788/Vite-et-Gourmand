<?php

require_once __DIR__ . '/../../config/database.php';
requireRole(['admin']);

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    jsonResponse(['error' => 'Méthode non autorisée.'], 405);
}

function executerFichierSql(PDO $pdo, string $chemin): int
{
    $contenu = file_get_contents($chemin);
    if ($contenu === false) {
        throw new RuntimeException('Fichier SQL introuvable : ' . basename($chemin));
    }
    $contenu = preg_replace('/^\s*--.*$/m', '', $contenu);
    $nombre = 0;
    foreach (preg_split('/;[ \t]*\R/', $contenu) as $requete) {
        $requete = trim($requete);
        if ($requete === '') {
            continue;
        }
        $pdo->exec($requete);
        $nombre++;
    }
    return $nombre;
}

try {
    $racine = __DIR__ . '/../../sql/';
    executerFichierSql($pdo, $racine . 'remise-a-zero.sql');
    executerFichierSql($pdo, $racine . 'mise-a-jour-menus.sql');
    jsonResponse(['message' => 'Les menus de traiteur ont été mis à jour et les anciennes commandes de test ont été supprimées.']);
} catch (Throwable $erreur) {
    error_log('Mise à jour des menus impossible : ' . $erreur->getMessage());
    jsonResponse(['error' => 'La mise à jour des menus a échoué.'], 500);
}
