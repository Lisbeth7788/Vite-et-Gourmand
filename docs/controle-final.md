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
- README, DEPLOYMENT et documents `docs/` réécrits en français simple et mis à jour (nombre de personnes, comptes, planning, MongoDB).

## À faire avant l'envoi (hors code)

1. **Mettre à jour le dossier projet PDF** : règle du mot de passe (10 caractères), espace employé (planning A/B en lecture seule), espace administrateur (planning modifiable, statistiques par menu), compte employé unique `employe`, e-mails de bienvenue et de confirmation.
2. **Mettre à jour le manuel d'utilisation PDF** : identifiants de test ci-dessus et nouveaux parcours.
3. **Importer les SQL sur Hostinger** : `sql/schema.sql` puis `sql/exemple-employe.sql`.
4. **Configurer MongoDB et le SMTP sur Hostinger** : sans eux, les statistiques affichent « MongoDB n'est pas configurée » et les e-mails ne partent pas.
5. **Vérifier la branche `develop`** : la fusionner dans `main` après tests (bonnes pratiques Git demandées).
6. **Partager le Trello** en lecture avec le correcteur.
7. **Lancer la recette** : `docs/deploiement-et-recette.md`.

## Écarts avec le sujet (à connaître pour l'oral)

- Le site a évolué vers une **réservation sur place** (60 personnes maximum par service, 10 par réservation) au lieu d'une commande avec livraison ; la remise de 10 %, les frais de livraison et le prêt de matériel du sujet ne sont donc plus mis en avant.
- Pas d'écran pour créer, modifier ou supprimer les **menus, plats et horaires** (les menus sont dans `sql/schema.sql`).
- Plus d'écran pour **créer ou désactiver des comptes employés** : un compte employé unique est fourni.
- Le filtre des réservations par statut et par client a été retiré de la page administrateur, à ta demande.
- Les anciennes routes `api/admin/employees.php` et `api/admin/planning.php` existent toujours mais ne sont plus reliées à une page.
