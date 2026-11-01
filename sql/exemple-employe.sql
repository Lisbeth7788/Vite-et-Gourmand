-- Employé type pour visualiser l'espace employé.
-- Connexion : marie.exemple@vite-et-gourmand.fr / Employe2026 (à changer ensuite).
-- À exécuter après sql/schema.sql. Les dates sont calculées à partir d'aujourd'hui.

INSERT INTO users (id, first_name, last_name, phone, email, address, password_hash, role, job_title)
VALUES (
  'exemple-employe-0000000000000001', 'Marie', 'Dupont', '0612345678',
  'marie.exemple@vite-et-gourmand.fr', 'Vite et Gourmand',
  '$2y$10$3zURcrb2Uzk8taEKN3AbwOrh/Hs11MZFe/CWK5iVNs9SYQZkCRT.K', 'employe', 'cuisinier'
)
ON DUPLICATE KEY UPDATE job_title = VALUES(job_title);

DELETE FROM employee_shifts WHERE user_id = 'exemple-employe-0000000000000001';
DELETE FROM employee_tasks WHERE user_id = 'exemple-employe-0000000000000001';
DELETE FROM employee_reports WHERE user_id = 'exemple-employe-0000000000000001';
DELETE FROM payslips WHERE user_id = 'exemple-employe-0000000000000001';

INSERT INTO employee_shifts (user_id, shift_date, start_time, end_time, note) VALUES
  ('exemple-employe-0000000000000001', CURDATE(), '09:00', '15:00', 'Service du midi'),
  ('exemple-employe-0000000000000001', DATE_ADD(CURDATE(), INTERVAL 1 DAY), '16:00', '22:00', 'Service du soir'),
  ('exemple-employe-0000000000000001', DATE_ADD(CURDATE(), INTERVAL 3 DAY), '09:00', '15:00', NULL),
  ('exemple-employe-0000000000000001', DATE_ADD(CURDATE(), INTERVAL 4 DAY), '09:00', '15:00', 'Préparation traiteur');

INSERT INTO employee_tasks (user_id, task_date, title, is_done) VALUES
  ('exemple-employe-0000000000000001', CURDATE(), 'Préparer les entrées du menu Marché de Bordeaux', 1),
  ('exemple-employe-0000000000000001', CURDATE(), 'Contrôler les températures des chambres froides', 0),
  ('exemple-employe-0000000000000001', CURDATE(), 'Nettoyer et ranger le poste de travail', 0),
  ('exemple-employe-0000000000000001', DATE_ADD(CURDATE(), INTERVAL 1 DAY), 'Mise en place du menu La Table du Soir', 0),
  ('exemple-employe-0000000000000001', DATE_ADD(CURDATE(), INTERVAL 3 DAY), 'Inventaire des stocks', 0);

INSERT INTO employee_reports (user_id, report_date, content) VALUES
  ('exemple-employe-0000000000000001', DATE_SUB(CURDATE(), INTERVAL 1 DAY), 'Service du midi terminé, 42 couverts. Rupture de basilic, à recommander.');

INSERT INTO payslips (user_id, period, hours, gross, net, note) VALUES
  ('exemple-employe-0000000000000001', DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL 1 MONTH), '%Y-%m'), 151.67, 2150.00, 1680.00, 'Exemple'),
  ('exemple-employe-0000000000000001', DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL 2 MONTH), '%Y-%m'), 160.00, 2230.00, 1742.00, 'Exemple');
