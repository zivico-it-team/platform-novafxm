const User = require('./User');
const Wallet = require('./Wallet');
const Deposit = require('./Deposit');
const Withdrawal = require('./Withdrawal');
const Transaction = require('./Transaction');
const Trade = require('./Trade');

User.hasOne(Wallet, { foreignKey: 'userId', as: 'wallet' });
Wallet.belongsTo(User, { foreignKey: 'userId' });
User.hasMany(Deposit, { foreignKey: 'userId' });
Deposit.belongsTo(User, { foreignKey: 'userId' });
User.hasMany(Withdrawal, { foreignKey: 'userId' });
Withdrawal.belongsTo(User, { foreignKey: 'userId' });
User.hasMany(Transaction, { foreignKey: 'userId' });
Transaction.belongsTo(User, { foreignKey: 'userId' });
User.hasMany(Trade, { foreignKey: 'userId' });
Trade.belongsTo(User, { foreignKey: 'userId' });

module.exports = { User, Wallet, Deposit, Withdrawal, Transaction, Trade };
