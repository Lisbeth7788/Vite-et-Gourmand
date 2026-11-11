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
    // 127.0.0.1 convient uniquement si MongoDB tourne sur ce même serveur.
    // Pour un VPS séparé, utiliser son URI privée et limiter son accès réseau au serveur web.
    'MONGODB_URI' => 'mongodb://127.0.0.1:27017',
    'MONGODB_DATABASE' => 'vite_et_gourmand',
    'MONGODB_COLLECTION' => 'statistiques_commandes',
];
