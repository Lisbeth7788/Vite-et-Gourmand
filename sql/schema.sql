CREATE DATABASE IF NOT EXISTS vite_et_gourmand
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE vite_et_gourmand;

CREATE TABLE IF NOT EXISTS menus (
  id VARCHAR(80) PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  minimum_people INT NOT NULL,
  theme VARCHAR(40) NOT NULL,
  regime VARCHAR(40) NOT NULL,
  description TEXT NOT NULL,
  stock INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS users (
  id CHAR(36) PRIMARY KEY,
  first_name VARCHAR(80) NOT NULL,
  last_name VARCHAR(80) NOT NULL,
  phone VARCHAR(30) NOT NULL,
  email VARCHAR(190) NOT NULL UNIQUE,
  address TEXT NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'client',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(20) NOT NULL DEFAULT 'client';

CREATE TABLE IF NOT EXISTS orders (
  id CHAR(36) PRIMARY KEY,
  user_id CHAR(36) NULL,
  first_name VARCHAR(80) NOT NULL,
  last_name VARCHAR(80) NOT NULL,
  email VARCHAR(190) NOT NULL,
  phone VARCHAR(30) NOT NULL,
  address TEXT NOT NULL,
  city VARCHAR(100) NOT NULL,
  distance DECIMAL(8, 2) NOT NULL DEFAULT 0,
  service_date DATE NOT NULL,
  service_time TIME NOT NULL,
  delivery_place VARCHAR(150) NOT NULL,
  menu_id VARCHAR(80) NOT NULL,
  people INT NOT NULL,
  menu_total DECIMAL(10, 2) NOT NULL,
  discount DECIMAL(10, 2) NOT NULL DEFAULT 0,
  delivery DECIMAL(10, 2) NOT NULL DEFAULT 0,
  total DECIMAL(10, 2) NOT NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_orders_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT fk_orders_menu FOREIGN KEY (menu_id) REFERENCES menus(id)
);

CREATE TABLE IF NOT EXISTS messages (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(150) NOT NULL,
  description TEXT NOT NULL,
  email VARCHAR(190) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO menus (id, name, price, minimum_people, theme, regime, description, stock)
VALUES
  ('marche-bordeaux', 'Le marché de Bordeaux', 24, 6, 'classique', 'classique', 'Une formule équilibrée avec produits de saison.', 5),
  ('reveillon', 'Le réveillon généreux', 38, 8, 'noel', 'classique', 'Une sélection festive pour réunir vos proches.', 4),
  ('jardin-printemps', 'Le jardin de printemps', 29, 6, 'paques', 'vegetarien', 'Un menu végétarien coloré et de saison.', 6),
  ('fete-vegetale', 'La fête végétale', 32, 10, 'evenement', 'vegan', 'Une formule entièrement végétale pour vos événements.', 3)
ON DUPLICATE KEY UPDATE
  name = VALUES(name), price = VALUES(price), minimum_people = VALUES(minimum_people),
  theme = VALUES(theme), regime = VALUES(regime), description = VALUES(description), stock = VALUES(stock);

INSERT INTO users (id, first_name, last_name, phone, email, address, password_hash, role)
VALUES (
  '00000000-0000-4000-8000-000000000001',
  'Client',
  'Test',
  '0600000000',
  'test@vite-et-gourmand.fr',
  '1 rue de Bordeaux, 33000 Bordeaux',
  '$2a$12$X6u5K9ts2AxT4KGuQxld1.6sg/cj.ap6cYFNL1wbR83ZAHANT/Y/C',
  'client'
)
ON DUPLICATE KEY UPDATE
  first_name = VALUES(first_name), last_name = VALUES(last_name),
  password_hash = VALUES(password_hash), role = VALUES(role);

INSERT INTO users (id, first_name, last_name, phone, email, address, password_hash, role)
VALUES (
  '00000000-0000-4000-8000-000000000002',
  'Administrateur',
  'Vite et Gourmand',
  '0600000001',
  'admin@vite-et-gourmand.fr',
  'Bordeaux',
  '$2a$12$dZ94gbewS6K1qYaLWzdQuOPiro2ftSWhMvAbKX5KDOHuz7buqLXVu',
  'admin'
)
ON DUPLICATE KEY UPDATE
  first_name = VALUES(first_name), last_name = VALUES(last_name),
  password_hash = VALUES(password_hash), role = VALUES(role);
