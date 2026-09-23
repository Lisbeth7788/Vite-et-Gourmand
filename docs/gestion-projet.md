# Gestion de projet

## Organisation

Le projet est organise autour d'un depot Git public. La branche `main` correspond a la version livrable. La branche `develop` doit centraliser les fonctionnalites avant validation. Chaque fonctionnalite est developpee dans une branche dediee puis testee avant fusion.

## Etapes

1. Analyse du besoin et identification des profils visiteur, client, employe et administrateur.
2. Maquettage des parcours bureau et mobile.
3. Creation du modele de donnees relationnel et du stockage NoSQL des statistiques.
4. Integration des pages publiques et des formulaires.
5. Developpement des routes PHP, de l'authentification et des droits.
6. Tests des parcours, controle de la securite et validation responsive.
7. Deploiement, recette et correction des anomalies.

## Suivi

Les taches peuvent etre suivies dans Trello, Notion ou Jira avec les colonnes A faire, En cours, A tester et Termine. Chaque carte doit contenir le besoin, les criteres d'acceptation et le lien vers la branche Git correspondante.

## Strategie Git

- `main` : version stable livrable.
- `develop` : integration des fonctionnalites validees.
- `feature/nom-de-fonctionnalite` : developpement isole.
- Un merge vers `develop` est realise apres test.
- Un merge vers `main` est realise apres recette de la version complete.
