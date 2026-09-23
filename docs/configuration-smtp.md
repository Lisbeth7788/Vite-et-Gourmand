# Configuration SMTP

## Variables a definir

- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_USER`
- `SMTP_PASSWORD`
- `SMTP_FROM`
- `CONTACT_EMAIL`

## Configuration locale XAMPP

Le serveur local peut utiliser la fonction PHP `mail()` si le serveur SMTP est renseigne dans `php.ini`. Pour un vrai envoi authentifie, utiliser le relais SMTP du fournisseur d'hebergement ou une bibliotheque SMTP validee par l'entreprise.

## Tests obligatoires

1. Envoyer un formulaire de contact.
2. Verifier la reception dans la boite de l'entreprise.
3. Demander une reinitialisation de mot de passe.
4. Verifier la reception du lien temporaire.
5. Tester une confirmation de commande.
6. Conserver une capture ou un journal de test sans afficher de mot de passe.

Les valeurs de production ne doivent jamais etre commitees dans GitHub.
