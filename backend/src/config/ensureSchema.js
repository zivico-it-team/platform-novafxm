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
}

module.exports = ensureSchema;
