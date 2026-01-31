-- FINAL COMPREHENSIVE SCHEMA for Raphael Transport Logistics PWA
-- Use this script to recreate the entire database on TiDB Cloud

-- 1. Create the database
CREATE DATABASE IF NOT EXISTS logistics CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE logistics;

-- 2. Drop existing tables if any (safety measure)
SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS `sms_logs`;
DROP TABLE IF EXISTS `sessions`;
DROP TABLE IF EXISTS `waybills`;
DROP TABLE IF EXISTS `clients`;
DROP TABLE IF EXISTS `users`;
SET FOREIGN_KEY_CHECKS = 1;

-- 3. Users Table (Administrators and Clerks)
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
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_username (username),
  INDEX idx_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Clients Table
CREATE TABLE `clients` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `full_name` VARCHAR(100) NOT NULL,
  `phone` VARCHAR(20) UNIQUE NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_phone (phone)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Waybills Table
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
  FOREIGN KEY (`client_id`) REFERENCES `clients`(`id`) ON DELETE CASCADE,
  INDEX idx_waybill_number (waybill_number),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. SMS Logs Table
CREATE TABLE `sms_logs` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `waybill_id` INT NOT NULL,
  `phone` VARCHAR(20) NOT NULL,
  `template_key` ENUM('receipt', 'departed', 'on_transit', 'arrived') NOT NULL,
  `message_text` TEXT NOT NULL,
  `status` ENUM('queued', 'sent', 'failed') NOT NULL DEFAULT 'queued',
  `sent_at` DATETIME NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`waybill_id`) REFERENCES `waybills`(`id`) ON DELETE CASCADE,
  INDEX idx_waybill_id (waybill_id),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. Sessions Table
CREATE TABLE `sessions` (
  `id` VARCHAR(128) PRIMARY KEY,
  `user_id` INT NOT NULL,
  `data` TEXT,
  `expires_at` DATETIME NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  INDEX idx_expires (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. Add Initial Admin Account
-- Username: admin
-- Password: Admin123
INSERT INTO `users` (`username`, `password_hash`, `full_name`, `role`, `active`) 
VALUES ('admin', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Administrator', 'admin', TRUE);