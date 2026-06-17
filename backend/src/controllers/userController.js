const bcrypt = require('bcryptjs');
const { User, Wallet, BankAccount } = require('../models');
const { createAdminNotifications } = require('../services/notificationService');

const countries = [
  { name: 'Sri Lanka', code: '+94' },
  { name: 'India', code: '+91' },
  { name: 'United States', code: '+1' },
  { name: 'United Kingdom', code: '+44' },
  { name: 'Canada', code: '+1' },
  { name: 'Australia', code: '+61' },
  { name: 'United Arab Emirates', code: '+971' },
  { name: 'Singapore', code: '+65' },
];

async function notifyAdmins(payload) {
  try {
    await createAdminNotifications(payload);
  } catch (error) {
    console.error('Admin notification delivery failed:', error.message);
  }
}

const countryByName = (name) => countries.find((country) => country.name === name);

const phoneWithoutDialCode = (phone) => String(phone || '').replace(/^\+\d{1,4}\s*/, '').trim();

const isValidDateOfBirth = (value) => {
  const match = /^(\d{2})\s*\/\s*(\d{2})\s*\/\s*(\d{4})$/.exec(String(value || '').trim());
  if (!match) return false;
  const [, dayValue, monthValue, yearValue] = match;
  const day = Number(dayValue);
  const month = Number(monthValue);
  const year = Number(yearValue);
  const date = new Date(year, month - 1, day);
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day && date < new Date();
};

exports.profile = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.user.id, { attributes: { exclude: ['password'] }, include: [{ model: Wallet, as: 'wallet' }] });
    return res.json({ user });
  } catch (error) {
    return next(error);
  }
};

exports.updateProfile = async (req, res, next) => {
  try {
    const {
      name,
      email,
      phone,
      country,
      dateOfBirth,
      profileImage,
      bankAccountHolder,
      bankName,
      bankBranch,
      bankAccountNumber,
    } = req.body;
    const selectedCountry = countryByName(country) || { name: String(country || '').trim(), code: null };
    const normalizedEmail = String(email || '').trim().toLowerCase();
    const normalizedPhone = String(phone || '').trim();
    const normalizedDateOfBirth = String(dateOfBirth || '').trim();

    if (!name?.trim() || name.trim().length < 2) return res.status(400).json({ message: 'Full name must be at least 2 characters.' });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) return res.status(400).json({ message: 'Enter a valid email address.' });
    if (!selectedCountry.name) return res.status(400).json({ message: 'Please select a country.' });
    if (selectedCountry.code && !normalizedPhone.startsWith(selectedCountry.code)) {
      return res.status(400).json({ message: `Phone number must start with ${selectedCountry.code}.` });
    }
    if (!/^\+\d{1,4}\s*\d/.test(normalizedPhone) || phoneWithoutDialCode(normalizedPhone).replace(/\D/g, '').length < 7) {
      return res.status(400).json({ message: 'Phone number must include a valid country code and number.' });
    }
    if (!isValidDateOfBirth(normalizedDateOfBirth)) return res.status(400).json({ message: 'Use a valid DD / MM / YYYY date of birth.' });
    if (profileImage && !isImageData(profileImage)) return res.status(400).json({ message: 'Profile photo must be a PNG, JPG or WEBP image.' });
    const existingEmailUser = await User.findOne({ where: { email: normalizedEmail } });
    if (existingEmailUser && String(existingEmailUser.id) !== String(req.user.id)) return res.status(409).json({ message: 'Email already registered.' });

    await User.update({
      name: name.trim(),
      email: normalizedEmail,
      phone: normalizedPhone,
      country: selectedCountry.name,
      dateOfBirth: normalizedDateOfBirth,
      profileImage: profileImage || null,
      bankAccountHolder: String(bankAccountHolder || '').trim() || null,
      bankName: String(bankName || '').trim() || null,
      bankBranch: String(bankBranch || '').trim() || null,
      bankAccountNumber: String(bankAccountNumber || '').trim() || null,
    }, { where: { id: req.user.id } });
    const user = await User.findByPk(req.user.id, { attributes: { exclude: ['password'] }, include: [{ model: Wallet, as: 'wallet' }] });
    return res.json({ user });
  } catch (error) {
    return next(error);
  }
};

exports.changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;
    if (!currentPassword) return res.status(400).json({ message: 'Current password is required.' });
    if (!newPassword || String(newPassword).length < 8) return res.status(400).json({ message: 'New password must be at least 8 characters.' });
    if (newPassword !== confirmPassword) return res.status(400).json({ message: 'New password and confirmation do not match.' });

    const user = await User.findByPk(req.user.id);
    if (!user || !(await bcrypt.compare(String(currentPassword), user.password))) {
      return res.status(401).json({ message: 'Current password is incorrect.' });
    }

    await user.update({ password: await bcrypt.hash(String(newPassword), 12) });
    return res.json({ message: 'Password updated successfully.' });
  } catch (error) {
    return next(error);
  }
};

exports.updateBankDetails = async (req, res, next) => {
  try {
    const bankAccountHolder = String(req.body.bankAccountHolder || '').trim();
    const bankName = String(req.body.bankName || '').trim();
    const bankBranch = String(req.body.bankBranch || '').trim();
    const bankAccountNumber = String(req.body.bankAccountNumber || '').trim();

    if (!bankAccountHolder || !bankName || !bankAccountNumber) {
      return res.status(400).json({ message: 'Account holder, bank name and account number are required.' });
    }

    await User.update({
      bankAccountHolder,
      bankName,
      bankBranch: bankBranch || null,
      bankAccountNumber,
    }, { where: { id: req.user.id } });
    const user = await User.findByPk(req.user.id, { attributes: { exclude: ['password'] }, include: [{ model: Wallet, as: 'wallet' }] });
    return res.json({ user, message: 'Bank account details saved successfully.' });
  } catch (error) {
    return next(error);
  }
};

exports.deleteBankDetails = async (req, res, next) => {
  try {
    await User.update({
      bankAccountHolder: null,
      bankName: null,
      bankBranch: null,
      bankAccountNumber: null,
    }, { where: { id: req.user.id } });
    const user = await User.findByPk(req.user.id, { attributes: { exclude: ['password'] }, include: [{ model: Wallet, as: 'wallet' }] });
    return res.json({ user, message: 'Bank account details deleted successfully.' });
  } catch (error) {
    return next(error);
  }
};

const bankPayload = (body) => ({
  accountHolderName: String(body.accountHolderName || body.bankAccountHolder || '').trim(),
  bankName: String(body.bankName || '').trim(),
  branchName: String(body.branchName || body.bankBranch || '').trim() || null,
  accountNumber: String(body.accountNumber || body.bankAccountNumber || '').trim(),
});
const isTrc20Account = (account) => String(`${account?.bankName || ''} ${account?.branchName || ''}`).toLowerCase().includes('trc20');
const payoutTypeForPayload = (payload) => (isTrc20Account(payload) ? 'TRC20' : 'Bank');
const limitWithdrawalDetails = (accounts) => ['Bank', 'TRC20']
  .map((payoutType) => accounts.find((account) => payoutTypeForPayload(account) === payoutType))
  .filter(Boolean);
const validateBankPayload = (payload) => {
  if (!payload.accountHolderName || !payload.bankName || !payload.accountNumber) {
    return 'Account holder, bank name and account number are required.';
  }
  return null;
};

exports.listBankAccounts = async (req, res, next) => {
  try {
    let accounts = await BankAccount.findAll({
      where: { userId: req.user.id },
      order: [['createdAt', 'DESC']],
    });
    if (!accounts.length) {
      const user = await User.findByPk(req.user.id);
      if (user?.bankAccountHolder && user?.bankName && user?.bankAccountNumber) {
        await BankAccount.create({
          userId: req.user.id,
          accountHolderName: user.bankAccountHolder,
          bankName: user.bankName,
          branchName: user.bankBranch || null,
          accountNumber: user.bankAccountNumber,
          status: 'approved',
          reviewedAt: new Date(),
          reviewedBy: req.user.id,
        });
        await user.update({
          bankAccountHolder: null,
          bankName: null,
          bankBranch: null,
          bankAccountNumber: null,
        });
        accounts = await BankAccount.findAll({
          where: { userId: req.user.id },
          order: [['createdAt', 'DESC']],
        });
      }
    }
    return res.json({ accounts: limitWithdrawalDetails(accounts) });
  } catch (error) {
    return next(error);
  }
};

exports.createBankAccount = async (req, res, next) => {
  try {
    const payload = bankPayload(req.body);
    const validationError = validateBankPayload(payload);
    if (validationError) return res.status(400).json({ message: validationError });
    const payoutType = payoutTypeForPayload(payload);

    const accounts = await BankAccount.findAll({
      where: { userId: req.user.id },
      order: [['createdAt', 'DESC']],
    });
    const existingAccount = accounts.find((account) => payoutTypeForPayload(account) === payoutType);
    if (existingAccount) {
      await existingAccount.update({ ...payload, status: 'pending', reviewedAt: null, reviewedBy: null });
      await notifyAdmins({
        title: `${payoutType} Details Updated`,
        message: `${req.user.name || req.user.email} updated ${payoutType} withdrawal details for approval.`,
        type: 'admin',
      });
      return res.json({ account: existingAccount, message: `${payoutType} details updated and submitted for admin approval.` });
    }

    const account = await BankAccount.create({ ...payload, userId: req.user.id, status: 'pending', reviewedAt: null, reviewedBy: null });
    await notifyAdmins({
      title: `New ${payoutType} Details`,
      message: `${req.user.name || req.user.email} submitted ${payoutType} withdrawal details for approval.`,
      type: 'admin',
    });
    return res.status(201).json({ account, message: `${payoutType} details submitted for admin approval.` });
  } catch (error) {
    return next(error);
  }
};

exports.updateBankAccount = async (req, res, next) => {
  try {
    const payload = bankPayload(req.body);
    const validationError = validateBankPayload(payload);
    if (validationError) return res.status(400).json({ message: validationError });

    const account = await BankAccount.findOne({ where: { id: req.params.id, userId: req.user.id } });
    if (!account) return res.status(404).json({ message: 'Bank account not found.' });
    const nextPayoutType = payoutTypeForPayload(payload);
    const currentPayoutType = payoutTypeForPayload(account);
    if (nextPayoutType !== currentPayoutType) {
      return res.status(400).json({ message: `${currentPayoutType} details cannot be changed into ${nextPayoutType} details.` });
    }
    await account.update({ ...payload, status: 'pending', reviewedAt: null, reviewedBy: null });
    await notifyAdmins({
      title: `${currentPayoutType} Details Updated`,
      message: `${req.user.name || req.user.email} updated ${currentPayoutType} withdrawal details for approval.`,
      type: 'admin',
    });
    return res.json({ account, message: `${currentPayoutType} details updated and submitted for admin approval.` });
  } catch (error) {
    return next(error);
  }
};

exports.deleteBankAccount = async (req, res, next) => {
  try {
    const account = await BankAccount.findOne({ where: { id: req.params.id, userId: req.user.id } });
    if (!account) return res.status(404).json({ message: 'Bank account not found.' });
    await account.update({ status: 'delete_pending', reviewedAt: null, reviewedBy: null });
    await notifyAdmins({
      title: 'Withdrawal Details Delete Request',
      message: `${req.user.name || req.user.email} requested withdrawal details deletion approval.`,
      type: 'admin',
    });
    return res.json({ account, message: 'Bank account deletion request submitted for admin approval.' });
  } catch (error) {
    return next(error);
  }
};

const isImageData = (value) => /^data:image\/(png|jpe?g|webp);base64,/i.test(String(value || ''));

exports.submitVerification = async (req, res, next) => {
  try {
    const { idProofImage, addressProofImage } = req.body;
    if (!isImageData(idProofImage) || !isImageData(addressProofImage)) {
      return res.status(400).json({ message: 'ID proof and address proof photos are required.' });
    }
    const user = await User.findByPk(req.user.id, { attributes: { exclude: ['password'] } });
    await user.update({
      idProofImage,
      addressProofImage,
      verificationStatus: 'pending',
      verificationReviewedAt: null,
      verificationReviewedBy: null,
      tradingStatus: 'frozen',
    });
    await notifyAdmins({
      title: 'New Verification Request',
      message: `${user.name || user.email} submitted verification documents for review.`,
      type: 'kyc',
    });
    return res.json({ user });
  } catch (error) {
    return next(error);
  }
};
