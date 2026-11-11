# Documentation technique

## Choix de départ

- **HTML, CSS, JavaScript sans framework** : simple, accessible, facile à relire.
- **PHP avec PDO** : le serveur reste simple et les requêtes préparées bloquent les injections SQL.
- **MySQL** : stocke les comptes, menus, réservations, messages, avis, horaires.
- **MongoDB** : stocke les statistiques de réservations par menu (base non relationnelle, demandée par le sujet).

## Environnement de travail

Windows, XAMPP (Apache, PHP 8.2, MySQL), phpMyAdmin, Visual Studio Code, Git et GitHub. Mise en ligne chez Hostinger.

## Fonctionnement général

1. Les pages HTML s'affichent dans le navigateur.
2. Les scripts `js/` appellent les routes PHP du dossier `api/` avec `fetch`.
3. Les routes PHP vérifient la session, le rôle et les données, puis lisent ou écrivent dans MySQL.
4. Elles répondent en JSON et la page se met à jour sans rechargement.
5. Le catalogue et les fiches de menu lisent les données actuelles de MySQL ; les filtres de prix utilisent le prix par personne. Le prix pour le nombre minimal de personnes est également affiché.

## Rôles et droits

| Rôle | Pages | Droits |
| --- | --- | --- |
| Visiteur | pages publiques | consulter, contacter, s'inscrire |
| Client (`client`) | compte, réservation | réserver, payer, annuler, donner un avis |
| Employé (`employe`) | espace employé | réservations, avis, menus et horaires |
| Administrateur (`admin`) | pages `admin-*` | tout, et gérer les comptes employés |

Il n'est pas possible de créer un compte administrateur depuis le site.

## Données

Tables principales : `users`, `menus`, `menu_dishes`, `orders` (les commandes), `order_status_history`, `reviews`, `messages`, `business_hours`, `password_reset_tokens`.

## Prix d'une commande

Le calcul est fait côté serveur dans `config/tarifs.php` :

- remise de 10 % si le nombre de personnes atteint le minimum du menu plus 5 ;
- livraison gratuite à Bordeaux, sinon 5 € plus 0,59 € par kilomètre.

## Sécurité

Voir le fichier `README.md` (mots de passe hachés, requêtes préparées, sessions, droits côté serveur, limitation des tentatives).

## Diagrammes

Voir `docs/diagrammes.md`.

## Déploiement

Voir `DEPLOYMENT.md` et `docs/deploiement-et-recette.md`.
