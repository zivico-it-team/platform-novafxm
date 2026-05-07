// Input validation middleware
const validateInput = (schema) => {
  return (req, res, next) => {
    const { body } = req;
    const errors = {};

    for (const [field, rules] of Object.entries(schema)) {
      const value = body[field];

      // Check required
      if (rules.required && !value) {
        errors[field] = `${field} is required`;
        continue;
      }

      if (!value) continue;

      // Check type
      if (rules.type && rules.type !== 'email' && typeof value !== rules.type) {
        errors[field] = `${field} must be of type ${rules.type}`;
        continue;
      }

      // Check email format
      if (rules.type === 'email') {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (typeof value !== 'string' || !emailRegex.test(value)) {
          errors[field] = 'Invalid email format';
          continue;
        }
      }

      // Check min length
      if (rules.minLength && value.length < rules.minLength) {
        errors[field] = `${field} must be at least ${rules.minLength} characters`;
        continue;
      }

      // Check min value
      if (rules.min !== undefined && value < rules.min) {
        errors[field] = `${field} must be at least ${rules.min}`;
        continue;
      }

      // Check max value
      if (rules.max !== undefined && value > rules.max) {
        errors[field] = `${field} must be at most ${rules.max}`;
        continue;
      }
    }

    if (Object.keys(errors).length > 0) {
      return res.status(400).json({ error: 'Validation failed', details: errors });
    }

    next();
  };
};

module.exports = { validateInput };
