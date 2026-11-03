-- Comptes de démonstration pour les correcteurs de l'ECF.
-- Mot de passe des trois comptes : Azerty2026!
-- À exécuter après sql/schema.sql.

INSERT INTO users (id, first_name, last_name, phone, email, address, password_hash, role, job_title, is_active) VALUES
  ('00000000-0000-4000-8000-000000000001', 'Client', 'Démonstration', '0600000000', 'client@vite-et-gourmand.fr', '1 rue de Bordeaux, 33000 Bordeaux', '$2y$10$7oN1t1jfGZXW8FCzLlBspuz2vNVz7/5B0vXhLBXRy0ePm4oShTq8u', 'client', NULL, 1),
  ('compte-employe-unique', 'Équipe', 'Vite et Gourmand', '0600000002', 'employe@vite-et-gourmand.fr', 'Bordeaux', '$2y$10$7oN1t1jfGZXW8FCzLlBspuz2vNVz7/5B0vXhLBXRy0ePm4oShTq8u', 'employe', NULL, 1),
  ('00000000-0000-4000-8000-000000000002', 'Administrateur', 'Vite et Gourmand', '0600000001', 'admin@vite-et-gourmand.fr', 'Bordeaux', '$2y$10$7oN1t1jfGZXW8FCzLlBspuz2vNVz7/5B0vXhLBXRy0ePm4oShTq8u', 'admin', NULL, 1)
ON DUPLICATE KEY UPDATE
  first_name = VALUES(first_name), last_name = VALUES(last_name), email = VALUES(email),
  password_hash = VALUES(password_hash), role = VALUES(role), is_active = 1;
