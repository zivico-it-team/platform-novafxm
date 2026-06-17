const { Notification, User } = require('../models');

let io = null;

function setNotificationIo(socketServer) {
  io = socketServer;
}

async function createNotification({ userId, title, message, type = 'system', transaction }) {
  if (!userId || !title || !message) return null;
  const notification = await Notification.create({
    userId,
    title,
    message,
    type,
  }, { transaction });

  const payload = notification.toJSON();
  if (io) io.to(`user_${userId}`).emit('new_notification', payload);
  return notification;
}

async function createAdminNotifications({ title, message, type = 'admin', transaction }) {
  const admins = await User.findAll({ where: { role: 'admin' }, attributes: ['id'], transaction });
  return Promise.all(admins.map((adminUser) => createNotification({
    userId: adminUser.id,
    title,
    message,
    type,
    transaction,
  })));
}

module.exports = { createNotification, createAdminNotifications, setNotificationIo };
