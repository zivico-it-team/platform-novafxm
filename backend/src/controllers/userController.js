const { User, Wallet } = require('../models');

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
    const { name, phone } = req.body;
    if (!name?.trim()) return res.status(400).json({ message: 'Name is required.' });
    await User.update({ name: name.trim(), phone: phone?.trim() || null }, { where: { id: req.user.id } });
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
