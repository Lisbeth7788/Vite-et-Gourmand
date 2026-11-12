# Source SQL des statistiques

MySQL/MariaDB reste la source de vérité des commandes. En développement local, si Upstash n'est pas configuré, l'API calcule les statistiques directement depuis la table `orders`.

En production, l'API utilise le stockage NoSQL Upstash Redis REST. Les données existantes y sont copiées automatiquement à la première consultation des statistiques ; les nouvelles commandes, modifications et annulations sont synchronisées ensuite. Aucun renseignement personnel n'est recopié.

Les filtres de menu et de dates sont facultatifs, les dates sont incluses et les commandes annulées sont exclues.

Pour valider le calcul SQL local sans toucher à une base existante :

```sh
php tests/statistiques-mysql.test.php
```

Pour tester la synchronisation et le calcul NoSQL simulés :

```sh
php tests/statistiques-upstash.test.php
```

La configuration de production et le nettoyage du stockage NoSQL sont décrits dans [la procédure Upstash](statistiques-upstash.md).
