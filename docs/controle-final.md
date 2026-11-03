# Contrôle final avant envoi

Contrôle du projet fait le 1er novembre 2026, comparé au sujet de l'ECF et au dossier projet.

## Vérifié et correct

- Aucune erreur de syntaxe dans les fichiers PHP et JavaScript.
- Aucun lien ou fichier cassé dans les 21 pages HTML ; toutes les images ont un texte alternatif ; `lang="fr"` partout.
- Aucun texte mal encodé (accents) dans les pages, scripts et documents.
- Textes visibles du site en français.

## Corrigé pendant ce contrôle

- Mot de passe : 10 caractères minimum avec majuscule, minuscule, chiffre et **caractère spécial** (exigé par le sujet ; avant : 8 caractères sans caractère spécial). Corrigé dans l'inscription, la réinitialisation et la création de compte.
- E-mail de bienvenue envoyé à l'inscription (exigé par le sujet).
- E-mail de confirmation envoyé après une réservation.
- Statistiques par menu (réservations et chiffre d'affaires, filtres menu et période) ajoutées sur la page Activité de l'administrateur. Elles utilisent MongoDB.
- `sitemap.xml` : les adresses `localhost` ont été remplacées par l'adresse publique.
- Pages privées (administration, espace employé) : `noindex` ajouté pour qu'elles n'apparaissent pas dans Google.
- **Menus et horaires** (nouvelle page dmin-menus.html, accessible aux employés et à l'administrateur) : ajouter, modifier, supprimer un menu avec ses entrées, plats, desserts, allergènes, conditions et stock ; modifier les horaires affichés dans le pied de page.
- **Comptes employés** (nouvelle page dmin-comptes.html, administrateur) : créer un compte (e-mail envoyé sans le mot de passe), désactiver, réactiver ou supprimer.
- **Espace client** : modification d'une réservation (tout sauf le menu) tant qu'elle n'est pas acceptée, et formulaire d'avis (note de 1 à 5 et commentaire) sur une réservation terminée.
- **E-mails de statut** : statut « en attente du retour de matériel » (600 € après 10 jours ouvrés) et statut « terminée » (invitation à donner un avis).
- Espace employé : accès direct aux réservations, aux avis et aux menus.
- README, DEPLOYMENT et documents `docs/` réécrits en français simple et mis à jour (nombre de personnes, comptes, planning, MongoDB).

## À faire avant l'envoi (hors code)

1. **Mettre à jour le dossier projet PDF** : règle du mot de passe (10 caractères), espace employé (réservations, avis, menus et horaires), espace administrateur (comptes employés, statistiques par menu), compte employé unique `employe`, e-mails de bienvenue et de confirmation.
2. **Mettre à jour le manuel d'utilisation PDF** : identifiants de test ci-dessus et nouveaux parcours.
3. **Importer les SQL sur Hostinger** : `sql/schema.sql` puis `sql/comptes-ecf.sql`.
4. **Configurer MongoDB et le SMTP sur Hostinger** : sans eux, les statistiques affichent « MongoDB n'est pas configurée » et les e-mails ne partent pas.
5. **Vérifier la branche `develop`** : la fusionner dans `main` après tests (bonnes pratiques Git demandées).
6. **Partager le Trello** en lecture avec le correcteur.
7. **Lancer la recette** : `docs/deploiement-et-recette.md`.

## Écarts avec le sujet (à connaître pour l'oral)

- Le site suit le **modèle traiteur** du sujet : livraison à l'adresse du client, remise de 10 % (minimum du menu plus 5 personnes), frais de livraison hors Bordeaux (5 € plus 0,59 € par km, distance saisie par le client) et statut de retour de matériel (600 € après 10 jours ouvrés). Il n'y a plus de plafond de personnes ni de créneaux.
- **Galerie d'images** d'un menu : une seule image par menu.
- **Horaires** : le pied de page est modifiable par l'employé ou l'administrateur ; l'heure de livraison est libre.
- Le filtre des réservations par statut et par client est présent dans la page Réservations.
- Un seul **compte employé** partagé (`employe`) est fourni pour la démonstration ; l'administrateur peut en créer d'autres depuis « 7. Comptes employés ».