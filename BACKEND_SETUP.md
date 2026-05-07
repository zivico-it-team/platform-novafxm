# NovaFXM Trading Platform - Quick Start Guide

## Backend Setup (Node.js + Express + MySQL)

### Prerequisites
- MySQL must be installed and running
- Node.js installed

### Setup Steps

1. **Install backend dependencies:**
   ```bash
   cd server
   npm install
   ```

2. **Configure MySQL connection** in `server/.env`:
   ```env
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=your_password
   DB_NAME=trading_platform
   PORT=3001
   JWT_SECRET=your-secret-key-change-this
   ```

3. **Start the backend:**
   ```bash
   npm run dev
   ```
   Backend will run on `http://localhost:3001`

## Frontend Setup (Next.js)

### Setup Steps

1. **Install frontend dependencies:**
   ```bash
   npm install
   ```

2. **Frontend configuration** is already set in `.env.local`:
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:3001/api
   ```

3. **Start the frontend:**
   ```bash
   npm run dev
   ```
   Frontend will run on `http://localhost:3000`

## Running Both Together

### Terminal 1 - Backend
```bash
npm run dev:backend
```

### Terminal 2 - Frontend
```bash
npm run dev
```

Visit `http://localhost:3000` in your browser

## API Structure

### Authentication
```
POST /api/auth/register
POST /api/auth/login
```

### Account Management
```
GET /api/account/account
GET /api/account/stats
PUT /api/account/leverage
```

### Trading
```
GET /api/trades
GET /api/trades/open
GET /api/trades/history
POST /api/trades/open
POST /api/trades/:tradeId/close
PUT /api/trades/:tradeId
```

### Prices
```
GET /api/prices
GET /api/prices/:symbol
POST /api/prices/:symbol
```

## Features Included

✅ User authentication (JWT tokens)
✅ Account management with margin calculations
✅ Trade execution and management
✅ Trade history
✅ Real-time price updates
✅ Multi-symbol support (Forex, Metals, Indices, Crypto)

## Integration with Frontend

Use the API functions from `lib/api.js`:

```javascript
import { authAPI, tradesAPI, accountAPI } from '@/lib/api';

// Register
await authAPI.register(email, username, password);

// Login
const { token } = await authAPI.login(email, password);

// Open trade
await tradesAPI.openTrade(token, {
  symbol: 'EUR/USD',
  type: 'buy',
  lot_size: 1,
  open_price: 1.0845
});

// Get account info
await accountAPI.getAccount(token);
```

## Common Issues

| Issue | Solution |
|-------|----------|
| MySQL connection error | Ensure MySQL is running and credentials are correct |
| Port 3001 in use | Change PORT in server/.env or kill the process |
| API calls fail | Verify NEXT_PUBLIC_API_URL in .env.local |
| JWT token errors | Ensure JWT_SECRET is set in server/.env |

## Next Steps

1. ✅ Create an authentication context/state management
2. ✅ Integrate API calls into your components
3. ✅ Add WebSocket for real-time price updates
4. ✅ Implement proper error handling
5. [done] Add form validation
6. [ready] Deploy to production

See [DEPLOYMENT.md](DEPLOYMENT.md) for Docker Compose and managed hosting deployment steps.

## WebSocket Feed
- Backend: `ws://localhost:3001/ws/prices`
- Frontend: connects automatically from `lib/useTrading.js` using `NEXT_PUBLIC_API_URL`
- Message type: `priceUpdate`
- Payload: `{ type: 'priceUpdate', data: { symbol: { bid, ask, mid }, ... } }`
- Auto-reconnection with exponential backoff (up to 5 attempts)

## Error Handling

### Backend
- Centralized error middleware (`server/middleware/errorHandler.js`)
- Input validation middleware (`server/middleware/validation.js`)
- Automatic error logging and proper HTTP status codes
- See [ERROR_HANDLING.md](ERROR_HANDLING.md) for details

### Frontend
- Consistent API error handling in `lib/api.js`
- React Error Boundary component in `components/ErrorBoundary.js`
- Toast notifications for user feedback via `context/ToastContext.js`
- WebSocket auto-reconnection with exponential backoff
- See [ERROR_HANDLING.md](ERROR_HANDLING.md) for implementation guide

