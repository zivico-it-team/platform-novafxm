# NovaFXM Trading Platform - Error Handling Guide

## Overview

The trading platform implements comprehensive error handling across both backend and frontend to ensure reliability and user-friendly error messages.

## Backend Error Handling

### Middleware Stack

#### 1. Error Handler (`server/middleware/errorHandler.js`)
- Centralized error handling for all routes
- Logs errors with context (method, path, stack trace)
- Handles specific error types:
  - **Database errors**: Duplicate entry, invalid references
  - **JWT errors**: Invalid token, expired token
  - **HTTP errors**: Returns appropriate status codes
  - **Generic errors**: Returns 500 with safe message

#### 2. Validation Middleware (`server/middleware/validation.js`)
- Input validation before route handlers
- Validates required fields, types, lengths, and ranges
- Returns 400 with detailed validation errors
- Supports custom validators per field

#### 3. Async Handler
- Wraps async route handlers
- Automatically catches and forwards errors to error handler
- Prevents unhandled promise rejections

### Error Handling Pattern

```javascript
router.post('/endpoint', validateInput(schema), asyncHandler(async (req, res) => {
  let connection;
  try {
    connection = await pool.getConnection();
    // Handle request
  } catch (error) {
    throw error; // Caught by errorHandler
  } finally {
    if (connection) connection.release(); // Always clean up
  }
}));
```

### Database Connection Errors

- Connection pool automatically handles retries
- Connections are released in `finally` block
- Timeout and connection refused errors are logged

## Frontend Error Handling

### API Wrapper (`lib/api.js`)

All API endpoints use consistent error handling:

```javascript
try {
  const response = await fetch(url);
  return await handleApiResponse(response);
} catch (error) {
  console.error('API error:', error);
  return { error: error.message };
}
```

**Error Response Pattern:**
```javascript
{
  error: "User-friendly error message",
  details: { field: "specific issue" } // Optional
}
```

### Trading Hook (`lib/useTrading.js`)

Error states in the hook:
- `error`: Current error message
- `loading`: Request in progress
- Automatically clears errors after successful operations

### Components

#### ErrorBoundary (`components/ErrorBoundary.js`)
- Catches React component errors
- Displays fallback UI
- Prevents white-screen crashes
- Usage:
```jsx
<ErrorBoundary>
  <YourComponent />
</ErrorBoundary>
```

#### Toast Notifications (`context/ToastContext.js`)
- Display errors, warnings, success messages
- Auto-dismiss after configurable duration
- Usage:
```jsx
const { addToast } = useToast();
addToast('Error message', 'error', 3000);
```

### WebSocket Error Handling

Auto-reconnection with exponential backoff:
- **Initial delay**: 1 second
- **Max delay**: 30 seconds
- **Max attempts**: 5
- Automatically reconnects on disconnect

```javascript
// Exponential backoff formula
delay = Math.min(1000 * 2^(attempt-1), 30000)
```

## Error Types Reference

### Authentication Errors (401)
- `Invalid email or password` - Login failed
- `Invalid token` - JWT validation failed
- `Token expired` - JWT token expired
- Missing Authorization header

### Validation Errors (400)
- `Validation failed` - Input validation failed
- `email must be of type string` - Type mismatch
- `password must be at least 6 characters` - Length validation
- Missing required fields

### Resource Errors (404)
- `User not found` - User doesn't exist
- `Trade not found` - Trade doesn't exist
- `Endpoint not found` - Route doesn't exist

### Conflict Errors (409)
- `Email or username already exists` - Duplicate registration

### Server Errors (500)
- `Internal server error` - Generic server error
- Database connection failed
- JWT_SECRET not configured

## Best Practices

### Backend

1. **Always use asyncHandler** for async routes
2. **Validate inputs** before processing
3. **Release connections** in finally blocks
4. **Log errors with context** for debugging
5. **Don't expose sensitive data** in error messages

### Frontend

1. **Always check for error** in API responses
2. **Use useToast** for user notifications
3. **Wrap risky operations** in try-catch
4. **Handle loading states** during requests
5. **Provide fallback UI** for errors

### Common Patterns

#### Handling API Errors in Components
```jsx
const handleAction = async () => {
  const result = await tradesAPI.openTrade(token, data);
  if (result?.error) {
    addToast(result.error, 'error');
    return;
  }
  addToast('Trade opened successfully', 'success');
};
```

#### Catching Validation Errors
```jsx
const result = await authAPI.register(email, username, password);
if (result?.error) {
  if (result.details) {
    // Show field-specific errors
    Object.entries(result.details).forEach(([field, message]) => {
      addToast(`${field}: ${message}`, 'error');
    });
  } else {
    addToast(result.error, 'error');
  }
}
```

## Monitoring and Debugging

### Console Logs
- All API errors are logged to console
- WebSocket reconnection attempts are logged
- Component render errors are logged

### Browser DevTools
1. **Network tab**: Check API response status and body
2. **Console tab**: Look for error messages
3. **Application tab**: Check stored tokens and cache

### Server Logs
- Check terminal for server startup errors
- Database connection errors are logged
- Request logging shows all API calls

## Future Improvements

1. Add metrics tracking for error rates
2. Implement error analytics dashboard
3. Add more granular error codes
4. Implement circuit breaker pattern for external APIs
5. Add retry logic for transient failures
6. Implement distributed tracing for debugging
