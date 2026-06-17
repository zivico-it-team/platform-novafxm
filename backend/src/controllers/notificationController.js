const { Notification } = require('../models');

exports.list = async (req, res, next) => {
  try {
    const notifications = await Notification.findAll({
      where: { userId: req.user.id },
      order: [['createdAt', 'DESC']],
      limit: 50,
    });
    return res.json({ notifications });
  } catch (error) {
    return next(error);
  }
};

exports.unreadCount = async (req, res, next) => {
  try {
    const count = await Notification.count({ where: { userId: req.user.id, isRead: false } });
    return res.json({ count });
  } catch (error) {
    return next(error);
  }
};

exports.markRead = async (req, res, next) => {
  try {
    const notification = await Notification.findOne({ where: { id: req.params.id, userId: req.user.id } });
    if (!notification) return res.status(404).json({ message: 'Notification not found.' });
    await notification.update({ isRead: true });
    return res.json({ notification });
  } catch (error) {
    return next(error);
  }
};

exports.markAllRead = async (req, res, next) => {
  try {
    await Notification.update({ isRead: true }, { where: { userId: req.user.id, isRead: false } });
    return res.json({ success: true });
  } catch (error) {
    return next(error);
  }
};
