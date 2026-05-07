'use client';

import { useAuth } from '@/context/useAuth';
import { getAccountDisplayName, getAccountShortName } from '@/lib/accountLabels';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function Navbar({ account, accounts = [], selectedAccountId, onAccountChange, onSearch }) {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [showMenu, setShowMenu] = useState(false);

  const formatNumber = (num) => num?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00';

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const userInitial = user?.email?.charAt(0).toUpperCase() || 'U';
  const hasAccountSwitcher = accounts.length > 0 && typeof onAccountChange === 'function';

  return (
    <nav className="border-b border-nova-border bg-white h-16 flex items-center px-6 gap-8">
      {/* Logo */}
      <div className="flex-shrink-0">
        <Image
          src="/novafxm-logo.jpeg"
          alt="NovaFXM Global Forex Trading"
          width={160}
          height={49}
          priority
        />
      </div>

      {/* Search */}
      <div className="flex-1 max-w-xs">
        <input
          type="text"
          placeholder="Search symbol..."
          onChange={(e) => onSearch(e.target.value)}
          className="w-full px-3 py-2 border border-nova-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-nova-blue"
        />
      </div>

      {/* Account Info */}
      <div className="flex items-center gap-8 ml-auto">
        <div className="text-right">
          <label htmlFor="account-switcher" className="block text-xs text-gray-500 uppercase tracking-wide">
            Account
          </label>
          {hasAccountSwitcher ? (
            <select
              id="account-switcher"
              value={selectedAccountId ?? account?.id ?? ''}
              onChange={(event) => onAccountChange(event.target.value)}
              className="mt-1 max-w-64 rounded border border-nova-border bg-white px-2 py-1 text-sm font-semibold text-gray-900 focus:outline-none focus:ring-2 focus:ring-nova-blue"
            >
              {accounts.map((item) => (
                <option key={item.id} value={item.id}>
                  {getAccountDisplayName(item)}
                </option>
              ))}
            </select>
          ) : (
            <div className="text-lg font-semibold text-gray-900">
              {getAccountShortName(account)}
            </div>
          )}
        </div>

        <div className="h-8 w-px bg-nova-border"></div>

        <div className="text-right">
          <div className="text-xs text-gray-500 uppercase tracking-wide">Balance</div>
          <div className="text-lg font-semibold text-gray-900">${formatNumber(account?.balance)}</div>
        </div>

        <div className="h-8 w-px bg-nova-border"></div>

        <div className="text-right">
          <div className="text-xs text-gray-500 uppercase tracking-wide">Equity</div>
          <div className="text-lg font-semibold text-gray-900">${formatNumber(account?.equity)}</div>
        </div>

        <div className="h-8 w-px bg-nova-border"></div>

        <div className="text-right">
          <div className="text-xs text-gray-500 uppercase tracking-wide">Free Margin</div>
          <div className="text-lg font-semibold text-gray-900">${formatNumber(account?.freeMargin)}</div>
        </div>

        <div className="h-8 w-px bg-nova-border"></div>

        {/* Profile Menu */}
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="w-10 h-10 rounded-full bg-nova-blue text-white font-semibold flex items-center justify-center hover:opacity-90 transition-opacity"
            title={user?.email}
          >
            {userInitial}
          </button>

          {showMenu && (
            <div className="absolute right-0 mt-2 w-48 bg-white border border-nova-border rounded-lg shadow-lg z-50">
              <div className="px-4 py-3 border-b border-nova-border">
                <p className="text-sm font-semibold text-gray-900">{user?.email}</p>
              </div>
              <button
                onClick={handleLogout}
                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
