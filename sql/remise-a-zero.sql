-- Remise à zéro des données de test (anciennes commandes du temps du restaurant).
-- Conserve : les menus et leurs plats, TOUS les comptes (clients, employés, administrateur) et les horaires.
-- Supprime : commandes, suivis, avis, messages, jetons de mot de passe,
-- et données de planning/paie des employés.
-- À importer dans phpMyAdmin (local, puis Hostinger). Action définitive.
SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

DELETE FROM reviews;
DELETE FROM order_status_history;
DELETE FROM orders;
DELETE FROM messages;
DELETE FROM password_reset_tokens;
DELETE FROM employee_tasks;
DELETE FROM employee_reports;
DELETE FROM payslips;

SET FOREIGN_KEY_CHECKS = 1;

ALTER TABLE orders AUTO_INCREMENT = 1;
ALTER TABLE order_status_history AUTO_INCREMENT = 1;
ALTER TABLE reviews AUTO_INCREMENT = 1;
ALTER TABLE messages AUTO_INCREMENT = 1;

-- Statistiques MongoDB (à lancer dans mongosh, pas dans phpMyAdmin) :
--   use vite_et_gourmand
--   db.order_analytics.deleteMany({})
