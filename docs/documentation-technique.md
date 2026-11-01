# Documentation technique

## Choix de départ

- **HTML, CSS, JavaScript sans framework** : simple, accessible, facile à relire.
- **PHP avec PDO** : le serveur reste simple et les requêtes préparées bloquent les injections SQL.
- **MySQL** : stocke les comptes, menus, réservations, messages, avis, horaires et planning.
- **MongoDB** : stocke les statistiques de réservations par menu (base non relationnelle, demandée par le sujet).

## Environnement de travail

Windows, XAMPP (Apache, PHP 8.2, MySQL), phpMyAdmin, Visual Studio Code, Git et GitHub. Mise en ligne chez Hostinger.

## Fonctionnement général

1. Les pages HTML s'affichent dans le navigateur.
2. Les scripts `js/` appellent les routes PHP du dossier `api/` avec `fetch`.
3. Les routes PHP vérifient la session, le rôle et les données, puis lisent ou écrivent dans MySQL.
4. Elles répondent en JSON et la page se met à jour sans rechargement.

## Rôles et droits

| Rôle | Pages | Droits |
| --- | --- | --- |
| Visiteur | pages publiques | consulter, contacter, s'inscrire |
| Client (`client`) | compte, réservation | réserver, payer, annuler, donner un avis |
| Employé (`employe`) | espace employé | voir le planning |
| Administrateur (`admin`) | pages `admin-*` | tout, et modifier le planning |

Il n'est pas possible de créer un compte administrateur depuis le site.

## Données

Tables principales : `users`, `menus`, `menu_dishes`, `orders` (les réservations), `order_status_history`, `reviews`, `messages`, `business_hours`, `password_reset_tokens`, `team_planning`.

## Planning de l'équipe

- Le planning (semaines A et B) est stocké en JSON dans `team_planning`.
- L'administrateur clique sur une case pour passer de « Service » à « Repos » ou sur un prénom pour le modifier ; l'enregistrement est immédiat.
- La page employé relit le planning toutes les 10 secondes.
- Le code commun est dans `js/planning-equipe.js`, l'API dans `api/employee/planning-equipe.php`.

## Sécurité

Voir le fichier `README.md` (mots de passe hachés, requêtes préparées, sessions, droits côté serveur, limitation des tentatives).

## Diagrammes

Voir `docs/diagrammes.md`.

## Déploiement

Voir `DEPLOYMENT.md` et `docs/deploiement-et-recette.md`.
