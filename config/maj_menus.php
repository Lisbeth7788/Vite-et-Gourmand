<?php

function executerFichierSql(PDO $pdo, string $chemin): void
{
    $contenu = file_get_contents($chemin);
    if ($contenu === false) {
        throw new RuntimeException('Fichier SQL introuvable : ' . basename($chemin));
    }
    $contenu = preg_replace('/^\s*--.*$/m', '', $contenu);
    foreach (preg_split('/;[ \t]*\R/', $contenu) as $requete) {
        $requete = trim($requete);
        if ($requete !== '') {
            $pdo->exec($requete);
        }
    }
}

function appliquerMenusTraiteur(PDO $pdo): void
{
    $racine = __DIR__ . '/../sql/';
    executerFichierSql($pdo, $racine . 'remise-a-zero.sql');
    executerFichierSql($pdo, $racine . 'mise-a-jour-menus.sql');
    $pdo->exec('CREATE TABLE IF NOT EXISTS maj_menus (nom VARCHAR(40) PRIMARY KEY, applique_le TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP)');
    $pdo->exec("INSERT IGNORE INTO maj_menus (nom) VALUES ('menus-traiteur')");
}

// Applique une seule fois les menus de traiteur ; l'administrateur peut ensuite modifier ou supprimer librement.
function assurerMenusTraiteur(PDO $pdo): void
{
    $pdo->exec('CREATE TABLE IF NOT EXISTS maj_menus (nom VARCHAR(40) PRIMARY KEY, applique_le TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP)');
    $dejaFait = $pdo->query("SELECT COUNT(*) FROM maj_menus WHERE nom = 'menus-traiteur'")->fetchColumn();
    if (!$dejaFait) {
        appliquerMenusTraiteur($pdo);
    }
}
