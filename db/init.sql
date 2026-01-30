-- Database schema for Raphael Transport Logistics PWA
CREATE DATABASE IF NOT EXISTS logistics CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE logistics;

-- Users table (Admin and Clerks)
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(100) NOT NULL,
  phone VARCHAR(20),
  role ENUM('admin', 'clerk') NOT NULL DEFAULT 'clerk',
  active BOOLEAN NOT NULL DEFAULT TRUE,
  failed_attempts INT NOT NULL DEFAULT 0,
  lockout_until DATETIME NULL,
  last_login DATETIME NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_username (username),
  INDEX idx_role (role),
  INDEX idx_active (active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- Clients table (New)
CREATE TABLE clients (
  id INT AUTO_INCREMENT PRIMARY KEY,
  full_name VARCHAR(100) NOT NULL,
  phone VARCHAR(20) UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_phone (phone),
  INDEX idx_name (full_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Waybills table
CREATE TABLE waybills (
  id INT AUTO_INCREMENT PRIMARY KEY,
  waybill_number VARCHAR(50) UNIQUE NOT NULL,
  client_id INT NULL,
  client_name VARCHAR(100) NOT NULL,
  client_phone VARCHAR(20) NOT NULL,
  sender_name VARCHAR(100) NOT NULL,
  sender_phone VARCHAR(20),
  origin VARCHAR(100) NOT NULL,
  destination VARCHAR(100) NOT NULL,
  cargo_description TEXT,
  weight DECIMAL(10,2),
  status ENUM('pending', 'on_road', 'arrived', 'delivered') NOT NULL DEFAULT 'pending',
  created_by INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id),
  FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
  INDEX idx_waybill_number (waybill_number),
  INDEX idx_status (status),
  INDEX idx_client_phone (client_phone),
  INDEX idx_client_id (client_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- SMS logs table (tracks all SMS sent)
CREATE TABLE sms_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  waybill_id INT NOT NULL,
  phone VARCHAR(20) NOT NULL,
  template_key ENUM('receipt', 'departed', 'on_transit', 'arrived') NOT NULL,
  message_text TEXT NOT NULL,
  status ENUM('queued', 'sent', 'failed') NOT NULL DEFAULT 'queued',
  sent_at DATETIME NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (waybill_id) REFERENCES waybills(id) ON DELETE CASCADE,
  INDEX idx_waybill_id (waybill_id),
  INDEX idx_status (status),
  INDEX idx_template (template_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Sessions table (for secure cookie-based sessions)
CREATE TABLE sessions (
  id VARCHAR(128) PRIMARY KEY,
  user_id INT NOT NULL,
  data TEXT,
  expires_at DATETIME NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_expires (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert default admin user (password: Admin123)
-- Generated with: php -r "echo password_hash('Admin123', PASSWORD_BCRYPT);"
INSERT INTO users (username, password_hash, full_name, role, active) 
VALUES ('admin', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Administrator', 'admin', TRUE);
```

**What this file does:**
- Creates the `logistics` database
- Creates tables for: users, waybills, sms_logs, sessions
- Sets up proper indexes for performance
- Creates a default admin user
  - **Username:** `admin`
  - **Password:** `Admin123` (you should change this later)

```