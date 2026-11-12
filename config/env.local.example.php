<?php

// Copier ce fichier en "env.local.php" dans le dossier config/ sur Hostinger,
// puis remplacer les valeurs par celles de hPanel > Bases de données > Gestion.
// env.local.php n'est pas versionné : ne jamais y mettre de mot de passe dans git.
return [
    'APP_ENV' => 'production',
    'DB_HOST' => 'localhost',
    'DB_NAME' => 'u000000000_vitegourmand',
    'DB_USER' => 'u000000000_vitegourmand',
    'DB_PASSWORD' => 'MOT_DE_PASSE_DE_LA_BASE',
    // Sur un hébergement mutualisé, utiliser l'URI d'un fournisseur MongoDB externe.
    // Ne pas laisser vide en production si les statistiques doivent fonctionner.
    'MONGODB_URI' => '',
    'MONGODB_DATABASE' => 'vite_et_gourmand',
    'MONGODB_COLLECTION' => 'statistiques_commandes',
];
