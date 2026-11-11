<?php

// Exécuter uniquement avec un serveur MongoDB local de test sur le port 27019.
putenv('MONGODB_URI=mongodb://127.0.0.1:27019/?serverSelectionTimeoutMS=5000');
putenv('MONGODB_DATABASE=validation_francisation');
require_once __DIR__ . '/../config/mongodb.php';

$gestionnaire = analyticsManager();
if (!$gestionnaire) {
    throw new RuntimeException('Extension MongoDB indisponible.');
}

$identifiant = bin2hex(random_bytes(16));
foreach ([
    'order_analytics' => ['order_id', 'menu_id', 'service_date'],
    'statistiques_commandes' => ['id_commande', 'id_menu', 'date_prestation']
] as $collection => $champs) {
    putenv('MONGODB_COLLECTION=' . $collection);
    $configuration = configurationStatistiques();
    try {
        recordOrderAnalytics($identifiant, 'menu-test', 123.45, '2030-01-02');
        $requete = new MongoDB\Driver\Query([
            $champs[0] => $identifiant,
            $champs[1] => 'menu-test',
            $champs[2] => ['$gte' => '2030-01-01', '$lte' => '2030-01-03']
        ]);
        $resultats = $gestionnaire->executeQuery($configuration['espace'], $requete)->toArray();
        if (count($resultats) !== 1 || (float) $resultats[0]->total !== 123.45) {
            throw new RuntimeException('Les statistiques sont incorrectes pour ' . $collection);
        }
        echo $collection . " : écriture, lecture et filtres vérifiés.\n";
    } finally {
        $suppression = new MongoDB\Driver\BulkWrite();
        $suppression->delete([$champs[0] => $identifiant], ['limit' => 1]);
        $gestionnaire->executeBulkWrite($configuration['espace'], $suppression);
    }
}

putenv('MONGODB_COLLECTION=nom_invalide');
try {
    configurationStatistiques();
} catch (RuntimeException $exception) {
    echo "Collection invalide refusée.\n";
    exit(0);
}
throw new RuntimeException('La collection invalide aurait dû être refusée.');
