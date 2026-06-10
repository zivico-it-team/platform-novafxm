const { User, Wallet } = require('../models');

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
    const { name, email, phone, country, dateOfBirth, profileImage } = req.body;
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
    }, { where: { id: req.user.id } });
    const user = await User.findByPk(req.user.id, { attributes: { exclude: ['password'] }, include: [{ model: Wallet, as: 'wallet' }] });
    return res.json({ user });
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
    return res.json({ user });
  } catch (error) {
    return next(error);
  }
};
