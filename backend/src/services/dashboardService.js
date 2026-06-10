const { Op } = require('sequelize');
const { User, Wallet, Transaction, TradingAccount } = require('../models');

const money = (value) => Number(Number(value || 0).toFixed(2));

const referralCodeFor = (user) => `NVX${String(user.id).padStart(6, '0')}`;
const MAX_ACCOUNTS_PER_TYPE = 2;

async function ensureReferralCode(user) {
  if (user.referralCode) return user.referralCode;
  const referralCode = referralCodeFor(user);
  await user.update({ referralCode });
  return referralCode;
}

async function ensureDefaultAccounts(user, wallet) {
  const count = await TradingAccount.count({ where: { userId: user.id } });
  if (count > 0) return;

  const demoBalance = user.accountType === 'Demo' ? money(wallet?.balance || 5000) : 5000;
  await TradingAccount.bulkCreate([
    {
      userId: user.id,
      type: 'Demo',
      name: 'Demo account 1',
      balance: demoBalance,
      status: 'active',
      isPrimary: user.accountType !== 'Live',
    },
    {
      userId: user.id,
      type: 'Live',
      name: 'Live account 1',
      balance: user.accountType === 'Live' ? money(wallet?.balance || 0) : 0,
      status: 'active',
      isPrimary: user.accountType === 'Live',
    },
  ]);
}

async function dashboardForUser(userId, origin = '') {
  const user = await User.findByPk(userId, {
    attributes: { exclude: ['password'] },
    include: [{ model: Wallet, as: 'wallet' }],
  });
  if (!user) throw Object.assign(new Error('User not found.'), { status: 404 });

  const referralCode = await ensureReferralCode(user);
  await ensureDefaultAccounts(user, user.wallet);
  await TradingAccount.update({ status: 'active' }, { where: { userId, type: 'Live', status: 'pending' } });

  const [accounts, transactions, referrals, referrer] = await Promise.all([
    TradingAccount.findAll({ where: { userId }, order: [['createdAt', 'ASC']] }),
    Transaction.findAll({ where: { userId }, order: [['createdAt', 'DESC']], limit: 25 }),
    User.findAll({
      where: { referredById: userId },
      attributes: ['id', 'name', 'email', 'accountType', 'createdAt'],
      order: [['createdAt', 'DESC']],
    }),
    user.referredById
      ? User.findByPk(user.referredById, { attributes: ['id', 'name', 'email', 'referralCode'] })
      : null,
  ]);

  const referralIds = referrals.map((item) => item.id);
  const [approvedDeposits, pendingDeposits] = referralIds.length
    ? await Promise.all([
      Transaction.sum('amount', {
        where: { userId: { [Op.in]: referralIds }, type: 'deposit', status: { [Op.in]: ['approved', 'completed'] } },
      }),
      Transaction.sum('amount', {
        where: { userId: { [Op.in]: referralIds }, type: 'deposit', status: 'pending' },
      }),
    ])
    : [0, 0];
  const referralCommissionRate = Number(process.env.REFERRAL_COMMISSION_RATE || 0.05);
  const referralCommission = money(Number(approvedDeposits || 0) * referralCommissionRate);
  const baseUrl = origin || process.env.FRONTEND_URL || 'http://localhost:8081';

  return {
    user: user.toJSON(),
    wallet: user.wallet,
    accounts,
    transactions,
    referral: {
      code: referralCode,
      url: `${baseUrl.replace(/\/$/, '')}/register?ref=${encodeURIComponent(referralCode)}`,
      commissionRate: referralCommissionRate,
      commission: referralCommission,
      approvedDeposits: money(approvedDeposits),
      pendingDeposits: money(pendingDeposits),
      referralCount: referrals.length,
      referrer,
      referrals,
    },
  };
}

async function createTradingAccount(userId, type) {
  const accountType = type === 'Live' ? 'Live' : 'Demo';
  const existingCount = await TradingAccount.count({ where: { userId, type: accountType } });
  if (existingCount >= MAX_ACCOUNTS_PER_TYPE) {
    throw Object.assign(new Error(`You can create only ${MAX_ACCOUNTS_PER_TYPE} ${accountType.toLowerCase()} accounts.`), { status: 400 });
  }
  const balance = accountType === 'Demo' ? 5000 : 0;
  const account = await TradingAccount.create({
    userId,
    type: accountType,
    name: `${accountType} account ${existingCount + 1}`,
    balance,
    status: 'active',
    isPrimary: false,
  });
  return account;
}

module.exports = {
  createTradingAccount,
  dashboardForUser,
  ensureReferralCode,
};
