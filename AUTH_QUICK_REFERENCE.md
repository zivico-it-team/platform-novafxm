# Authentication Quick Reference

## Files Created

```
context/
├── AuthContext.js              - Main auth context provider
├── useAuth.js                  - Hook to access auth state
└── ProtectedRoute.js           - HOC to protect routes

app/
├── layout.js                   - Updated with AuthProvider
├── page.js                     - Updated with ProtectedRoute
├── login/page.js               - Login form
└── register/page.js            - Registration form

components/
├── Navbar.js                   - Updated with logout menu
└── AuthenticationExamples.js   - Example usage patterns

Documentation/
├── AUTH_GUIDE.md               - Comprehensive guide
└── AUTH_QUICK_REFERENCE.md     - This file
```

## Quick Setup Checklist

- ✅ Created AuthContext.js (main context)
- ✅ Created useAuth.js (custom hook)
- ✅ Created ProtectedRoute.js (route protection)
- ✅ Updated app/layout.js (wrapped with AuthProvider)
- ✅ Created login/page.js (login form)
- ✅ Created register/page.js (registration form)
- ✅ Updated app/page.js (protected with ProtectedRoute)
- ✅ Updated Navbar.js (logout functionality)
- ✅ Created examples component

## Common Usage Patterns

### Check if user is logged in
```javascript
const { isAuthenticated } = useAuth();
if (isAuthenticated) { /* show content */ }
```

### Get user info
```javascript
const { user } = useAuth();
console.log(user.email); // logged-in user's email
```

### Get authentication token
```javascript
const { token } = useAuth();
// Use in API calls: headers: { Authorization: `Bearer ${token}` }
```

### Login
```javascript
const { login } = useAuth();
const result = await login(email, password);
if (result.success) { /* redirect to dashboard */ }
```

### Register
```javascript
const { register } = useAuth();
const result = await register(email, username, password);
if (result.success) { /* show success message */ }
```

### Logout
```javascript
const { logout } = useAuth();
logout(); // clears state and localStorage
```

### Protect a route
```javascript
import { ProtectedRoute } from '@/context/ProtectedRoute';

export default function SecretPage() {
  return (
    <ProtectedRoute>
      <YourContent />
    </ProtectedRoute>
  );
}
```

## API Endpoints Used

```
POST /api/auth/register
  Body: { email, username, password }
  Response: { userId, message }

POST /api/auth/login
  Body: { email, password }
  Response: { token, userId }

GET /api/account/account
  Headers: { Authorization: Bearer {token} }
  Response: { id, email, username, balance, equity, ... }

GET /api/trades/open
  Headers: { Authorization: Bearer {token} }
  Response: [{ id, symbol, type, ... }]

POST /api/trades/open
  Headers: { Authorization: Bearer {token} }
  Body: { symbol, type, lot_size, open_price, ... }
  Response: { message, tradeId }
```

## Storage

The authentication system stores data in the browser's localStorage:

```
Key: authToken
Value: JWT token string
Used for: API authentication

Key: user
Value: { id, email } (JSON stringified)
Used for: Displaying user info
```

## Token

- **Format:** JWT (JSON Web Token)
- **Expiration:** 24 hours
- **Storage:** localStorage
- **Usage:** Pass in Authorization header as `Bearer {token}`
- **Refresh:** Automatic on login, manual refresh needed after expiry

## Workflow

### First Time User
1. Visit app
2. Redirected to /login (ProtectedRoute)
3. Click "Register" link
4. Fill registration form
5. Account created on backend
6. Redirected to /login
7. Enter email and password
8. JWT token received and stored
9. Automatically redirected to dashboard
10. User data loaded from API

### Returning User
1. Visit app
2. AuthProvider checks localStorage on mount
3. Token and user data restored automatically
4. Redirects to dashboard (ProtectedRoute allows)
5. Continue trading

### Logout
1. User clicks logout in profile menu
2. Clears localStorage
3. Clears auth state
4. Redirects to /login

## Error Handling

Errors are stored in `useAuth().error`:

```javascript
const { error } = useAuth();
if (error) {
  console.error(error);
  // Display to user
}
```

Clear errors with:
```javascript
const { setError } = useAuth();
setError(null);
```

## Security Considerations

1. **HTTPS Only** - Always use HTTPS in production
2. **Secure JWT Secret** - Change JWT_SECRET in server/.env
3. **HttpOnly Cookies** - Consider using httpOnly cookies instead of localStorage
4. **Token Refresh** - Implement refresh token logic for long sessions
5. **CORS** - Configure CORS properly on backend
6. **Input Validation** - Validate all inputs before sending
7. **Rate Limiting** - Implement rate limiting on auth endpoints

## Extending the System

### Add User Profile Picture
```javascript
// In AuthContext.js, expand user object
const userData = { 
  id: response.userId, 
  email,
  profilePic: response.profilePic
};
```

### Add Remember Me
```javascript
// In login handler
if (rememberMe) {
  localStorage.setItem('rememberEmail', email);
}
```

### Add Social Login
```javascript
// Create new login handler
const loginWithGoogle = async (googleToken) => {
  const response = await fetch(`${API_URL}/auth/google`, {
    method: 'POST',
    body: JSON.stringify({ googleToken })
  });
  // Handle response same as regular login
};
```

### Add Two-Factor Authentication
```javascript
// After login, if 2FA enabled, require verification
if (response.requires2FA) {
  setNeed2FA(true);
  // Redirect to 2FA verification page
}
```

## Debugging

Enable debug logs:
```javascript
// In AuthContext.js, add console.log statements
console.log('Token:', token);
console.log('User:', user);
console.log('Is Authenticated:', isAuthenticated);
console.log('Error:', error);
```

Check localStorage:
```javascript
console.log(localStorage.getItem('authToken'));
console.log(localStorage.getItem('user'));
```

Verify API call:
```javascript
const response = await fetch(`${API_URL}/auth/login`, {
  method: 'POST',
  body: JSON.stringify({ email, password })
});
console.log('Response:', response);
console.log('Data:', await response.json());
```

## Components Using Auth

These components have been updated to use authentication:

1. **Navbar.js** - Shows user email, logout button
2. **page.js** - Protected with ProtectedRoute
3. **AuthenticationExamples.js** - Example implementations

## Next Steps

1. Test login/registration flows
2. Test protected routes
3. Integrate auth into other components
4. Add form validation
5. Add loading spinners
6. Add error notifications
7. Implement refresh token logic
8. Add user profile page
9. Add change password functionality
10. Deploy to production with HTTPS

