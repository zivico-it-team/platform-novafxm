# NovaFXM - Trading Platform

A professional Forex, Metals, Indices, and Crypto trading platform UI built with Next.js, React, and Tailwind CSS.

## Features

- **Clean Modern UI**: Premium white theme with professional design
- **Market Watch**: Categories for Forex, Metals, Indices, and Crypto
- **Live Chart**: Integrated TradingView Advanced Chart Widget
- **Trading Engine**: Demo account with simulated trading
- **Account Management**: Balance, Equity, Margin tracking
- **Position Management**: Open positions, closed positions history
- **Risk Management**: Margin calculations, stop-out levels, margin call alerts

## Trading System

### Demo Account
- **Initial Balance**: $10,000
- **Leverage**: 1:200
- **Margin Call Level**: 50%
- **Stop Out Level**: 20%

### Supported Instruments

**Forex (9 pairs)**
- EUR/USD, GBP/USD, USD/JPY, AUD/USD, USD/CAD, USD/CHF, NZD/USD, EUR/JPY, GBP/JPY

**Metals (2)**
- XAU/USD (Gold), XAG/USD (Silver)

**Indices (5)**
- US30, NAS100, SPX500, GER40, UK100

**Crypto (3)**
- BTC/USD, ETH/USD, BNB/USD

## Getting Started

### Prerequisites
- Node.js 16+ 
- npm or yarn

### Installation

1. Navigate to the project directory:
```bash
cd "New folder"
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

### Build for Production

```bash
npm run build
npm start
```

## Project Structure

```
├── app/
│   ├── layout.js          # Root layout
│   ├── page.js            # Main trading platform
│   └── globals.css        # Global styles
├── components/
│   ├── Navbar.js          # Top navigation bar
│   ├── Sidebar.js         # Market watch sidebar
│   ├── ChartPanel.js      # Chart display
│   ├── TradingPanel.js    # Trading controls
│   └── PositionsPanel.js  # Positions and history
├── lib/
│   ├── symbolMeta.js      # Symbol metadata
│   ├── tradingEngine.js   # Trading calculations
│   └── useTrading.js      # Trading state hook
├── package.json           # Dependencies
├── next.config.js         # Next.js config
├── tailwind.config.js     # Tailwind CSS config
└── postcss.config.js      # PostCSS config
```

## UI Components

### Navbar
- NovaFXM branding
- Symbol search
- Account info (Balance, Equity, Free Margin)
- User profile button

### Sidebar (Market Watch)
- Expandable categories: Forex, Metals, Indices, Crypto
- Live price display
- Spread information
- Percentage changes
- Account leverage info

### Chart Panel
- TradingView Advanced Chart Widget
- Timeframe selector (1M, 5M, 15M, 1H, 4H, 1D)
- Dynamic symbol switching

### Trading Panel
- Buy/Sell toggle
- Lot size input
- Take Profit & Stop Loss optional inputs
- Bid/Ask prices with spread
- Margin and pip value calculations
- Free margin display

### Positions Panel
- **Open Positions Tab**: Active trades with live PnL
- **History Tab**: Closed positions with realized profits
- Close position functionality

## Calculations

### Margin Calculation
```
Margin = (Lot × Contract Size × Price) / Leverage
```

### Pip Value
```
Pip Value = Pip × Lot × Contract Size
```

### Floating PnL
```
For BUY: PnL = (Current Price - Open Price) × Pip Value
For SELL: PnL = (Open Price - Current Price) × Pip Value
```

### Margin Level
```
Margin Level = (Equity / Used Margin) × 100%
```

## Features Explained

- **Demo Trading**: No real money, fully simulated
- **Price Simulation**: Prices update every second with realistic volatility
- **Account Risk Management**: Real margin calculations and risk levels
- **Professional Design**: Premium white theme suitable for real trading platforms
- **Responsive Layout**: Works on desktop and tablet

## Notes

- This is a demo platform for educational purposes
- All trades are simulated with no real execution
- Prices are simulated based on base values with random movement
- No API connections to real brokers (can be added later)

## Technologies Used

- **Next.js 14**: React framework
- **React 18**: UI library
- **Tailwind CSS**: Utility-first CSS
- **TradingView Widget**: Chart integration

## License

MIT
