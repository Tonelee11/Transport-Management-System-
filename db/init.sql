-- Database schema for Raphael Transport Logistics PWA
USE logistics;

-- 1. Drop old tables in correct order (due to links)
DROP TABLE IF EXISTS `sms_logs`;
DROP TABLE IF EXISTS `sessions`;
DROP TABLE IF EXISTS `waybills`;
DROP TABLE IF EXISTS `trucks`;
DROP TABLE IF EXISTS `clients`;
DROP TABLE IF EXISTS `users`;

-- 2. Create only the tables we need
CREATE TABLE `users` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `username` VARCHAR(50) UNIQUE NOT NULL,
  `password_hash` VARCHAR(255) NOT NULL,
  `full_name` VARCHAR(100) NOT NULL,
  `phone` VARCHAR(20),
  `role` ENUM('admin', 'clerk') NOT NULL DEFAULT 'clerk',
  `active` BOOLEAN NOT NULL DEFAULT TRUE,
  `failed_attempts` INT NOT NULL DEFAULT 0,
  `lockout_until` DATETIME NULL,
  `last_login` DATETIME NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE `clients` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `full_name` VARCHAR(100) NOT NULL,
  `phone` VARCHAR(20) UNIQUE NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE `waybills` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `waybill_number` VARCHAR(50) UNIQUE NOT NULL,
  `client_id` INT NULL,
  `client_name` VARCHAR(100) NOT NULL,
  `client_phone` VARCHAR(20) NOT NULL,
  `sender_name` VARCHAR(100) NOT NULL,
  `sender_phone` VARCHAR(20),
  `origin` VARCHAR(100) NOT NULL,
  `destination` VARCHAR(100) NOT NULL,
  `cargo_description` TEXT,
  `weight` DECIMAL(10,2),
  `status` ENUM('pending', 'on_road', 'arrived', 'delivered') NOT NULL DEFAULT 'pending',
  `created_by` INT NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`created_by`) REFERENCES `users`(`id`),
  FOREIGN KEY (`client_id`) REFERENCES `clients`(`id`) ON DELETE CASCADE
);

CREATE TABLE `sms_logs` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `waybill_id` INT NOT NULL,
  `phone` VARCHAR(20) NOT NULL,
  `template_key` ENUM('receipt', 'departed', 'on_transit', 'arrived') NOT NULL,
  `message_text` TEXT NOT NULL,
  `status` ENUM('queued', 'sent', 'failed') NOT NULL DEFAULT 'queued',
  `sent_at` DATETIME NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`waybill_id`) REFERENCES `waybills`(`id`) ON DELETE CASCADE
);

CREATE TABLE `sessions` (
  `id` VARCHAR(128) PRIMARY KEY,
  `user_id` INT NOT NULL,
  `data` TEXT,
  `expires_at` DATETIME NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
);

-- 3. Add default admin (Password: Admin123)
INSERT INTO `users` (`username`, `password_hash`, `full_name`, `role`, `active`) 
VALUES ('admin', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Administrator', 'admin', TRUE);