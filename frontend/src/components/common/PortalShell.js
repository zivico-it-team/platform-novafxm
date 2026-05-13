'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useAuth } from '@/context/useAuth';

const mainItems = [
  { label: 'Dashboard', href: '/', icon: 'home' },
  { label: 'Accounts', href: '/accounts', icon: 'list' },
  { label: 'Profile', href: '/bank-info', icon: 'user' },
];

const profileItems = [
  { label: 'Documents', href: '/document-upload-history', icon: 'file' },
  { label: 'Verification', href: '/profile/verification', icon: 'fingerprint' },
  { label: 'Bank Info', href: '/bank-info', icon: 'card' },
];

const Icon = ({ name, className = 'h-4 w-4' }) => {
  const commonProps = {
    className,
    fill: 'none',
    stroke: 'currentColor',
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    strokeWidth: 2,
    viewBox: '0 0 24 24',
    'aria-hidden': true,
  };

  const paths = {
    home: <path d="M3 11.5 12 4l9 7.5M5 10.5V20h14v-9.5" />,
    wallet: <path d="M4 7h15a2 2 0 0 1 2 2v9H4a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h14v2M17 13h.01" />,
    money: <path d="M12 3v18M17 7.5c-.8-1-2.4-1.5-4-1.5-2.2 0-4 1-4 2.7 0 3.8 8 1.6 8 5.4 0 1.7-1.8 2.9-4.1 2.9-1.9 0-3.5-.7-4.4-1.9" />,
    list: <path d="M4 6h16M4 12h16M4 18h16" />,
    copy: <path d="M8 8h10v12H8zM6 16H4V4h12v2" />,
    clock: <path d="M12 8v5l3 2M21 12a9 9 0 1 1-3-6.7" />,
    user: <path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM4 21a8 8 0 0 1 16 0" />,
    file: <path d="M7 3h7l5 5v13H7zM14 3v5h5M10 13h5M10 17h7" />,
    fingerprint: <path d="M6 12a6 6 0 0 1 12 0M9 18c.5-1.7.7-3.7.7-6a2.3 2.3 0 0 1 4.6 0c0 1.1-.1 2.5-.3 4M12 21c.9-2.7 1.4-5.7 1.4-9M5 16c.3-1.1.4-2.5.4-4a6.6 6.6 0 0 1 .5-2.5M18.6 15.5c.1-1.3.2-2.5.2-3.5a6.8 6.8 0 0 0-.4-2.3" />,
    card: <path d="M4 6h16v12H4zM4 10h16M7 15h4" />,
    network: <path d="M8 18v-6M12 18V6M16 18v-9M5 21h14" />,
    bell: <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 7h18s-3 0-3-7M10 19a2 2 0 0 0 4 0" />,
  };

  return <svg {...commonProps}>{paths[name]}</svg>;
};

export { Icon };

export default function PortalShell({ activeSubItem = 'Bank Info', children }) {
  const { user } = useAuth();
  const initial = (user?.username || user?.email || 'U').charAt(0).toUpperCase();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950">
      <aside className="fixed inset-y-0 left-0 w-56 border-r border-slate-200 bg-white">
        <div className="px-5 py-6">
          <Image
            src="/novafxm-logo.jpeg"
            alt="NovaFXM Global Forex Trading"
            width={160}
            height={49}
            priority
          />
        </div>

        <nav className="space-y-3 px-4 text-sm">
          {mainItems.map((item) => (
            <div key={item.label}>
              <Link
                href={item.href}
                className={`flex items-center gap-3 rounded px-2 py-2 font-semibold ${
                  item.label === 'Profile'
                    ? 'text-slate-800'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950'
                }`}
              >
                <Icon name={item.icon} />
                {item.label}
              </Link>

              {item.label === 'Profile' && (
                <div className="ml-4 mt-2 space-y-1 border-l border-nova-green pl-3">
                  {profileItems.map((profileItem) => {
                    const selected = profileItem.label === activeSubItem;

                    return (
                      <Link
                        key={profileItem.label}
                        href={profileItem.href}
                        className={`flex items-center gap-3 rounded px-3 py-2 font-semibold ${
                          selected
                            ? 'border border-slate-900 bg-nova-green text-white'
                            : 'text-slate-500 hover:bg-slate-100 hover:text-slate-950'
                        }`}
                      >
                        <Icon name={profileItem.icon} />
                        {profileItem.label}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </nav>
      </aside>

      <main className="ml-56 min-h-screen">
        <header className="flex h-16 items-center justify-end gap-4 px-6">
          <Link
            href="/platform"
            className="rounded-lg border border-nova-gold/40 bg-white px-5 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-yellow-50"
          >
            Platform
          </Link>
          <div className="min-w-40 rounded-full bg-white px-4 py-1 text-right shadow-sm">
            <div className="text-sm font-bold">{user?.username || 'User Demo'}</div>
            <div className="max-w-36 truncate text-[10px] text-slate-500">{user?.email}</div>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-yellow-100 text-sm font-bold text-nova-green">
            {initial}
          </div>
        </header>

        {children}
      </main>
    </div>
  );
}
