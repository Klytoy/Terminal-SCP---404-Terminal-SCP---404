import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const NAV = [
  { to: '/', label: 'DB_SEARCH', icon: 'search' },
  { to: '/personnel', label: 'PERS_FILES', icon: 'badge' },
  { to: '/factions', label: 'FACTIONS', icon: 'groups' },
  { to: '/terminal', label: 'TERMINAL_KEYS', icon: 'vpn_key' },
  { to: '/clearance', label: 'ДОПУСКИ', icon: 'verified_user' },
  { to: '/wanted', label: 'РОЗЫСК', icon: 'person_search' },
  { to: '/blackmarket', label: 'BLACK_MARKET', icon: 'storefront' },
  { to: '/logs', label: 'SYS_LOGS', icon: 'receipt_long' },
];

const LEVEL_LABELS = ['GENERAL', 'RESTRICTED_1', 'RESTRICTED_2', 'SECRET', 'TOP_SECRET', 'THAUMIEL', 'APOLLYON'];

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <div className="flex h-screen w-full overflow-hidden">
      <div className="scanlines" />
      {/* SideNavBar */}
      <aside className="hidden md:flex flex-col h-full py-margin-desktop border-r-2 border-outline-variant bg-surface-container-lowest w-64 relative z-10">
        <div className="px-6 mb-8">
          <h2 className="font-headline-md text-headline-md text-primary tracking-tighter uppercase">SITE-81_DB</h2>
          <p className="font-label-caps text-label-caps tracking-widest text-on-surface-variant opacity-70">
            CLEARANCE: {LEVEL_LABELS[user?.clearanceLevel ?? 0]}
          </p>
        </div>
        <nav className="flex-1 space-y-1">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `flex items-center space-x-3 p-2 font-label-caps text-label-caps uppercase transition-all duration-150 active:translate-x-1 ${
                  isActive
                    ? 'bg-primary text-on-primary font-bold border-l-4 border-primary-fixed-dim'
                    : 'text-on-surface-variant hover:bg-surface-variant hover:text-primary'
                }`
              }
            >
              <span className="material-symbols-outlined">{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="px-4 mt-auto space-y-4">
          <div className="flex flex-col space-y-1 border-t border-outline-variant pt-4">
            <div className="text-xs text-on-surface-variant">
              <div className="text-primary font-bold uppercase">{user?.callsign || user?.fio}</div>
              <div className="opacity-70">{user?.fraction}</div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center space-x-2 text-on-surface-variant text-xs hover:text-primary transition-colors mt-2"
            >
              <span className="material-symbols-outlined text-sm">power_settings_new</span>
              <span>LOGOUT</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <header className="flex justify-between items-center w-full px-margin-desktop py-2 bg-surface border-b-2 border-primary shadow-[0_0_10px_rgba(0,230,57,0.3)] z-20">
          <h1 className="font-headline-md text-headline-md tracking-tighter text-primary uppercase md:text-headline-lg crt-glow">
            SITE-81//TERMINAL_CORE
          </h1>
          <div className="flex items-center space-x-6">
            <div className="hidden lg:flex items-center bg-surface-container-high border border-outline px-3 py-1 space-x-2">
              <span className="text-[10px] text-primary-fixed-dim font-bold">
                УД_{user?.clearanceLevel ?? 0}
              </span>
              <div className="w-2 h-2 bg-primary rounded-full animate-pulse shadow-[0_0_5px_#00e639]" />
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-gutter md:p-margin-desktop relative bg-background">
          <div className="max-w-7xl mx-auto space-y-gutter relative z-10">{children}</div>
        </main>
      </div>
    </div>
  );
}
