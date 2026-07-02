import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { getClearanceInfo } from '../utils/clearance';

const NavItem = ({ to, icon, label, badge, collapsed }) => (
  <NavLink
    to={to}
    end={to === '/'}
    className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
    title={collapsed ? label : undefined}
    style={collapsed ? { justifyContent: 'center', padding: '10px 0' } : {}}
  >
    <span style={{ fontSize: 16, minWidth: 18, textAlign: 'center' }}>{icon}</span>
    <AnimatePresence>
      {!collapsed && (
        <motion.span
          initial={{ opacity: 0, width: 0 }}
          animate={{ opacity: 1, width: 'auto' }}
          exit={{ opacity: 0, width: 0 }}
          transition={{ duration: 0.15 }}
          style={{ overflow: 'hidden', whiteSpace: 'nowrap' }}
        >
          {label}
        </motion.span>
      )}
    </AnimatePresence>
    {badge > 0 && <span className="nav-badge" style={collapsed ? { position: 'absolute', top: 4, right: 4, fontSize: 9 } : {}}>{badge}</span>}
  </NavLink>
);

const NavSection = ({ title, children, collapsed }) => (
  <nav className="nav-section">
    {!collapsed && <div className="nav-section-title">{title}</div>}
    {collapsed && <div style={{ height: 8 }} />}
    {children}
  </nav>
);

export default function Layout() {
  const { user, logout, commsBlocked, totalNotifications } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const clInfo = getClearanceInfo(user?.clearanceLevel || 0);
  const isAdmin = user?.role === 'admin' || user?.role === 'superadmin';

  const sidebarW = collapsed ? 56 : 240;

  return (
    <div className="app-layout" style={{ position: 'relative' }}>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 99, display: 'none' }}
          className="mobile-overlay"
        />
      )}

      {/* Sidebar */}
      <motion.aside
        animate={{ width: sidebarW }}
        transition={{ duration: 0.2, ease: 'easeInOut' }}
        className={`sidebar${mobileOpen ? ' mobile-open' : ''}`}
        style={{ width: sidebarW, overflow: 'hidden', flexShrink: 0 }}
      >
        {/* Logo + collapse button */}
        <div className="sidebar-logo" style={{ display: 'flex', alignItems: 'center', justifyContent: collapsed ? 'center' : 'space-between', padding: collapsed ? '16px 8px' : '16px' }}>
          {!collapsed && (
            <div>
              <h1 style={{ fontSize: 16 }}>SCP PORTAL</h1>
              <span style={{ fontSize: 9 }}>SECURE // CONTAIN // PROTECT</span>
            </div>
          )}
          <button
            onClick={() => setCollapsed(c => !c)}
            style={{ background: 'none', border: '1px solid var(--border)', color: 'var(--text-dim)', cursor: 'pointer', padding: '4px 6px', borderRadius: 4, fontSize: 12, flexShrink: 0 }}
            title={collapsed ? 'Развернуть' : 'Свернуть'}
          >
            {collapsed ? '▶' : '◀'}
          </button>
        </div>

        {/* User mini card */}
        {!collapsed && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
            style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)' }}
          >
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-dim)', marginBottom: 4 }}>{user?.employeeId || 'NO ID'}</div>
            <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-bright)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.callsign}</div>
            <div style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.fraction}</div>
            <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
              <span className={`cl-${user?.clearanceLevel}`} style={{ fontFamily: 'var(--font-head)', fontWeight: 900, fontSize: 16 }}>
                УД-{user?.clearanceLevel}
              </span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-dim)' }}>{clInfo.short}</span>
            </div>
            {user?.clearanceExtensions?.length > 0 && (
              <div style={{ marginTop: 4, display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                {user.clearanceExtensions.map(ext => <span key={ext} className="ext-badge">[{ext}]</span>)}
              </div>
            )}
          </motion.div>
        )}

        {collapsed && (
          <div style={{ padding: '8px 0', borderBottom: '1px solid var(--border)', textAlign: 'center' }}>
            <div className={`cl-${user?.clearanceLevel}`} style={{ fontFamily: 'var(--font-head)', fontWeight: 900, fontSize: 18 }}>
              {user?.clearanceLevel}
            </div>
          </div>
        )}

        {/* Nav */}
        <div style={{ overflowY: 'auto', flex: 1 }}>
          <NavSection title="ГЛАВНОЕ" collapsed={collapsed}>
            <NavItem to="/" icon="⬡" label="Главная" collapsed={collapsed} />
            <NavItem to="/profile" icon="◈" label="Мой УД" collapsed={collapsed} />
          </NavSection>

          <NavSection title="ФРАКЦИИ И ПЕРСОНАЛ" collapsed={collapsed}>
            <NavItem to="/fractions" icon="◫" label="Фракции" collapsed={collapsed} />
            <NavItem to="/personnel" icon="👤" label="Персонал" collapsed={collapsed} />
          </NavSection>

          <NavSection title="БАЗА ЗНАНИЙ" collapsed={collapsed}>
            <NavItem to="/scp" icon="☢" label="Архив SCP" collapsed={collapsed} />
            <NavItem to="/documents" icon="◧" label="Документация" collapsed={collapsed} />
            <NavItem to="/linked-orgs" icon="◉" label="Связанные орг." collapsed={collapsed} />
            <NavItem to="/wanted" icon="⚠" label="Розыск" collapsed={collapsed} />
          </NavSection>

          <NavSection title="СПЕЦИАЛЬНОЕ" collapsed={collapsed}>
            <NavItem to="/terminal" icon="▶" label="Терминал" collapsed={collapsed} />
            <NavItem to="/blackmarket" icon="◈" label="Чёрный рынок" collapsed={collapsed} />
          </NavSection>

          <NavSection title="КОММУНИКАЦИИ" collapsed={collapsed}>
            <NavItem to="/comms" icon="◎" label="Связь" badge={totalNotifications} collapsed={collapsed} />
            <NavItem to="/requests" icon="◬" label="Запросы" collapsed={collapsed} />
          </NavSection>

          {isAdmin && (
            <NavSection title="УПРАВЛЕНИЕ" collapsed={collapsed}>
              <NavItem to="/admin" icon="⬢" label="Панель админа" collapsed={collapsed} />
            </NavSection>
          )}
        </div>

        {commsBlocked && !collapsed && (
          <div style={{ margin: '8px 12px', padding: '6px', background: 'rgba(231,76,60,0.1)', border: '1px solid var(--red)', borderRadius: 4, fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--red)', textAlign: 'center' }}>
            ⚠ СВЯЗЬ ЗАБЛОК.
          </div>
        )}

        <div style={{ padding: collapsed ? '8px 4px' : '12px 16px', borderTop: '1px solid var(--border)' }}>
          {!collapsed && (
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-dim)', marginBottom: 8, textAlign: 'center' }}>
              SCP:КПК v3.0
            </div>
          )}
          <button
            className="btn btn-ghost btn-sm"
            onClick={logout}
            style={{ width: '100%', justifyContent: 'center' }}
            title="Выход"
          >
            {collapsed ? '⏻' : 'ВЫХОД'}
          </button>
        </div>
      </motion.aside>

      {/* Main content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
        {commsBlocked && <div className="comms-blocked-banner">⚠ ВСЕ КАНАЛЫ СВЯЗИ ЗАБЛОКИРОВАНЫ КОМАНДОВАНИЕМ ⚠</div>}

        {/* Mobile top bar */}
        <div className="mobile-topbar" style={{ display: 'flex', padding: '10px 16px', background: 'var(--bg2)', borderBottom: '1px solid var(--border)', alignItems: 'center', gap: 12 }}>
          <button onClick={() => setMobileOpen(o => !o)} style={{ background: 'none', border: '1px solid var(--border)', color: 'var(--text)', padding: '6px 10px', borderRadius: 4, cursor: 'pointer' }}>☰</button>
          <span style={{ fontFamily: 'var(--font-head)', fontSize: 14, color: 'var(--accent)', letterSpacing: 2 }}>SCP PORTAL</span>
          <span className={`cl-${user?.clearanceLevel}`} style={{ marginLeft: 'auto', fontFamily: 'var(--font-head)', fontWeight: 900 }}>УД-{user?.clearanceLevel}</span>
        </div>

        <main className="main-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
