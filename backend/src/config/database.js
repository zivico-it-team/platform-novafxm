const mysql = require('mysql2/promise');
require('dotenv').config();

let databaseAvailable = false;

const pool = mysql.createPool({
  host: process.env.DB_HOST || '127.0.0.1',
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

const initializeDatabase = async () => {
  let connection;

  try {
    connection = await pool.getConnection();

    // Create users table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id INT PRIMARY KEY AUTO_INCREMENT,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        username VARCHAR(100) UNIQUE NOT NULL,
        role ENUM('customer', 'admin') DEFAULT 'customer',
        account_type ENUM('demo', 'live') DEFAULT 'demo',
        balance DECIMAL(15, 2) DEFAULT 10000,
        equity DECIMAL(15, 2) DEFAULT 10000,
        used_margin DECIMAL(15, 2) DEFAULT 0,
        free_margin DECIMAL(15, 2) DEFAULT 10000,
        margin_level DECIMAL(10, 2) DEFAULT 0,
        leverage INT DEFAULT 200,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    try {
      await connection.execute(`
        ALTER TABLE users
        ADD COLUMN account_type ENUM('demo', 'live') DEFAULT 'demo' AFTER username
      `);
    } catch (error) {
      if (error.code !== 'ER_DUP_FIELDNAME') {
        throw error;
      }
    }

    try {
      await connection.execute(`
        ALTER TABLE users
        ADD COLUMN role ENUM('customer', 'admin') DEFAULT 'customer' AFTER username
      `);
    } catch (error) {
      if (error.code !== 'ER_DUP_FIELDNAME') {
        throw error;
      }
    }

    // Create trades table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS trades (
        id INT PRIMARY KEY AUTO_INCREMENT,
        user_id INT NOT NULL,
        account_id INT,
        symbol VARCHAR(50) NOT NULL,
        type ENUM('buy', 'sell') NOT NULL,
        lot_size DECIMAL(10, 2) NOT NULL,
        open_price DECIMAL(15, 5) NOT NULL,
        close_price DECIMAL(15, 5),
        take_profit DECIMAL(15, 5),
        stop_loss DECIMAL(15, 5),
        pnl DECIMAL(15, 2),
        status ENUM('open', 'closed') DEFAULT 'open',
        opened_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        closed_at TIMESTAMP NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_user_id (user_id),
        INDEX idx_account_id (account_id),
        INDEX idx_symbol (symbol)
      )
    `);

    await connection.execute(`
      CREATE TABLE IF NOT EXISTS trading_accounts (
        id INT PRIMARY KEY AUTO_INCREMENT,
        user_id INT NOT NULL,
        account_number VARCHAR(50) UNIQUE NOT NULL,
        account_type ENUM('demo', 'live') DEFAULT 'demo',
        name VARCHAR(100) NOT NULL,
        balance DECIMAL(15, 2) DEFAULT 0,
        bonus DECIMAL(15, 2) DEFAULT 0,
        equity DECIMAL(15, 2) DEFAULT 0,
        used_margin DECIMAL(15, 2) DEFAULT 0,
        free_margin DECIMAL(15, 2) DEFAULT 0,
        margin_level DECIMAL(10, 2) DEFAULT 0,
        leverage INT DEFAULT 200,
        status ENUM('active', 'archived') DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_user_id (user_id),
        INDEX idx_account_type (account_type)
      )
    `);

    // Create trade history table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS trade_history (
        id INT PRIMARY KEY AUTO_INCREMENT,
        user_id INT NOT NULL,
        account_id INT,
        symbol VARCHAR(50) NOT NULL,
        type ENUM('buy', 'sell') NOT NULL,
        lot_size DECIMAL(10, 2) NOT NULL,
        open_price DECIMAL(15, 5) NOT NULL,
        close_price DECIMAL(15, 5) NOT NULL,
        pnl DECIMAL(15, 2) NOT NULL,
        margin_used DECIMAL(15, 2),
        opened_at TIMESTAMP,
        closed_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_user_id (user_id)
      )
    `);

    try {
      await connection.execute(`
        ALTER TABLE trades
        ADD COLUMN account_id INT AFTER user_id
      `);
    } catch (error) {
      if (error.code !== 'ER_DUP_FIELDNAME') {
        throw error;
      }
    }

    try {
      await connection.execute(`
        ALTER TABLE trade_history
        ADD COLUMN account_id INT AFTER user_id
      `);
    } catch (error) {
      if (error.code !== 'ER_DUP_FIELDNAME') {
        throw error;
      }
    }

    try {
      await connection.execute('ALTER TABLE trades ADD INDEX idx_account_id (account_id)');
    } catch (error) {
      if (error.code !== 'ER_DUP_KEYNAME') {
        throw error;
      }
    }

    try {
      await connection.execute('ALTER TABLE trade_history ADD INDEX idx_account_id (account_id)');
    } catch (error) {
      if (error.code !== 'ER_DUP_KEYNAME') {
        throw error;
      }
    }

    try {
      await connection.execute(`
        ALTER TABLE trading_accounts
        ADD COLUMN bonus DECIMAL(15, 2) DEFAULT 0 AFTER balance
      `);
    } catch (error) {
      if (error.code !== 'ER_DUP_FIELDNAME') {
        throw error;
      }
    }

    try {
      await connection.execute(`
        ALTER TABLE trading_accounts
        ADD COLUMN margin_level DECIMAL(10, 2) DEFAULT 0 AFTER free_margin
      `);
    } catch (error) {
      if (error.code !== 'ER_DUP_FIELDNAME') {
        throw error;
      }
    }

    // Create prices table for storing historical prices
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS prices (
        id INT PRIMARY KEY AUTO_INCREMENT,
        symbol VARCHAR(50) NOT NULL,
        bid DECIMAL(15, 5) NOT NULL,
        ask DECIMAL(15, 5) NOT NULL,
        mid DECIMAL(15, 5) NOT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_symbol (symbol)
      )
    `);

    await connection.execute(`
      CREATE TABLE IF NOT EXISTS admin_transactions (
        id INT PRIMARY KEY AUTO_INCREMENT,
        admin_user_id INT NOT NULL,
        account_id INT NOT NULL,
        user_id INT NOT NULL,
        account_number VARCHAR(50) NOT NULL,
        type ENUM('credit', 'debit', 'bonus_credit', 'bonus_debit') NOT NULL,
        amount DECIMAL(15, 2) NOT NULL,
        previous_balance DECIMAL(15, 2) NOT NULL,
        new_balance DECIMAL(15, 2) NOT NULL,
        note VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_account_id (account_id),
        INDEX idx_admin_user_id (admin_user_id)
      )
    `);

    try {
      await connection.execute(`
        ALTER TABLE admin_transactions
        MODIFY COLUMN type ENUM('credit', 'debit', 'bonus_credit', 'bonus_debit') NOT NULL
      `);
    } catch (error) {
      if (error.code !== 'ER_BAD_FIELD_ERROR') {
        throw error;
      }
    }

    await connection.execute(`
      CREATE TABLE IF NOT EXISTS bank_infos (
        id INT PRIMARY KEY AUTO_INCREMENT,
        user_id INT NOT NULL,
        bank_account_number VARCHAR(100) NOT NULL,
        account_holder_name VARCHAR(150) NOT NULL,
        bank_name VARCHAR(150) NOT NULL,
        branch VARCHAR(150) NOT NULL,
        swift_code VARCHAR(100),
        bank_account_alias VARCHAR(150),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_user_id (user_id)
      )
    `);

    await connection.execute(`
      CREATE TABLE IF NOT EXISTS account_documents (
        id INT PRIMARY KEY AUTO_INCREMENT,
        user_id INT NOT NULL,
        document_type VARCHAR(100) NOT NULL,
        file_name VARCHAR(255) NOT NULL,
        file_size INT DEFAULT 0,
        mime_type VARCHAR(100),
        link VARCHAR(255),
        status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
        reason VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        processed_at TIMESTAMP NULL,
        processed_by INT,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_user_id (user_id),
        INDEX idx_status (status)
      )
    `);

    console.log('Database initialized successfully');
    databaseAvailable = true;
  } catch (error) {
    databaseAvailable = false;
    console.error('Error initializing database:', error.message);
    console.error('Make sure MySQL is running and that backend/.env has the correct DB_HOST, DB_USER, DB_PASSWORD, and DB_NAME values.');
    console.warn('Falling back to the local development data store.');
  } finally {
    if (connection) {
      connection.release();
    }
  }
};

module.exports = {
  pool,
  initializeDatabase,
  isDatabaseAvailable: () => databaseAvailable,
};
