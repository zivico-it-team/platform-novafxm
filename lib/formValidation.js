const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const USERNAME_REGEX = /^[a-zA-Z0-9_]+$/;

export const validateEmail = (email) => {
  const value = email.trim();

  if (!value) return 'Email is required';
  if (!EMAIL_REGEX.test(value)) return 'Enter a valid email address';

  return '';
};

export const validatePassword = (password, { minLength = 6 } = {}) => {
  if (!password) return 'Password is required';
  if (password.length < minLength) {
    return `Password must be at least ${minLength} characters`;
  }

  return '';
};

export const validateUsername = (username) => {
  const value = username.trim();

  if (!value) return 'Username is required';
  if (value.length < 3) return 'Username must be at least 3 characters';
  if (value.length > 30) return 'Username must be 30 characters or less';
  if (!USERNAME_REGEX.test(value)) {
    return 'Username can only use letters, numbers, and underscores';
  }

  return '';
};

export const validateLoginForm = ({ email, password }) => ({
  email: validateEmail(email),
  password: validatePassword(password, { minLength: 1 }),
});

export const validateRegisterForm = ({ email, username, password, confirmPassword }) => {
  const errors = {
    email: validateEmail(email),
    username: validateUsername(username),
    password: validatePassword(password),
    confirmPassword: '',
  };

  if (!confirmPassword) {
    errors.confirmPassword = 'Confirm your password';
  } else if (password && confirmPassword !== password) {
    errors.confirmPassword = 'Passwords do not match';
  }

  return errors;
};

export const hasValidationErrors = (errors) => Object.values(errors).some(Boolean);
