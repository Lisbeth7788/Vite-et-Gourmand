<?php

putenv('UPSTASH_REDIS_REST_URL=https://test.upstash.io');
putenv('UPSTASH_REDIS_REST_TOKEN=jeton-test');
require_once __DIR__ . '/../config/upstash.php';

class ExceptionTestStatistiques extends RuntimeException
{
}

function verifier(bool $condition, string $message): void
{
    if (!$condition) {
        throw new ExceptionTestStatistiques($message);
    }
}

function simulerTransaction(array $commandes, array &$documents, array &$indexDates): array
{
    $resultats = [];
    foreach ($commandes as $commande) {
        if ($commande[0] === 'SET') {
            $documents[$commande[1]] = $commande[2];
            $resultats[] = ['result' => 'OK'];
        } elseif ($commande[0] === 'ZADD') {
            $nouvelleEntree = !array_key_exists($commande[3], $indexDates);
            $indexDates[$commande[3]] = (int) $commande[2];
            $resultats[] = ['result' => $nouvelleEntree ? 1 : 0];
        } else {
            throw new ExceptionTestStatistiques('Commande Redis inattendue.');
        }
    }
    return $resultats;
}

function simulerDates(array $commande, array $indexDates): array
{
    $minimum = $commande[2] === '-inf' ? PHP_INT_MIN : (int) $commande[2];
    $maximum = $commande[3] === '+inf' ? PHP_INT_MAX : (int) $commande[3];
    $scores = array_filter(
        $indexDates,
        static fn ($score) => $score >= $minimum && $score <= $maximum
    );
    uksort($scores, static fn ($premier, $second) => ($scores[$premier] <=> $scores[$second]) ?: strcmp($premier, $second));
    return array_slice(array_keys($scores), (int) $commande[5], (int) $commande[6]);
}

function simulerEnregistrement(array $commande, array &$documents): string
{
    $documents[$commande[1]] = $commande[2];
    return 'OK';
}

foreach ([
    ['', 'jeton-test', 'L’adresse REST Upstash est absente ou invalide.'],
    ['https://test.upstash.io/chemin', 'jeton-test', 'L’adresse REST Upstash est absente ou invalide.'],
    ['https://test.upstash.io', '', 'Le jeton REST Upstash est absent ou contient un retour à la ligne.'],
    ['https://test.upstash.io', "jeton-test\nsuite", 'Le jeton REST Upstash est absent ou contient un retour à la ligne.']
] as [$url, $token, $messageAttendu]) {
    putenv('UPSTASH_REDIS_REST_URL=' . $url);
    putenv('UPSTASH_REDIS_REST_TOKEN=' . $token);
    try {
        configurationUpstash();
        throw new LogicException('La configuration invalide aurait dû être refusée.');
    } catch (RuntimeException $erreur) {
        verifier($erreur->getMessage() === $messageAttendu, 'Le diagnostic doit identifier le champ invalide sans révéler sa valeur.');
    }
}
putenv('UPSTASH_REDIS_REST_URL=https://test.upstash.io');
putenv('UPSTASH_REDIS_REST_TOKEN=jeton-test');

$pdo = new PDO('sqlite::memory:', null, null, [
    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
]);
$pdo->exec('CREATE TABLE orders (id TEXT, menu_id TEXT, total REAL, service_date TEXT, status TEXT)');
$inserer = $pdo->prepare('INSERT INTO orders VALUES (?, ?, ?, ?, ?)');
$dateBrunch = '2026-03-05';
foreach ([
    ['commande-1', 'buffet', 100.25, '2026-03-01', 'pending'],
    ['commande-2', 'buffet', 25.25, '2026-03-10', 'completed'],
    ['commande-3', 'buffet', 500, '2026-03-10', 'cancelled'],
    ['commande-4', 'brunch', 60, $dateBrunch, 'accepted']
] as $commande) {
    $inserer->execute($commande);
}

$documents = [];
$indexDates = [];
$nombreTransactions = 0;
$transport = static function (string $route, array $corps) use (&$documents, &$indexDates, &$nombreTransactions): array {
    if ($route === 'multi-exec') {
        $nombreTransactions++;
        return simulerTransaction($corps, $documents, $indexDates);
    }

    $commande = $corps;
    return ['result' => match ($commande[0]) {
        'GET' => $documents[$commande[1]] ?? null,
        'SET' => simulerEnregistrement($commande, $documents),
        'ZRANGEBYSCORE' => simulerDates($commande, $indexDates),
        'MGET' => array_map(
            static fn ($cle) => $documents[$cle] ?? null,
            array_slice($commande, 1)
        ),
        default => throw new ExceptionTestStatistiques('Commande Redis inattendue.')
    }];
};

initialiserStatistiquesNoSQL($pdo, $transport);
verifier(count($indexDates) === 4, 'L’initialisation doit indexer toutes les commandes.');
$nombreAvantSecondeInitialisation = $nombreTransactions;
initialiserStatistiquesNoSQL($pdo, $transport);
verifier($nombreTransactions === $nombreAvantSecondeInitialisation, 'L’initialisation ne doit s’exécuter qu’une fois.');

$statistiques = lireStatistiquesNoSQL([], $transport);
verifier($statistiques === [
    ['menu' => 'buffet', 'orders' => 2, 'revenue' => 125.5],
    ['menu' => 'brunch', 'orders' => 1, 'revenue' => 60.0]
], 'Le calcul NoSQL doit exclure les commandes annulées et conserver le format attendu.');

$filtrees = lireStatistiquesNoSQL([
    'menu' => 'brunch',
    'from' => $dateBrunch,
    'to' => $dateBrunch
], $transport);
verifier($filtrees === [
    ['menu' => 'brunch', 'orders' => 1, 'revenue' => 60.0]
], 'Les filtres NoSQL par menu et dates doivent fonctionner.');

$pdo->prepare("UPDATE orders SET status = 'cancelled' WHERE id = ?")->execute(['commande-2']);
enregistrerStatistiqueNoSQL($pdo, 'commande-2', $transport);
$apresModification = lireStatistiquesNoSQL(['menu' => 'buffet'], $transport);
verifier($apresModification === [
    ['menu' => 'buffet', 'orders' => 1, 'revenue' => 100.25]
], 'La synchronisation doit prendre en compte l’annulation d’une commande.');

$document = json_decode($documents['vite-et-gourmand:statistiques:commande:commande-1'], true, 512, JSON_THROW_ON_ERROR);
verifier(
    array_keys($document) === ['id_commande', 'id_menu', 'total', 'date_prestation', 'statut'],
    'Les documents NoSQL ne doivent contenir que les champs analytiques autorisés.'
);

$dateRefusee = false;
try {
    lireStatistiquesNoSQL(['from' => '2026-02-30'], $transport);
} catch (InvalidArgumentException $erreur) {
    $dateRefusee = true;
}
verifier($dateRefusee, 'Une date invalide aurait dû être refusée.');

for ($numero = 0; $numero < 101; $numero++) {
    $identifiant = 'lot-' . $numero;
    $inserer->execute([$identifiant, 'verification', 1, '2026-04-01', 'pending']);
    enregistrerStatistiqueNoSQL($pdo, $identifiant, $transport);
}
verifier(
    lireStatistiquesNoSQL(['menu' => 'verification'], $transport) === [
        ['menu' => 'verification', 'orders' => 101, 'revenue' => 101.0]
    ],
    'La lecture doit inclure tous les lots de statistiques.'
);

unset($documents['vite-et-gourmand:statistiques:commande:lot-0']);
$documentAbsent = false;
try {
    lireStatistiquesNoSQL([], $transport);
} catch (ExceptionUpstash $erreur) {
    $documentAbsent = $erreur->getMessage() === 'Une commande référencée est absente du stockage NoSQL.';
}
verifier($documentAbsent, 'Une commande absente doit produire une erreur explicite.');

putenv('UPSTASH_REDIS_REST_URL');
putenv('UPSTASH_REDIS_REST_TOKEN');
putenv('APP_ENV=local');
verifier(
    synchroniserStatistiqueNoSQL($pdo, 'commande-1') === false,
    'La synchronisation locale doit rester désactivée sans configuration Upstash.'
);

echo "Statistiques NoSQL Upstash vérifiées.\n";
