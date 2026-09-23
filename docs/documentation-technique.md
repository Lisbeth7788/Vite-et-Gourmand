# Documentation technique

## Choix initiaux

HTML, CSS et JavaScript natifs sont utilises pour conserver une interface simple, accessible et facile a maintenir. PHP avec PDO est choisi pour limiter la complexite du serveur et proteger les requetes SQL. MySQL stocke les utilisateurs, menus, commandes et messages. MongoDB stocke les evenements necessaires aux statistiques par menu et par periode.

## Environnement

- Apache et PHP 8.2 ou plus recent.
- MySQL pour la base relationnelle.
- MongoDB pour les statistiques.
- Extension PHP `mongodb` pour communiquer avec MongoDB.
- Navigateur recent et phpMyAdmin pour initialiser la base.

## Securite

Les mots de passe sont haches. Les requetes sont preparees avec PDO. Les sessions sont regenerees apres connexion. Les cookies sont HttpOnly et SameSite. Les routes administratives controlent le role cote serveur. Les formulaires valident les donnees cote client et cote serveur. Les tentatives sensibles sont limitees et les fichiers de configuration sont proteges.

## Donnees

La base relationnelle gere les comptes, menus, plats, commandes, messages, avis et historique des statuts. MongoDB conserve les statistiques de commandes sans remplacer les donnees metier MySQL.

## Deploiement

Importer `sql/schema.sql`, activer l'extension PHP `mongodb`, configurer les variables de `.env.example`, activer HTTPS et tester les parcours visiteur, client, employe et administrateur. Configurer un service SMTP pour les e-mails et une instance MongoDB pour les statistiques.
