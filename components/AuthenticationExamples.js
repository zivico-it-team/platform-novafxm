'use client';

import { useAuth } from '@/context/useAuth';
import { tradesAPI, accountAPI } from '@/lib/api';
import { useEffect, useState } from 'react';

/**
 * Example Component: AuthenticationExamples
 * 
 * This component demonstrates various ways to use the authentication
 * context and state management in your application.
 */

// Example 1: Simple logged-in check
export function UserGreeting() {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <div>Please log in to continue</div>;
  }

  return <div>Welcome, {user.email}!</div>;
}

// Example 2: Fetch data that requires authentication
export function UserTrades() {
  const { token, isAuthenticated } = useAuth();
  const [trades, setTrades] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isAuthenticated || !token) return;

    setLoading(true);
    tradesAPI
      .getOpenTrades(token)
      .then(setTrades)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [token, isAuthenticated]);

  if (loading) return <div>Loading trades...</div>;

  return (
    <div>
      <h3>Your Open Trades</h3>
      {trades.length === 0 ? (
        <p>No open trades</p>
      ) : (
        <ul>
          {trades.map(trade => (
            <li key={trade.id}>{trade.symbol} - {trade.type}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

// Example 3: User account information
export function UserAccount() {
  const { token, isAuthenticated } = useAuth();
  const [account, setAccount] = useState(null);

  useEffect(() => {
    if (!isAuthenticated || !token) return;

    accountAPI
      .getAccount(token)
      .then(setAccount)
      .catch(console.error);
  }, [token, isAuthenticated]);

  if (!account) return <div>Loading account...</div>;

  return (
    <div>
      <p>Balance: ${account.balance}</p>
      <p>Equity: ${account.equity}</p>
      <p>Free Margin: ${account.free_margin}</p>
      <p>Leverage: 1:{account.leverage}</p>
    </div>
  );
}

// Example 4: Logout button
export function LogoutButton() {
  const { logout } = useAuth();

  const handleLogout = () => {
    logout();
    // You can also redirect here if not using ProtectedRoute
  };

  return <button onClick={handleLogout}>Logout</button>;
}

// Example 5: Conditional rendering based on auth state
export function AuthStatus() {
  const { isAuthenticated, loading, user } = useAuth();

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      {isAuthenticated ? (
        <div>
          <p>Status: Logged in</p>
          <p>User: {user.email}</p>
        </div>
      ) : (
        <div>
          <p>Status: Not logged in</p>
          <a href="/login">Login</a>
        </div>
      )}
    </div>
  );
}

// Example 6: Error handling
export function AuthErrorDisplay() {
  const { error, setError } = useAuth();

  if (!error) return null;

  return (
    <div className="p-3 bg-red-100 text-red-700 rounded">
      <p>{error}</p>
      <button onClick={() => setError(null)}>Dismiss</button>
    </div>
  );
}

// Example 7: Complete feature - Open a trade with auth
export function OpenTradeForm() {
  const { token, isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleOpenTrade = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!isAuthenticated || !token) {
      setError('You must be logged in');
      return;
    }

    setLoading(true);

    try {
      const result = await tradesAPI.openTrade(token, {
        symbol: 'EUR/USD',
        type: 'buy',
        lot_size: 1,
        open_price: 1.0845,
        take_profit: 1.0900,
        stop_loss: 1.0800,
      });

      if (result.error) {
        setError(result.error);
      } else {
        setSuccess('Trade opened successfully!');
      }
    } catch (err) {
      setError('Failed to open trade');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleOpenTrade}>
      {error && <div className="text-red-600">{error}</div>}
      {success && <div className="text-green-600">{success}</div>}
      <button type="submit" disabled={loading || !isAuthenticated}>
        {loading ? 'Opening...' : 'Open Trade'}
      </button>
    </form>
  );
}

// Example 8: Update user data after action
export function UpdateLeverageButton() {
  const { token, updateUser } = useAuth();

  const handleUpdateLeverage = async (newLeverage) => {
    if (!token) return;

    try {
      const result = await accountAPI.updateLeverage(token, newLeverage);
      
      if (!result.error) {
        // Refresh user account data
        const updatedAccount = await accountAPI.getAccount(token);
        updateUser({ ...updatedAccount });
      }
    } catch (err) {
      console.error('Failed to update leverage:', err);
    }
  };

  return (
    <button onClick={() => handleUpdateLeverage(500)}>
      Set Leverage to 500x
    </button>
  );
}

// Main component showcasing all examples
export default function AuthenticationExamples() {
  return (
    <div style={{ padding: '20px' }}>
      <h1>Authentication Examples</h1>

      <section>
        <h2>Example 1: User Greeting</h2>
        <UserGreeting />
      </section>

      <section>
        <h2>Example 2: User Trades</h2>
        <UserTrades />
      </section>

      <section>
        <h2>Example 3: User Account</h2>
        <UserAccount />
      </section>

      <section>
        <h2>Example 4: Logout</h2>
        <LogoutButton />
      </section>

      <section>
        <h2>Example 5: Auth Status</h2>
        <AuthStatus />
      </section>

      <section>
        <h2>Example 6: Error Display</h2>
        <AuthErrorDisplay />
      </section>

      <section>
        <h2>Example 7: Open Trade</h2>
        <OpenTradeForm />
      </section>

      <section>
        <h2>Example 8: Update Leverage</h2>
        <UpdateLeverageButton />
      </section>
    </div>
  );
}
