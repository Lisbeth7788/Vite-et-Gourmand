-- Comptes de démonstration pour les correcteurs de l'ECF.
-- Mot de passe des trois comptes : Azerty2026!
-- Installation locale neuve uniquement, après sql/schema.sql.
-- Ne pas importer sur un site en ligne : ces mots de passe sont publics.

INSERT INTO users (id, first_name, last_name, phone, email, address, password_hash, role, job_title, is_active) VALUES
  (UUID(), 'Client', 'Démonstration', '0600000000', 'client@vite-et-gourmand.fr', '1 rue de Bordeaux, 33000 Bordeaux', '$2y$10$7oN1t1jfGZXW8FCzLlBspuz2vNVz7/5B0vXhLBXRy0ePm4oShTq8u', 'client', NULL, 1),
  (UUID(), 'Équipe', 'Vite et Gourmand', '0600000002', 'employe@vite-et-gourmand.fr', 'Bordeaux', '$2y$10$7oN1t1jfGZXW8FCzLlBspuz2vNVz7/5B0vXhLBXRy0ePm4oShTq8u', 'employe', NULL, 1);

UPDATE users
SET password_hash = '$2y$10$7oN1t1jfGZXW8FCzLlBspuz2vNVz7/5B0vXhLBXRy0ePm4oShTq8u'
WHERE id = '00000000-0000-4000-8000-000000000002'
  AND email = 'admin@vite-et-gourmand.fr' AND role = 'admin';
