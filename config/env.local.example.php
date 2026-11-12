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
];
