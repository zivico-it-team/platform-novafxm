# Environment Configuration

## Backend Setup (.env in /server)

```env
# Database Configuration
DB_HOST=localhost              # MySQL host
DB_USER=root                  # MySQL username
DB_PASSWORD=                  # MySQL password (empty if none)
DB_NAME=trading_platform      # Database name

# Server Configuration
PORT=3002                     # Server port
NODE_ENV=development          # Environment (development/production)

# Security
JWT_SECRET=your-secret-key-change-this-in-production
```

## Frontend Setup (.env.local in root)

```env
NEXT_PUBLIC_API_URL=http://localhost:3002/api
```

## Important Notes

- Change JWT_SECRET to a random string before production deployment
- MySQL must be running before starting the backend
- Frontend should have NEXT_PUBLIC_API_URL pointing to your backend
- All authentication requires a valid JWT token in the Authorization header

