# Authentication & State Management Guide

## Overview

This authentication system uses React Context API to manage user authentication state across your entire Next.js application. It handles JWT tokens, user login/registration, and provides protected route functionality.

## File Structure

```
context/
├── AuthContext.js        # Main authentication context
├── useAuth.js           # Custom hook for accessing auth context
└── ProtectedRoute.js    # Component to protect routes

app/
├── login/page.js        # Login page
├── register/page.js     # Registration page
└── page.js              # Protected dashboard (wrapped with ProtectedRoute)

components/
└── Navbar.js            # Updated with logout and user menu
```

## Core Components

### 1. AuthContext (context/AuthContext.js)

Provides the following state and methods:

**State:**
- `user` - Current user object { id, email }
- `token` - JWT authentication token
- `loading` - Loading state on app initialization
- `error` - Error messages
- `isAuthenticated` - Boolean indicating if user is logged in

**Methods:**
- `register(email, username, password)` - Register new user
- `login(email, password)` - Login user
- `logout()` - Logout user
- `updateUser(userData)` - Update user state
- `setError(message)` - Set error message

**Data Storage:**
- Token stored in `localStorage` as `authToken`
- User info stored in `localStorage` as `user`

### 2. useAuth Hook (context/useAuth.js)

Custom React hook for accessing authentication context.

**Usage:**
```javascript
const { user, token, isAuthenticated, login, logout } = useAuth();
```

### 3. ProtectedRoute (context/ProtectedRoute.js)

Component that wraps pages to require authentication.

**Features:**
- Redirects unauthenticated users to `/login`
- Shows loading state while checking authentication
- Automatically restores session from localStorage on app load

## Integration Guide

### Step 1: Wrap App with AuthProvider

The app is already wrapped in `app/layout.js`:

```javascript
import { AuthProvider } from '@/context/AuthContext';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
```

### Step 2: Use useAuth Hook in Components

```javascript
'use client';

import { useAuth } from '@/context/useAuth';

export default function MyComponent() {
  const { user, token, isAuthenticated, logout } = useAuth();

  if (!isAuthenticated) {
    return <div>Please log in</div>;
  }

  return (
    <div>
      <p>Welcome, {user.email}</p>
      <button onClick={logout}>Logout</button>
    </div>
  );
}
```

### Step 3: Protect Routes

Wrap any page that requires authentication with `ProtectedRoute`:

```javascript
'use client';

import { ProtectedRoute } from '@/context/ProtectedRoute';
import Dashboard from './dashboard-content';

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <Dashboard />
    </ProtectedRoute>
  );
}
```

### Step 4: Use API Calls with Token

The token is automatically available from the context and should be used in API calls:

```javascript
'use client';

import { useAuth } from '@/context/useAuth';
import { tradesAPI } from '@/services/api';
import { useEffect, useState } from 'react';

export default function TradesComponent() {
  const { token } = useAuth();
  const [trades, setTrades] = useState([]);

  useEffect(() => {
    if (token) {
      tradesAPI.getOpenTrades(token).then(setTrades);
    }
  }, [token]);

  return (
    <div>
      {trades.map(trade => (
        <div key={trade.id}>{trade.symbol}</div>
      ))}
    </div>
  );
}
```

## Authentication Flow

### Registration Flow

```
1. User fills registration form
2. Calls useAuth().register(email, username, password)
3. Backend creates user in database
4. Redirects to login page
```

### Login Flow

```
1. User enters email and password
2. Calls useAuth().login(email, password)
3. Backend validates credentials and returns JWT token
4. Token stored in localStorage as 'authToken'
5. User object stored in localStorage as 'user'
6. Redirects to dashboard (protected route)
```

### Session Restoration

```
1. App loads
2. AuthProvider checks localStorage for 'authToken' and 'user'
3. If found, restores session automatically
4. User remains logged in across page refreshes
5. If token expires, user must login again
```

### Logout Flow

```
1. User clicks logout button
2. Calls useAuth().logout()
3. Clears token and user from localStorage
4. Clears auth state
5. Redirects to login page
```

## Example Pages

### Login Page (app/login/page.js)

Already created with:
- Email and password form
- Error handling
- Loading state
- Link to registration page

### Registration Page (app/register/page.js)

Already created with:
- Email, username, password form
- Password confirmation validation
- Error handling
- Link to login page

### Protected Dashboard (app/page.js)

Already wrapped with `ProtectedRoute` to ensure only authenticated users can access it.

## Error Handling

All auth methods return objects with success status:

```javascript
const result = await login(email, password);

if (result.success) {
  // Handle success
} else {
  // Handle error
  console.error(result.error);
}
```

Errors are also stored in the context:

```javascript
const { error } = useAuth();
```

## Token Management

- **Token Storage:** Stored in `localStorage` as `authToken`
- **Token Usage:** Pass token to API calls via `Authorization: Bearer {token}` header
- **Token Expiration:** Set to 24 hours on backend
- **Session Persistence:** Automatic restoration from localStorage on app load

## Best Practices

1. **Always use useAuth in client components** - Add `'use client'` directive at top
2. **Protect sensitive routes** - Use `ProtectedRoute` wrapper
3. **Handle loading states** - Check `loading` flag before rendering
4. **Clear errors** - Call `setError(null)` after displaying error messages
5. **Validate input** - Validate email/password before API calls
6. **Handle token expiry** - Implement refresh token logic if needed
7. **HTTPS in production** - Always use HTTPS for token transmission

## Extending the System

### Add Role-Based Access Control

```javascript
// Add role to user object
const { user } = useAuth();
if (user.role !== 'admin') {
  return <Unauthorized />;
}
```

### Add Refresh Tokens

```javascript
// Implement refresh token endpoint on backend
// Store refresh token in secure httpOnly cookie
// Auto-refresh access token when expired
```

### Add Multi-Factor Authentication

```javascript
// Add mfa_enabled flag to user
// Check MFA requirement after login
// Redirect to MFA verification page if needed
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| useAuth throws error | Ensure component is wrapped in AuthProvider |
| User logged out after refresh | Check localStorage permissions in browser |
| Token not sent to API | Verify Authorization header in API calls |
| Protected route redirects to login | Check token validity on backend |
| Context not updating | Ensure components are client components (`'use client'`) |

## API Integration

The authentication system works with these backend endpoints:

```
POST /api/auth/register   - Register new user
POST /api/auth/login      - Login user
```

Response format:
```json
// Login Success
{
  "token": "jwt_token_here",
  "userId": 123
}

// Register Success
{
  "userId": 123,
  "message": "User registered successfully"
}

// Error
{
  "error": "Error message"
}
```

