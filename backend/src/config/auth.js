const DEV_JWT_SECRET = 'novafxm-local-development-secret';

const getJwtSecret = () => {
  if (process.env.JWT_SECRET) {
    return process.env.JWT_SECRET;
  }

  if (process.env.NODE_ENV === 'production') {
    throw new Error('JWT_SECRET is not configured');
  }

  return DEV_JWT_SECRET;
};

module.exports = { getJwtSecret };
