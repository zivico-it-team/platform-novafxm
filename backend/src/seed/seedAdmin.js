require('dotenv').config({ quiet: true });
const bcrypt = require('bcryptjs');
const sequelize = require('../config/db');
const { User, Wallet } = require('../models');
const ensureSchema = require('../config/ensureSchema');

async function seedAdmin() {
  const password = await bcrypt.hash('Admin@123', 12);
  const [admin] = await User.findOrCreate({
    where: { email: 'admin@novafxm.com' },
    defaults: { name: 'NOVA FXM Admin', phone: null, password, role: 'admin', accountType: 'Live' },
  });
  if (admin.role !== 'admin') await admin.update({ password, role: 'admin', accountType: 'Live' });
  await Wallet.findOrCreate({ where: { userId: admin.id }, defaults: { balance: 0 } });
  return admin;
}

if (require.main === module) {
  sequelize.authenticate()
    .then(() => sequelize.sync())
    .then(ensureSchema)
    .then(seedAdmin)
    .then(() => {
      console.log('Administrator account is ready: admin@novafxm.com');
      return sequelize.close();
    })
    .catch((error) => {
      console.error('Unable to seed administrator:', error.message);
      process.exitCode = 1;
    });
}

module.exports = seedAdmin;
