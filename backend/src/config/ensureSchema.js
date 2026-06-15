const { DataTypes } = require('sequelize');
const sequelize = require('./db');

const hasColumn = async (queryInterface, table, column) => {
  const description = await queryInterface.describeTable(table);
  return Boolean(description[column]);
};

const addColumnIfMissing = async (queryInterface, table, column, definition) => {
  if (!(await hasColumn(queryInterface, table, column))) {
    await queryInterface.addColumn(table, column, definition);
  }
};

async function ensureSchema() {
  const queryInterface = sequelize.getQueryInterface();

  await addColumnIfMissing(queryInterface, 'users', 'leverage', {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
    defaultValue: 100,
    after: 'account_type',
  });
  await addColumnIfMissing(queryInterface, 'users', 'trading_status', {
    type: DataTypes.ENUM('active', 'frozen'),
    allowNull: false,
    defaultValue: 'active',
    after: 'leverage',
  });
  await addColumnIfMissing(queryInterface, 'users', 'country', {
    type: DataTypes.STRING(80),
    allowNull: true,
    after: 'phone',
  });
  await addColumnIfMissing(queryInterface, 'users', 'date_of_birth', {
    type: DataTypes.STRING(20),
    allowNull: true,
    after: 'country',
  });
  await addColumnIfMissing(queryInterface, 'users', 'profile_image', {
    type: DataTypes.TEXT('long'),
    allowNull: true,
    after: 'date_of_birth',
  });
  await addColumnIfMissing(queryInterface, 'users', 'bank_account_holder', {
    type: DataTypes.STRING(120),
    allowNull: true,
    after: 'profile_image',
  });
  await addColumnIfMissing(queryInterface, 'users', 'bank_name', {
    type: DataTypes.STRING(120),
    allowNull: true,
    after: 'bank_account_holder',
  });
  await addColumnIfMissing(queryInterface, 'users', 'bank_branch', {
    type: DataTypes.STRING(120),
    allowNull: true,
    after: 'bank_name',
  });
  await addColumnIfMissing(queryInterface, 'users', 'bank_account_number', {
    type: DataTypes.STRING(80),
    allowNull: true,
    after: 'bank_branch',
  });
  await addColumnIfMissing(queryInterface, 'users', 'reset_password_token', {
    type: DataTypes.STRING(64),
    allowNull: true,
    after: 'password',
  });
  await addColumnIfMissing(queryInterface, 'users', 'reset_password_expires', {
    type: DataTypes.DATE,
    allowNull: true,
    after: 'reset_password_token',
  });
  await addColumnIfMissing(queryInterface, 'users', 'admin_notes', {
    type: DataTypes.TEXT,
    allowNull: true,
    after: 'trading_status',
  });
  await addColumnIfMissing(queryInterface, 'users', 'verification_status', {
    type: DataTypes.ENUM('unverified', 'pending', 'approved', 'rejected'),
    allowNull: false,
    defaultValue: 'unverified',
    after: 'admin_notes',
  });
  await addColumnIfMissing(queryInterface, 'users', 'id_proof_image', {
    type: DataTypes.TEXT('long'),
    allowNull: true,
    after: 'verification_status',
  });
  await addColumnIfMissing(queryInterface, 'users', 'address_proof_image', {
    type: DataTypes.TEXT('long'),
    allowNull: true,
    after: 'id_proof_image',
  });
  await addColumnIfMissing(queryInterface, 'users', 'verification_reviewed_at', {
    type: DataTypes.DATE,
    allowNull: true,
    after: 'address_proof_image',
  });
  await addColumnIfMissing(queryInterface, 'users', 'verification_reviewed_by', {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: true,
    after: 'verification_reviewed_at',
  });
  await addColumnIfMissing(queryInterface, 'users', 'referral_code', {
    type: DataTypes.STRING(40),
    allowNull: true,
    unique: true,
    after: 'admin_notes',
  });
  await addColumnIfMissing(queryInterface, 'users', 'referred_by_id', {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: true,
    after: 'referral_code',
  });

  await addColumnIfMissing(queryInterface, 'wallets', 'equity', {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false,
    defaultValue: 5000,
    after: 'balance',
  });
  await addColumnIfMissing(queryInterface, 'wallets', 'margin', {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false,
    defaultValue: 0,
    after: 'equity',
  });
  await addColumnIfMissing(queryInterface, 'wallets', 'free_funds', {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false,
    defaultValue: 5000,
    after: 'margin',
  });

  await addColumnIfMissing(queryInterface, 'transactions', 'balance_before', {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: true,
    after: 'amount',
  });
  await addColumnIfMissing(queryInterface, 'transactions', 'balance_after', {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: true,
    after: 'balance_before',
  });
  await addColumnIfMissing(queryInterface, 'transactions', 'note', {
    type: DataTypes.TEXT,
    allowNull: true,
    after: 'balance_after',
  });

  await addColumnIfMissing(queryInterface, 'deposits', 'receipt_image', {
    type: DataTypes.TEXT('long'),
    allowNull: true,
    after: 'reference_number',
  });
  await queryInterface.changeColumn('deposits', 'reference_number', {
    type: DataTypes.STRING(120),
    allowNull: true,
  });

  await addColumnIfMissing(queryInterface, 'withdrawals', 'withdrawal_method', {
    type: DataTypes.ENUM('Bank', 'Crypto'),
    allowNull: false,
    defaultValue: 'Bank',
    after: 'amount',
  });

  await addColumnIfMissing(queryInterface, 'trades', 'trading_account_id', {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: true,
    after: 'user_id',
  });

  await queryInterface.createTable('bank_accounts', {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    user_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: { model: 'users', key: 'id' },
      onDelete: 'CASCADE',
    },
    account_holder_name: { type: DataTypes.STRING(120), allowNull: false },
    bank_name: { type: DataTypes.STRING(120), allowNull: false },
    branch_name: { type: DataTypes.STRING(120), allowNull: true },
    account_number: { type: DataTypes.STRING(80), allowNull: false },
    status: { type: DataTypes.ENUM('pending', 'approved', 'rejected', 'delete_pending'), allowNull: false, defaultValue: 'pending' },
    reviewed_at: { type: DataTypes.DATE, allowNull: true },
    reviewed_by: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
    created_at: { type: DataTypes.DATE, allowNull: false },
    updated_at: { type: DataTypes.DATE, allowNull: false },
  }).catch((error) => {
    if (!['ER_TABLE_EXISTS_ERROR', 'SQLITE_ERROR'].includes(error?.parent?.code) && !String(error?.message || '').includes('already exists')) throw error;
  });
  await addColumnIfMissing(queryInterface, 'bank_accounts', 'status', {
    type: DataTypes.ENUM('pending', 'approved', 'rejected', 'delete_pending'),
    allowNull: false,
    defaultValue: 'pending',
    after: 'account_number',
  });
  await queryInterface.changeColumn('bank_accounts', 'status', {
    type: DataTypes.ENUM('pending', 'approved', 'rejected', 'delete_pending'),
    allowNull: false,
    defaultValue: 'pending',
  });
  await addColumnIfMissing(queryInterface, 'bank_accounts', 'reviewed_at', {
    type: DataTypes.DATE,
    allowNull: true,
    after: 'status',
  });
  await addColumnIfMissing(queryInterface, 'bank_accounts', 'reviewed_by', {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: true,
    after: 'reviewed_at',
  });
}

module.exports = ensureSchema;
