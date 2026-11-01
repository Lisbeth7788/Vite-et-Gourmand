-- Équipe simulée pour visualiser les espaces employés et le planning de la semaine.
-- Mot de passe de tous les comptes : Employe2026 (à changer ou supprimer ensuite).
-- À exécuter après sql/schema.sql, puis cliquer sur « Générer la semaine » dans l'espace de gestion > Employés.

INSERT INTO users (id, first_name, last_name, phone, email, address, password_hash, role, job_title) VALUES
  ('exemple-employe-0000000000000001', 'Sophie', 'Moreau', '0612345601', 'sophie.exemple@vite-et-gourmand.fr', 'Vite et Gourmand', '$2y$10$3zURcrb2Uzk8taEKN3AbwOrh/Hs11MZFe/CWK5iVNs9SYQZkCRT.K', 'employe', 'patron'),
  ('exemple-employe-0000000000000002', 'Marc', 'Moreau', '0612345602', 'marc.exemple@vite-et-gourmand.fr', 'Vite et Gourmand', '$2y$10$3zURcrb2Uzk8taEKN3AbwOrh/Hs11MZFe/CWK5iVNs9SYQZkCRT.K', 'employe', 'patron'),
  ('exemple-employe-0000000000000003', 'Antoine', 'Leroy', '0612345603', 'antoine.exemple@vite-et-gourmand.fr', 'Vite et Gourmand', '$2y$10$3zURcrb2Uzk8taEKN3AbwOrh/Hs11MZFe/CWK5iVNs9SYQZkCRT.K', 'employe', 'chef'),
  ('exemple-employe-0000000000000004', 'Marie', 'Dupont', '0612345604', 'marie.exemple@vite-et-gourmand.fr', 'Vite et Gourmand', '$2y$10$3zURcrb2Uzk8taEKN3AbwOrh/Hs11MZFe/CWK5iVNs9SYQZkCRT.K', 'employe', 'sous-chef'),
  ('exemple-employe-0000000000000005', 'Julien', 'Petit', '0612345605', 'julien.exemple@vite-et-gourmand.fr', 'Vite et Gourmand', '$2y$10$3zURcrb2Uzk8taEKN3AbwOrh/Hs11MZFe/CWK5iVNs9SYQZkCRT.K', 'employe', 'commis'),
  ('exemple-employe-0000000000000006', 'Léa', 'Martin', '0612345606', 'lea.exemple@vite-et-gourmand.fr', 'Vite et Gourmand', '$2y$10$3zURcrb2Uzk8taEKN3AbwOrh/Hs11MZFe/CWK5iVNs9SYQZkCRT.K', 'employe', 'serveur'),
  ('exemple-employe-0000000000000007', 'Hugo', 'Bernard', '0612345607', 'hugo.exemple@vite-et-gourmand.fr', 'Vite et Gourmand', '$2y$10$3zURcrb2Uzk8taEKN3AbwOrh/Hs11MZFe/CWK5iVNs9SYQZkCRT.K', 'employe', 'serveur'),
  ('exemple-employe-0000000000000008', 'Camille', 'Roux', '0612345608', 'camille.exemple@vite-et-gourmand.fr', 'Vite et Gourmand', '$2y$10$3zURcrb2Uzk8taEKN3AbwOrh/Hs11MZFe/CWK5iVNs9SYQZkCRT.K', 'employe', 'serveur'),
  ('exemple-employe-0000000000000009', 'Karim', 'Benali', '0612345609', 'karim.exemple@vite-et-gourmand.fr', 'Vite et Gourmand', '$2y$10$3zURcrb2Uzk8taEKN3AbwOrh/Hs11MZFe/CWK5iVNs9SYQZkCRT.K', 'employe', 'plongeur'),
  ('exemple-employe-0000000000000010', 'Nadia', 'Costa', '0612345610', 'nadia.exemple@vite-et-gourmand.fr', 'Vite et Gourmand', '$2y$10$3zURcrb2Uzk8taEKN3AbwOrh/Hs11MZFe/CWK5iVNs9SYQZkCRT.K', 'employe', 'plongeur')
ON DUPLICATE KEY UPDATE job_title = VALUES(job_title);

DELETE FROM employee_tasks WHERE user_id LIKE 'exemple-employe-%';
DELETE FROM payslips WHERE user_id LIKE 'exemple-employe-%';

INSERT INTO employee_tasks (user_id, task_date, title, is_done) VALUES
  ('exemple-employe-0000000000000003', CURDATE(), 'Valider les fiches techniques du menu du jour', 1),
  ('exemple-employe-0000000000000003', CURDATE(), 'Commander les produits frais', 0),
  ('exemple-employe-0000000000000004', CURDATE(), 'Préparer les sauces et les fonds', 0),
  ('exemple-employe-0000000000000004', CURDATE(), 'Contrôler les températures des chambres froides', 0),
  ('exemple-employe-0000000000000006', CURDATE(), 'Dresser la salle et vérifier les réservations', 0),
  ('exemple-employe-0000000000000009', CURDATE(), 'Nettoyer le poste plonge et vider les bacs', 0);

INSERT INTO payslips (user_id, period, hours, gross, net, note)
SELECT id, DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL 1 MONTH), '%Y-%m'), 151.67, 2150.00, 1680.00, 'Exemple'
FROM users WHERE id LIKE 'exemple-employe-%' AND job_title <> 'patron';
