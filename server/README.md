# NovaFXM Trading Platform - Backend Setup Guide

## Prerequisites

- **Node.js** (v14 or higher)
- **MySQL** (v5.7 or higher)

## Installation

### 1. Navigate to server directory
```bash
cd server
```

### 2. Install dependencies
```bash
npm install
```

### 3. Setup MySQL Database

```bash
# Start MySQL service (Windows)
net start MySQL80

# Or on Mac/Linux
brew services start mysql
# or
sudo systemctl start mysql
```

If your MySQL service is not installed, install MySQL or MariaDB before continuing.

### 4. Create Database (Optional - automatically created on first run)

If you want to create it manually:
```sql
CREATE DATABASE trading_platform;
```

### 5. Configure Environment Variables

Edit `server/.env`:
```env
DB_HOST=127.0.0.1
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=trading_platform
PORT=3001
JWT_SECRET=your-secret-key-change-this-in-production
NODE_ENV=development
```

### 6. Start the Server

**Development** (with auto-reload):
```bash
npm run dev
```

**Production**:
```bash
npm start
```

The server will start on `http://localhost:3001`

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user

### Account
- `GET /api/account/account` - Get user account info
- `GET /api/account/stats` - Get account statistics
- `PUT /api/account/leverage` - Update leverage

### Trades
- `GET /api/trades` - Get all trades
- `GET /api/trades/open` - Get open trades
- `GET /api/trades/history` - Get trade history
- `POST /api/trades/open` - Open new trade
- `POST /api/trades/:tradeId/close` - Close trade
- `PUT /api/trades/:tradeId` - Update trade (SL/TP)

### Prices
- `GET /api/prices` - Get all prices
- `GET /api/prices/:symbol` - Get price for symbol
- `POST /api/prices/:symbol` - Update price

## Frontend Configuration

Add to your frontend `.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

## Database Schema

### Users Table
- id (INT, Primary Key)
- email (VARCHAR, Unique)
- username (VARCHAR, Unique)
- password (VARCHAR)
- balance (DECIMAL)
- equity (DECIMAL)
- used_margin (DECIMAL)
- free_margin (DECIMAL)
- margin_level (DECIMAL)
- leverage (INT)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)

### Trades Table
- id (INT, Primary Key)
- user_id (INT, Foreign Key)
- symbol (VARCHAR)
- type (ENUM: 'buy', 'sell')
- lot_size (DECIMAL)
- open_price (DECIMAL)
- close_price (DECIMAL)
- take_profit (DECIMAL)
- stop_loss (DECIMAL)
- pnl (DECIMAL)
- status (ENUM: 'open', 'closed')
- opened_at (TIMESTAMP)
- closed_at (TIMESTAMP)

### Trade History Table
- Stores closed trades for historical analysis

### Prices Table
- Stores current market prices

## Troubleshooting

### MySQL Connection Error
- Ensure MySQL is running
- Check credentials in `.env`
- Verify database name

### Port Already in Use
- Change PORT in `.env`
- Or kill process on port 3001: `lsof -ti:3001 | xargs kill -9`

### Token Errors
- Ensure JWT_SECRET is set in `.env`
- Token expires in 24 hours

## Next Steps

1. Integrate API calls in frontend using the provided `lib/api.js`
2. Add authentication state management (Context API or Redux)
3. Implement real-time price updates (WebSocket)
4. Add more validation and error handling
5. Deploy to production

