-- Compte employé unique : identifiant « employe », mot de passe « VIETETGOURMAND » (majuscules ou minuscules).
-- À exécuter après sql/schema.sql. Supprime les anciens comptes d'exemple.

DELETE FROM users WHERE id LIKE 'exemple-employe-%';

INSERT INTO users (id, first_name, last_name, phone, email, address, password_hash, role, job_title) VALUES
  ('compte-employe-unique', 'Équipe', 'Vite et Gourmand', '0000000000', 'employe', 'Vite et Gourmand', '$2y$10$rI0/RSvmlyjNW0Y.ns7TG.G3eBS4KL34L/fyCS1aswBlK0SxM5SxG', 'employe', NULL)
ON DUPLICATE KEY UPDATE password_hash = VALUES(password_hash), role = 'employe', is_active = 1;
