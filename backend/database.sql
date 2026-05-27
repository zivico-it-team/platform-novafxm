CREATE DATABASE IF NOT EXISTS novafxm_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE novafxm_db;

CREATE TABLE IF NOT EXISTS users (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(190) NOT NULL UNIQUE,
  phone VARCHAR(30) NULL,
  profile_image LONGTEXT NULL,
  password VARCHAR(255) NOT NULL,
  role ENUM('user', 'admin') NOT NULL DEFAULT 'user',
  account_type ENUM('Demo', 'Live') NOT NULL DEFAULT 'Demo',
  leverage INT UNSIGNED NOT NULL DEFAULT 100,
  trading_status ENUM('active', 'frozen') NOT NULL DEFAULT 'active',
  admin_notes TEXT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS wallets (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED NOT NULL UNIQUE,
  balance DECIMAL(15,2) NOT NULL DEFAULT 5000.00,
  equity DECIMAL(15,2) NOT NULL DEFAULT 5000.00,
  margin DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  free_funds DECIMAL(15,2) NOT NULL DEFAULT 5000.00,
  bonus DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  currency CHAR(3) NOT NULL DEFAULT 'USD',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_wallet_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS deposits (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED NOT NULL,
  amount DECIMAL(15,2) NOT NULL,
  payment_method VARCHAR(80) NOT NULL,
  reference_number VARCHAR(120) NOT NULL,
  note TEXT NULL,
  status ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'pending',
  reviewed_at DATETIME NULL,
  reviewed_by INT UNSIGNED NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_deposit_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_deposit_reviewer FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS withdrawals (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED NOT NULL,
  amount DECIMAL(15,2) NOT NULL,
  bank_name VARCHAR(120) NOT NULL,
  account_number VARCHAR(80) NOT NULL,
  account_holder_name VARCHAR(120) NOT NULL,
  status ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'pending',
  reviewed_at DATETIME NULL,
  reviewed_by INT UNSIGNED NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_withdrawal_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_withdrawal_reviewer FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS transactions (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED NOT NULL,
  type ENUM('deposit', 'withdrawal', 'admin_add_balance', 'admin_deduct_balance', 'trade_profit', 'trade_loss', 'reset_demo') NOT NULL,
  amount DECIMAL(15,2) NOT NULL,
  balance_before DECIMAL(15,2) NULL,
  balance_after DECIMAL(15,2) NULL,
  note TEXT NULL,
  status ENUM('pending', 'approved', 'rejected', 'completed') NOT NULL DEFAULT 'pending',
  reference_type VARCHAR(40) NULL,
  reference_id INT UNSIGNED NULL,
  description VARCHAR(255) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_transactions_reference (reference_type, reference_id),
  CONSTRAINT fk_transaction_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS trades (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED NOT NULL,
  symbol VARCHAR(30) NOT NULL,
  side ENUM('BUY', 'SELL') NOT NULL,
  lots DECIMAL(10,2) NOT NULL,
  open_price DECIMAL(18,8) NOT NULL,
  close_price DECIMAL(18,8) NULL,
  profit DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  margin DECIMAL(15,2) NOT NULL,
  status ENUM('open', 'closed') NOT NULL DEFAULT 'open',
  closed_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_trades_user_status (user_id, status),
  CONSTRAINT fk_trade_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

DROP PROCEDURE IF EXISTS upgrade_admin_wallet_schema;
DELIMITER $$
CREATE PROCEDURE upgrade_admin_wallet_schema()
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'leverage') THEN
    ALTER TABLE users ADD COLUMN leverage INT UNSIGNED NOT NULL DEFAULT 100 AFTER account_type;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'trading_status') THEN
    ALTER TABLE users ADD COLUMN trading_status ENUM('active', 'frozen') NOT NULL DEFAULT 'active' AFTER leverage;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'admin_notes') THEN
    ALTER TABLE users ADD COLUMN admin_notes TEXT NULL AFTER trading_status;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'profile_image') THEN
    ALTER TABLE users ADD COLUMN profile_image LONGTEXT NULL AFTER phone;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'wallets' AND COLUMN_NAME = 'equity') THEN
    ALTER TABLE wallets ADD COLUMN equity DECIMAL(15,2) NOT NULL DEFAULT 5000.00 AFTER balance;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'wallets' AND COLUMN_NAME = 'margin') THEN
    ALTER TABLE wallets ADD COLUMN margin DECIMAL(15,2) NOT NULL DEFAULT 0.00 AFTER equity;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'wallets' AND COLUMN_NAME = 'free_funds') THEN
    ALTER TABLE wallets ADD COLUMN free_funds DECIMAL(15,2) NOT NULL DEFAULT 5000.00 AFTER margin;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'transactions' AND COLUMN_NAME = 'balance_before') THEN
    ALTER TABLE transactions ADD COLUMN balance_before DECIMAL(15,2) NULL AFTER amount;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'transactions' AND COLUMN_NAME = 'balance_after') THEN
    ALTER TABLE transactions ADD COLUMN balance_after DECIMAL(15,2) NULL AFTER balance_before;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'transactions' AND COLUMN_NAME = 'note') THEN
    ALTER TABLE transactions ADD COLUMN note TEXT NULL AFTER balance_after;
  END IF;
  ALTER TABLE transactions MODIFY COLUMN type ENUM('deposit', 'withdrawal', 'admin_add_balance', 'admin_deduct_balance', 'trade_profit', 'trade_loss', 'reset_demo') NOT NULL;
END$$
DELIMITER ;
CALL upgrade_admin_wallet_schema();
DROP PROCEDURE upgrade_admin_wallet_schema;
