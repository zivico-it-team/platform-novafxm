# Architecture Overview

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    NEXT.JS APPLICATION                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │              app/layout.js (Root Layout)                │   │
│  │           <AuthProvider> wraps all children             │   │
│  └──────────────────────────────────────────────────────────┘   │
│                            ↓                                     │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │         React Context (Context/AuthContext.js)          │   │
│  │  ┌────────────────────────────────────────────────────┐ │   │
│  │  │ State:                                             │ │   │
│  │  │  • user (id, email)                               │ │   │
│  │  │  • token (JWT)                                    │ │   │
│  │  │  • isAuthenticated (boolean)                      │ │   │
│  │  │  • loading (boolean)                              │ │   │
│  │  │  • error (string)                                 │ │   │
│  │  │                                                    │ │   │
│  │  │ Methods:                                           │ │   │
│  │  │  • register(email, username, password)            │ │   │
│  │  │  • login(email, password)                         │ │   │
│  │  │  • logout()                                       │ │   │
│  │  │  • updateUser(userData)                           │ │   │
│  │  │  • setError(message)                              │ │   │
│  │  └────────────────────────────────────────────────────┘ │   │
│  └──────────────────────────────────────────────────────────┘   │
│                            ↓                                     │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │     Custom Hook: useAuth() [context/useAuth.js]        │   │
│  │  Used in any client component to access auth state     │   │
│  └──────────────────────────────────────────────────────────┘   │
│                            ↓                                     │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │            Route Protection [ProtectedRoute]            │   │
│  │   Checks isAuthenticated before rendering content       │   │
│  │   Redirects to /login if not authenticated             │   │
│  └──────────────────────────────────────────────────────────┘   │
│                            ↓                                     │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                    Pages & Components                    │   │
│  │                                                           │   │
│  │  Login Page         Register Page      Dashboard         │   │
│  │  (app/login)        (app/register)     (app/page)        │   │
│  │       │                  │                  │            │   │
│  │       ├─────────────────┴──────────────────┤            │   │
│  │       └──────────────────────────────────┬─┘            │   │
│  │                                          ↓              │   │
│  │                     Uses useAuth() hook in components   │   │
│  │                     • Navbar.js (logout, user info)     │   │
│  │                     • Trading Components                │   │
│  │                     • Account Components                │   │
│  └──────────────────────────────────────────────────────────┘   │
│                            ↓                                     │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│              API & DATA LAYER                                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │              localStorage (Browser)                      │   │
│  │  ┌────────────────────────────────────────────────────┐ │   │
│  │  │ authToken: JWT token string (24hr expiry)        │ │   │
│  │  │ user: { id, email } (JSON string)                │ │   │
│  │  └────────────────────────────────────────────────────┘ │   │
│  └──────────────────────────────────────────────────────────┘   │
│                            ↓                                     │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │              API Wrapper (lib/api.js)                    │   │
│  │  ┌────────────────────────────────────────────────────┐ │   │
│  │  │ authAPI.login(email, password)                   │ │   │
│  │  │ authAPI.register(...)                            │ │   │
│  │  │ tradesAPI.openTrade(token, data)                │ │   │
│  │  │ accountAPI.getAccount(token)                    │ │   │
│  │  │ pricesAPI.getPrices()                           │ │   │
│  │  └────────────────────────────────────────────────────┘ │   │
│  └──────────────────────────────────────────────────────────┘   │
│                            ↓                                     │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│          NODE.JS BACKEND (Express + MySQL)                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │              API Routes (server/routes/)                 │   │
│  │  • POST /api/auth/register → Create user               │   │
│  │  • POST /api/auth/login → Return JWT token            │   │
│  │  • GET /api/account/* → Get user data                 │   │
│  │  • POST /api/trades/open → Execute trade             │   │
│  │  • GET /api/prices → Get market data                 │   │
│  └──────────────────────────────────────────────────────────┘   │
│                            ↓                                     │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │              JWT Middleware (auth.js)                    │   │
│  │  • Validates token in Authorization header            │   │
│  │  • Extracts userId from token                         │   │
│  │  • Protects authenticated endpoints                   │   │
│  └──────────────────────────────────────────────────────────┘   │
│                            ↓                                     │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │              MySQL Database (config/db.js)              │   │
│  │  ┌────────────────────────────────────────────────────┐ │   │
│  │  │ users (id, email, password, balance, ...)        │ │   │
│  │  │ trades (id, user_id, symbol, type, ...)         │ │   │
│  │  │ trade_history (closed trades)                   │ │   │
│  │  │ prices (symbol, bid, ask, mid)                 │ │   │
│  │  └────────────────────────────────────────────────────┘ │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

## Authentication Flow

```
┌─────────────────┐
│  User Visits    │
│  Application    │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────────┐
│  AuthProvider Initializes           │
│  (on app/layout.js mount)           │
└────────┬────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────┐
│  Check localStorage                 │
│  • Look for 'authToken'            │
│  • Look for 'user'                 │
└────────┬────────────────────────────┘
         │
    ┌────┴────┐
    │          │
    ▼          ▼
  Found    Not Found
    │          │
    ▼          ▼
┌──────┐  ┌──────────┐
│Restore  Set as Not
│Session  Authenticated
└───┬──┘  └────┬─────┘
    │         │
    └────┬────┘
         │
         ▼
┌─────────────────────────────────────┐
│  User Tries to Access Page          │
└────────┬────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────┐
│  ProtectedRoute Checks              │
│  isAuthenticated?                   │
└────────┬────────────────────────────┘
         │
    ┌────┴────┐
    │          │
   YES        NO
    │          │
    ▼          ▼
┌──────┐  ┌──────────────────┐
│Show   │  │Redirect to /login│
│Page   │  └──────────────────┘
└──────┘          │
                  ▼
            ┌──────────────────┐
            │ Login Form Page  │
            │(app/login/page)  │
            └────────┬─────────┘
                     │
                     ▼
            ┌──────────────────┐
            │User Submits Form │
            │(email+password)  │
            └────────┬─────────┘
                     │
                     ▼
     ┌───────────────────────────────┐
     │API Call: POST /api/auth/login │
     └───────────────┬───────────────┘
                     │
                     ▼
     ┌───────────────────────────────┐
     │Backend Validates Credentials  │
     └───────────┬───────────────────┘
                 │
            ┌────┴─────┐
            │           │
         Valid      Invalid
            │           │
            ▼           ▼
     ┌──────────┐  ┌─────────┐
     │Generate  │  │Return   │
     │JWT Token │  │Error    │
     └────┬─────┘  └────┬────┘
          │             │
          ▼             ▼
     ┌──────────────┐  ┌──────────────┐
     │Return Token+ │  │Show Error Msg│
     │UserId       │  └──────────────┘
     └────┬────────┘
          │
          ▼
     ┌──────────────────────────┐
     │Store in localStorage     │
     │• authToken              │
     │• user object            │
     └────┬─────────────────────┘
          │
          ▼
     ┌──────────────────────────┐
     │Update AuthContext State  │
     │• token                  │
     │• user                   │
     │• isAuthenticated=true   │
     └────┬─────────────────────┘
          │
          ▼
     ┌──────────────────────────┐
     │Redirect to Dashboard     │
     │(useRouter().push('/'))   │
     └──────────────────────────┘
```

## Component Hierarchy

```
app/layout.js
    └─ <AuthProvider>
        ├─ app/page.js
        │  └─ <ProtectedRoute>
        │     ├─ components/Navbar.js (uses useAuth)
        │     ├─ components/Sidebar.js
        │     ├─ components/ChartPanel.js
        │     ├─ components/TradingPanel.js
        │     └─ components/PositionsPanel.js
        │
        ├─ app/login/page.js (uses useAuth)
        │
        └─ app/register/page.js (uses useAuth)
```

## Data Flow for API Calls

```
Component
    │
    ▼
useAuth() hook
    │
    ├─ Get token: const { token } = useAuth()
    │
    ▼
API Wrapper (lib/api.js)
    │
    ├─ tradesAPI.openTrade(token, data)
    │  └─ fetch() with:
    │     ├─ Method: POST
    │     ├─ Headers: { Authorization: `Bearer ${token}` }
    │     └─ Body: data
    │
    ▼
Backend API Route (server/routes/*.js)
    │
    ├─ JWT Middleware (auth.js)
    │  └─ Validates token
    │     └─ Extracts userId
    │
    ▼
Route Handler
    │
    ├─ Execute logic
    ├─ Query database
    │
    ▼
Response
    │
    ├─ JSON data
    ├─ Errors
    │
    ▼
Component
    │
    └─ Update UI
```

## State Persistence

```
User Opens App
    ↓
Read localStorage
    ├─ authToken: "eyJh...xyz"
    └─ user: '{"id":1,"email":"user@example.com"}'
    ↓
AuthContext State Updated
    ├─ token: "eyJh...xyz"
    ├─ user: { id: 1, email: "user@example.com" }
    └─ isAuthenticated: true
    ↓
Components Render with Auth State
    ├─ ProtectedRoute allows access
    ├─ Navbar shows user email
    └─ API calls include token
    ↓
User Refreshes Page
    ├─ AuthProvider remounts
    ├─ Checks localStorage again
    ├─ Restores session
    └─ Page doesn't show loading/redirect
    ↓
User Logs Out
    ├─ localStorage.removeItem('authToken')
    ├─ localStorage.removeItem('user')
    ├─ AuthContext state cleared
    └─ Redirected to /login
```

## File Dependencies

```
app/layout.js
    └─ context/AuthContext.js (imports)

app/page.js
    ├─ context/ProtectedRoute.js
    └─ context/useAuth.js (in DashboardContent)

components/Navbar.js
    ├─ context/useAuth.js
    └─ next/navigation (useRouter)

app/login/page.js
    ├─ context/useAuth.js
    └─ lib/api.js

app/register/page.js
    ├─ context/useAuth.js
    └─ lib/api.js

lib/api.js
    └─ (No dependencies on context)

server/routes/auth.js
    ├─ config/database.js
    └─ middleware/auth.js (for token validation)
```

