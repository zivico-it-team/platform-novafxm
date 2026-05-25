const sequelize = require('../config/db');
const { User, Wallet, Deposit, Withdrawal, Transaction, Trade } = require('../models');

exports.users = async (req, res, next) => {
  try {
    return res.json({ users: await User.findAll({ attributes: { exclude: ['password'] }, include: [{ model: Wallet, as: 'wallet' }], order: [['createdAt', 'DESC']] }) });
  } catch (error) { return next(error); }
};
exports.deposits = async (req, res, next) => {
  try { return res.json({ deposits: await Deposit.findAll({ include: [{ model: User, attributes: ['email', 'name'] }], order: [['createdAt', 'DESC']] }) }); } catch (error) { return next(error); }
};
exports.withdrawals = async (req, res, next) => {
  try { return res.json({ withdrawals: await Withdrawal.findAll({ include: [{ model: User, attributes: ['email', 'name'] }], order: [['createdAt', 'DESC']] }) }); } catch (error) { return next(error); }
};
exports.trades = async (req, res, next) => {
  try { return res.json({ trades: await Trade.findAll({ include: [{ model: User, attributes: ['email', 'name'] }], order: [['createdAt', 'DESC']] }) }); } catch (error) { return next(error); }
};

exports.reviewDeposit = (status) => async (req, res, next) => {
  try {
    let result;
    await sequelize.transaction(async (transaction) => {
      const deposit = await Deposit.findByPk(req.params.id, { transaction, lock: transaction.LOCK.UPDATE });
      if (!deposit || deposit.status !== 'pending') throw Object.assign(new Error('Pending deposit not found.'), { status: 404 });
      await deposit.update({ status, reviewedAt: new Date(), reviewedBy: req.user.id }, { transaction });
      if (status === 'approved') {
        const wallet = await Wallet.findOne({ where: { userId: deposit.userId }, transaction, lock: transaction.LOCK.UPDATE });
        await wallet.increment({ balance: Number(deposit.amount) }, { transaction });
      }
      await Transaction.update({ status: status === 'approved' ? 'completed' : 'rejected' }, { where: { referenceType: 'deposit', referenceId: deposit.id }, transaction });
      result = deposit;
    });
    return res.json({ deposit: result });
  } catch (error) { return next(error); }
};

exports.reviewWithdrawal = (status) => async (req, res, next) => {
  try {
    let result;
    await sequelize.transaction(async (transaction) => {
      const withdrawal = await Withdrawal.findByPk(req.params.id, { transaction, lock: transaction.LOCK.UPDATE });
      if (!withdrawal || withdrawal.status !== 'pending') throw Object.assign(new Error('Pending withdrawal not found.'), { status: 404 });
      if (status === 'approved') {
        const wallet = await Wallet.findOne({ where: { userId: withdrawal.userId }, transaction, lock: transaction.LOCK.UPDATE });
        if (Number(wallet.balance) < Number(withdrawal.amount)) throw Object.assign(new Error('User balance is insufficient for approval.'), { status: 400 });
        await wallet.decrement({ balance: Number(withdrawal.amount) }, { transaction });
      }
      await withdrawal.update({ status, reviewedAt: new Date(), reviewedBy: req.user.id }, { transaction });
      await Transaction.update({ status: status === 'approved' ? 'completed' : 'rejected' }, { where: { referenceType: 'withdrawal', referenceId: withdrawal.id }, transaction });
      result = withdrawal;
    });
    return res.json({ withdrawal: result });
  } catch (error) { return next(error); }
};
