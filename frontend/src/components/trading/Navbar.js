'use client';

import { useAuth } from '@/context/useAuth';
import { getAccountDisplayName, getAccountShortName } from '@/utils/accountLabels';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

const metricItems = (account, formatNumber) => {
  const bonus = Number(account?.bonus || 0);
  const balance = Number(account?.balance || 0);
  const equity = Number(account?.equity || 0);
  const netProfit = equity - balance - bonus;

  return [
    { label: 'Balance', value: `$${formatNumber(balance)}` },
    { label: 'Equity', value: `$${formatNumber(equity)}` },
    { label: 'Margin', value: `$${formatNumber(account?.usedMargin)}` },
    { label: 'Margin Level', value: formatNumber(account?.marginLevel), suffix: '%' },
    { label: 'Net Profit', value: `$${formatNumber(netProfit)}` },
    { label: 'Bonus', value: `$${formatNumber(bonus)}` },
    { label: 'Free Funds', value: `$${formatNumber(account?.freeMargin)}` },
  ];
};

const AccountMetric = ({ label, value, suffix }) => (
  <div className="border-r border-nova-border px-4 text-right last:border-r-0">
    <div className="text-xs uppercase tracking-wide text-gray-500">{label}</div>
    <div className="mt-1 whitespace-nowrap text-lg font-semibold leading-none text-gray-900">
      {value}
      {suffix && <span className="ml-0.5 align-super text-[10px] font-bold text-gray-900">{suffix}</span>}
    </div>
  </div>
);

export default function Navbar({ account, accounts = [], selectedAccountId, onAccountChange, onSearch }) {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [showMenu, setShowMenu] = useState(false);

  const formatNumber = (num) => num?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00';

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const displayName = user?.username || user?.email || 'User';
  const userInitial = displayName.charAt(0).toUpperCase();
  const hasAccountSwitcher = accounts.length > 0 && typeof onAccountChange === 'function';
  const metrics = metricItems(account, formatNumber);

  return (
    <nav className="flex h-16 items-center gap-8 border-b border-nova-border bg-white px-6">
      <div className="flex-shrink-0">
        <Image
          src="/novafxm-logo.jpeg"
          alt="NovaFXM Global Forex Trading"
          width={160}
          height={49}
          priority
        />
      </div>

      <div className="max-w-xs flex-1">
        <input
          type="text"
          placeholder="Search symbol..."
          onChange={(e) => onSearch(e.target.value)}
          className="w-full rounded-lg border border-nova-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-nova-blue"
        />
      </div>

      <div className="ml-auto flex min-w-0 items-center gap-6">
        <div className="shrink-0 text-right">
          <label htmlFor="account-switcher" className="block text-xs uppercase tracking-wide text-gray-500">
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

        <div className="h-8 w-px shrink-0 bg-nova-border"></div>

        <div className="flex min-w-0 items-center overflow-hidden">
          {metrics.map((metric) => (
            <AccountMetric
              key={metric.label}
              label={metric.label}
              value={metric.value}
              suffix={metric.suffix}
            />
          ))}
        </div>

        <div className="h-8 w-px shrink-0 bg-nova-border"></div>

        <div className="relative shrink-0">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-nova-blue font-semibold text-white transition-opacity hover:opacity-90"
            title={user?.email}
          >
            {userInitial}
          </button>

          {showMenu && (
            <div className="absolute right-0 top-full z-50 mt-2 w-56 rounded-lg border border-nova-border bg-white shadow-lg">
              <div className="border-b border-nova-border px-4 py-3">
                <p className="truncate text-sm font-semibold text-gray-900">{displayName}</p>
                <p className="mt-0.5 truncate text-xs text-gray-500">{user?.email}</p>
              </div>
              <button
                onClick={handleLogout}
                className="w-full px-4 py-2 text-left text-sm font-semibold text-red-600 transition-colors hover:bg-red-50"
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
