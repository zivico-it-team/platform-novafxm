const { Op } = require('sequelize');
const { Wallet, Deposit, Withdrawal, Transaction, Trade } = require('../models');
const tradingView = require('../services/tradingViewService');

const contractSize = (symbol) => (symbol.includes('BTC') || symbol.includes('ETH') || symbol === 'US500' ? 1 : symbol.includes('XAU') || symbol.includes('OIL') ? 100 : 100000);
const profitFor = (trade, price) => (Number(price) - Number(trade.openPrice)) * (trade.side === 'BUY' ? 1 : -1) * Number(trade.lots) * contractSize(trade.symbol);

exports.getWallet = async (req, res, next) => {
  try {
    const wallet = await Wallet.findOne({ where: { userId: req.user.id } });
    const trades = await Trade.findAll({ where: { userId: req.user.id, status: 'open' } });
    const prices = await tradingView.getPrices();
    const openProfit = trades.reduce((sum, trade) => {
      const market = prices.find((item) => item.symbol === trade.symbol);
      return sum + profitFor(trade, market?.price || trade.openPrice);
    }, 0);
    const margin = trades.reduce((sum, trade) => sum + Number(trade.margin), 0);
    const balance = Number(wallet.balance);
    const equity = balance + openProfit;
    return res.json({ wallet, summary: { balance, equity, margin, freeFunds: equity - margin, marginLevel: margin ? (equity / margin) * 100 : 0, openProfit } });
  } catch (error) {
    return next(error);
  }
};

exports.transactions = async (req, res, next) => {
  try {
    const transactions = await Transaction.findAll({ where: { userId: req.user.id }, order: [['createdAt', 'DESC']] });
    return res.json({ transactions });
  } catch (error) {
    return next(error);
  }
};

exports.deposit = async (req, res, next) => {
  try {
    const { amount, paymentMethod, referenceNumber, note, receiptImage } = req.body;
    if (!(Number(amount) > 0) || !paymentMethod || !referenceNumber) return res.status(400).json({ message: 'Valid amount, payment method and reference number are required.' });
    if (!receiptImage || typeof receiptImage !== 'string' || !/^data:image\/(png|jpe?g|webp);base64,/i.test(receiptImage)) {
      return res.status(400).json({ message: 'A valid receipt image is required for deposit approval.' });
    }
    if (receiptImage.length > 5_500_000) {
      return res.status(400).json({ message: 'Receipt image is too large. Please upload an image below 3 MB.' });
    }
    const deposit = await Deposit.create({ userId: req.user.id, amount, paymentMethod, referenceNumber, receiptImage, note });
    await Transaction.create({ userId: req.user.id, type: 'deposit', amount, status: 'pending', referenceType: 'deposit', referenceId: deposit.id, description: `Deposit via ${paymentMethod}` });
    return res.status(201).json({ deposit });
  } catch (error) {
    return next(error);
  }
};

exports.withdraw = async (req, res, next) => {
  try {
    const { amount, bankName, accountNumber, accountHolderName } = req.body;
    if (!(Number(amount) > 0) || !bankName || !accountNumber || !accountHolderName) return res.status(400).json({ message: 'All withdrawal details are required.' });
    const wallet = await Wallet.findOne({ where: { userId: req.user.id } });
    const pending = await Withdrawal.sum('amount', { where: { userId: req.user.id, status: 'pending' } });
    if (Number(amount) > Number(wallet.balance) - Number(pending || 0)) return res.status(400).json({ message: 'Insufficient withdrawable balance.' });
    const withdrawal = await Withdrawal.create({ userId: req.user.id, amount, bankName, accountNumber, accountHolderName });
    await Transaction.create({ userId: req.user.id, type: 'withdrawal', amount, status: 'pending', referenceType: 'withdrawal', referenceId: withdrawal.id, description: `Withdrawal to ${bankName}` });
    return res.status(201).json({ withdrawal });
  } catch (error) {
    return next(error);
  }
};
