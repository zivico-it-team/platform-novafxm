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
    const { name, phone, profileImage } = req.body;
    if (!name?.trim()) return res.status(400).json({ message: 'Name is required.' });
    await User.update(
      { name: name.trim(), phone: phone?.trim() || null, profileImage: profileImage || null },
      { where: { id: req.user.id } },
    );
    const user = await User.findByPk(req.user.id, { attributes: { exclude: ['password'] }, include: [{ model: Wallet, as: 'wallet' }] });
    return res.json({ user });
  } catch (error) {
    return next(error);
  }
};
