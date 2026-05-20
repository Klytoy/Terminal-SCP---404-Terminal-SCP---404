import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getClearanceInfo } from '../utils/clearance';

const NavItem = ({ to, icon, label, badge }) => (
  <NavLink
    to={to}
    className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
  >
    <span>{icon}</span>
    <span>{label}</span>
    {badge > 0 && <span className="nav-badge">{badge}</span>}
  </NavLink>
);

export default function Layout() {
  const { user, logout, commsBlocked, totalNotifications } = useAuth();
  const navigate = useNavigate();
  const clInfo = getClearanceInfo(user?.clearanceLevel || 0);
  const isAdmin = user?.role === 'admin' || user?.role === 'superadmin';

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <h1>SCP PORTAL</h1>
          <span>SECURE // CONTAIN // PROTECT</span>
        </div>

        {/* User mini card */}
        <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-dim)', marginBottom: 4 }}>
            {user?.employeeId || 'NO ID'}
          </div>
          <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-bright)' }}>
            {user?.callsign}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 2 }}>
            {user?.fraction}
          </div>
          <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
            <span className={`cl-${user?.clearanceLevel}`} style={{ fontFamily: 'var(--font-head)', fontWeight: 900, fontSize: 16 }}>
              УД-{user?.clearanceLevel}
            </span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-dim)' }}>
              {clInfo.short}
            </span>
          </div>
          {user?.clearanceExtensions?.length > 0 && (
            <div style={{ marginTop: 4, display: 'flex', flexWrap: 'wrap', gap: 3 }}>
              {user.clearanceExtensions.map(ext => (
                <span key={ext} className="ext-badge">[{ext}]</span>
              ))}
            </div>
          )}
        </div>

        <nav className="nav-section">
          <div className="nav-section-title">НАВИГАЦИЯ</div>
          <NavItem to="/" icon="⬡" label="Главная" />
          <NavItem to="/profile" icon="◈" label="Мой УД" />
          <NavItem to="/fractions" icon="◫" label="Фракции" />
          <NavItem to="/documents" icon="◧" label="Документация" />
          <NavItem to="/comms" icon="◎" label="Связь" badge={totalNotifications} />
          <NavItem to="/requests" icon="◬" label="Запросы" />
        </nav>

        {isAdmin && (
          <nav className="nav-section">
            <div className="nav-section-title">УПРАВЛЕНИЕ</div>
            <NavItem to="/admin" icon="⬢" label="Панель админа" />
          </nav>
        )}

        {commsBlocked && (
          <div style={{ margin: '8px 12px', padding: '8px', background: 'rgba(231,76,60,0.1)', border: '1px solid var(--red)', borderRadius: 4, fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--red)', textAlign: 'center', letterSpacing: 1 }}>
            ⚠ СВЯЗЬ ЗАБЛОКИРОВАНА
          </div>
        )}

        <div style={{ marginTop: 'auto', padding: '12px 16px', borderTop: '1px solid var(--border)' }}>
          <button className="btn btn-ghost btn-sm" onClick={logout} style={{ width: '100%' }}>
            ВЫХОД
          </button>
        </div>
      </aside>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {commsBlocked && (
          <div className="comms-blocked-banner">
            ⚠ ВСЕ КАНАЛЫ СВЯЗИ ЗАБЛОКИРОВАНЫ СУПЕРАДМИНОМ ⚠
          </div>
        )}
        <main className="main-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
