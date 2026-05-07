const { pool, isDatabaseAvailable } = require('../config/database');
const localStore = require('../lib/localStore');

const adminMiddleware = async (req, res, next) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!isDatabaseAvailable()) {
      if (localStore.isAdmin(req.userId)) {
        return next();
      }

      return res.status(403).json({ error: 'Admin access required' });
    }

    const connection = await pool.getConnection();
    const [users] = await connection.execute(
      'SELECT email, role FROM users WHERE id = ?',
      [req.userId]
    );
    connection.release();

    const user = users[0];
    if (user && (user.role === 'admin' || user.email === process.env.ADMIN_EMAIL)) {
      return next();
    }

    return res.status(403).json({ error: 'Admin access required' });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

module.exports = adminMiddleware;
