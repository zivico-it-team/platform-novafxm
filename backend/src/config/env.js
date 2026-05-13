const parseAllowedOrigins = (value = '') => (
  value
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean)
);

const getEnv = () => ({
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT || 3002),
  allowedOrigins: parseAllowedOrigins(process.env.CORS_ORIGIN || ''),
  jwtSecret: process.env.JWT_SECRET || '',
  database: {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || '',
    password: process.env.DB_PASSWORD || '',
    name: process.env.DB_NAME || 'trading_platform',
  },
});

const validateEnv = (env = getEnv()) => {
  if (env.nodeEnv === 'production' && !env.jwtSecret) {
    throw new Error('JWT_SECRET is required in production');
  }

  return env;
};

module.exports = {
  getEnv,
  validateEnv,
};
