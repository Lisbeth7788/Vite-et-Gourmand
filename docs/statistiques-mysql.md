# Statistiques par menu

Les statistiques sont calculées à la demande à partir des réservations de la table `orders` dans MySQL/MariaDB. Elles ne nécessitent ni base distincte ni extension PHP supplémentaire. Les réservations déjà présentes sont prises en compte sans migration.

L'API `api/admin/stats.php` regroupe le nombre de réservations et leur montant par menu. Les filtres de menu et de dates sont facultatifs, les bornes de dates sont incluses et les réservations annulées sont exclues.

La remise à zéro SQL supprime les réservations ; les statistiques correspondantes disparaissent donc également. Pour valider le calcul des statistiques sans toucher à une base de données existante, exécuter :

```sh
php tests/statistiques-mysql.test.php
```

Le fichier `config/env.local.php` ne demande aucune variable supplémentaire pour les statistiques : seules les informations de connexion MySQL/MariaDB du site sont nécessaires.
