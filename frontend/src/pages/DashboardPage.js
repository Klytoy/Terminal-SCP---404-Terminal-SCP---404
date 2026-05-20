import React from 'react';
import { useAuth } from '../context/AuthContext';
import { getClearanceInfo, CLEARANCE_LEVELS } from '../utils/clearance';

export default function DashboardPage() {
  const { user, commsBlocked } = useAuth();
  const clInfo = getClearanceInfo(user?.clearanceLevel || 0);

  return (
    <div className="page">
      <div className="page-title">ГЛАВНАЯ</div>

      {commsBlocked && (
        <div className="alert alert-error" style={{ marginBottom: 24 }}>
          ⚠ ВНИМАНИЕ: ВСЕ КАНАЛЫ СВЯЗИ ЗАБЛОКИРОВАНЫ КОМАНДОВАНИЕМ
        </div>
      )}

      <div className="grid-2" style={{ marginBottom: 24 }}>
        {/* ID Card */}
        <div className={`id-card id-card-cl${user?.clearanceLevel}`}>
          <div className="id-card-header">ФОНД SCP — УДОСТОВЕРЕНИЕ СОТРУДНИКА</div>
          <div className="id-card-name">{user?.fio}</div>
          <div className="id-card-callsign">«{user?.callsign}»</div>
          
          <div className={`id-card-cl-badge cl-${user?.clearanceLevel}`}>
            УРОВЕНЬ ДОПУСКА {user?.clearanceLevel}
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-dim)', textAlign: 'center', marginTop: -8, marginBottom: 16 }}>
            {clInfo.name} [{clInfo.short}]
          </div>

          <div className="id-card-row">
            <span className="id-card-label">ФРАКЦИЯ</span>
            <span className="id-card-value">{user?.fraction}</span>
          </div>
          <div className="id-card-row">
            <span className="id-card-label">ТИП</span>
            <span className="id-card-value">{user?.fractionType === 'combat' ? 'БОЕВАЯ' : 'ГРАЖДАНСКАЯ'}</span>
          </div>
          <div className="id-card-row">
            <span className="id-card-label">ДОЛЖНОСТЬ</span>
            <span className="id-card-value">{user?.position}</span>
          </div>
          <div className="id-card-row">
            <span className="id-card-label">DISCORD</span>
            <span className="id-card-value">{user?.discordNick}</span>
          </div>

          {user?.clearanceExtensions?.length > 0 && (
            <div>
              <div className="id-card-label" style={{ marginTop: 12, marginBottom: 6 }}>РАСШИРЕНИЯ</div>
              <div className="id-card-extensions">
                {user.clearanceExtensions.map(ext => (
                  <span key={ext} className="ext-badge">[{ext}]</span>
                ))}
              </div>
            </div>
          )}

          <div className="id-card-id">{user?.employeeId}</div>
        </div>

        {/* Clearance description */}
        <div className="card">
          <div className="card-title">ОПИСАНИЕ УД-{user?.clearanceLevel}</div>
          <div style={{ fontSize: 13, lineHeight: 1.8, color: 'var(--text-dim)' }}>
            {clInfo.description}
          </div>
          
          <div style={{ marginTop: 20 }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-dim)', letterSpacing: 1, marginBottom: 12 }}>
              УРОВНИ ДОПУСКА
            </div>
            {Object.entries(CLEARANCE_LEVELS).map(([lvl, info]) => (
              <div key={lvl} style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '6px 0',
                borderBottom: '1px solid var(--border)',
                opacity: parseInt(lvl) === user?.clearanceLevel ? 1 : 0.4
              }}>
                <span className={`cl-${lvl}`} style={{ fontFamily: 'var(--font-head)', fontWeight: 900, minWidth: 24 }}>{lvl}</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11 }}>{info.short}</span>
                <span style={{ fontSize: 13 }}>{info.name}</span>
                {parseInt(lvl) === user?.clearanceLevel && (
                  <span style={{ marginLeft: 'auto', fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--accent)' }}>← ВАШ УД</span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Service IDs */}
      {user?.serviceIds?.length > 0 && (
        <div className="card">
          <div className="card-title">УД ДРУГИХ СЛУЖБ</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
            {user.serviceIds.map((sid, i) => (
              <div key={i} style={{
                background: 'var(--bg3)',
                border: '1px solid var(--border)',
                borderRadius: 6,
                padding: '12px 16px',
                minWidth: 200
              }}>
                <div style={{ fontFamily: 'var(--font-head)', fontSize: 11, color: 'var(--accent)', letterSpacing: 2, marginBottom: 8 }}>
                  {sid.service}
                </div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 14, color: 'var(--text-bright)' }}>
                  {sid.idNumber}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
