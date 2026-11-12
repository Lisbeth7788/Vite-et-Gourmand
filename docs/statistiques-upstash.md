# Statistiques NoSQL avec Upstash Redis REST

## Choix de base

Le sujet ECF demande une base relationnelle et une base non relationnelle. MongoDB est donné comme exemple de technologie NoSQL, sans être imposé. Le projet conserve les commandes dans MySQL/MariaDB et utilise Upstash Redis REST comme stockage NoSQL des statistiques.

Chaque document analytique contient seulement l'identifiant pseudonyme de commande, le menu, le montant, la date de prestation et le statut ; aucun nom ni coordonnée de client n'est envoyé à Upstash. Les commandes existantes sont copiées au premier accès administrateur aux statistiques ; les nouvelles commandes, modifications et annulations sont synchronisées ensuite. Les réservations annulées ne sont pas comptées.

En production, la page des statistiques lit Upstash. Si la connexion au service est indisponible, l'API renvoie une erreur 503 et journalise l'erreur ; elle ne prétend pas afficher des statistiques synchronisées. En développement local, MySQL est utilisé si Upstash n'est pas configuré.

## Créer et configurer la base

1. Créer une base Redis dans la [console Upstash](https://console.upstash.com/redis) et conserver l'offre gratuite. La [page tarifaire](https://upstash.com/pricing/redis) affiche actuellement 250 Mo de stockage et 500 000 commandes mensuelles incluses ; les tarifs et quotas peuvent changer.
2. Copier l'URL REST HTTPS et le jeton depuis la console.
3. Renseigner `UPSTASH_REDIS_REST_URL` et `UPSTASH_REDIS_REST_TOKEN` dans le fichier privé `config/env.local.php` sur Hostinger. Ne jamais mettre ces valeurs dans Git ni les envoyer dans une conversation.
4. Vérifier depuis Hostinger que les connexions HTTPS sortantes fonctionnent, puis ouvrir les statistiques dans l'administration. La première ouverture importe les commandes existantes de MySQL/MariaDB.

L'API REST s'authentifie avec un jeton HTTPS ; il n'est pas nécessaire de configurer une liste blanche d'adresses IP. La disponibilité des connexions HTTPS sortantes sur l'hébergement reste à vérifier en recette. Ne pas saisir de carte bancaire ni activer une offre payante sans décision préalable.

Si la configuration est invalide, les statistiques indiquent à l'administrateur si l'adresse REST ou le format du jeton doit être vérifié, sans afficher leurs valeurs.

## Tests et remise à zéro

Le test automatisé simule l'API Upstash et ne nécessite ni compte ni accès réseau :

```sh
php tests/statistiques-upstash.test.php
```

Après une remise à zéro locale des commandes SQL, les anciens documents NoSQL ne sont pas supprimés par le fichier SQL. Depuis le terminal PHP de l'hébergement, exécuter le script prévu pour effacer uniquement les clés de cette application :

```sh
php scripts/effacer-statistiques-nosql.php
```

Ne pas utiliser `FLUSHDB` : il supprimerait aussi les éventuelles autres données de la base Redis.
