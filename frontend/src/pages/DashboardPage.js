import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getClearanceInfo, CLEARANCE_LEVELS } from '../utils/clearance';
import { AnimatedPage } from '../components/Animated';

export default function DashboardPage() {
  const { user, commsBlocked } = useAuth();
  const clInfo = getClearanceInfo(user?.clearanceLevel || 0);
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const statusColor = { active: 'var(--green)', inactive: 'var(--text-dim)', kia: 'var(--red)', mia: 'var(--orange)', suspended: 'var(--yellow)', archived: 'var(--text-dim)', classified: 'var(--purple)', fake: 'var(--red)' };
  const statusLabel = { active: 'АКТИВЕН', inactive: 'НЕАКТИВЕН', kia: 'ПОГИБ', mia: 'ПРОПАЛ Б/В', suspended: 'ОТСТРАНЁН', archived: 'АРХИВИРОВАН', classified: 'ЗАСЕКРЕЧЕН', fake: 'ПОДДЕЛКА' };

  return (
    <AnimatedPage>
      <div className="page">
        {commsBlocked && (
          <div className="alert alert-error" style={{ marginBottom: 24 }}>
            ⚠ ВНИМАНИЕ: ВСЕ КАНАЛЫ СВЯЗИ ЗАБЛОКИРОВАНЫ КОМАНДОВАНИЕМ
          </div>
        )}

        {/* Шапка с часами */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div className="page-title" style={{ margin: 0 }}>ГЛАВНАЯ / ТЕРМИНАЛ</div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--accent)', letterSpacing: 2 }}>
            {time.toLocaleTimeString('ru')} · {time.toLocaleDateString('ru')}
          </div>
        </div>

        {/* Системные статусы */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginBottom: 24 }}>
          {[
            { label: 'СТАТУС', value: statusLabel[user?.personnelStatus] || 'АКТИВЕН', color: statusColor[user?.personnelStatus] || 'var(--green)' },
            { label: 'УД', value: `УД-${user?.clearanceLevel}`, color: `var(--cl${user?.clearanceLevel || 0}, var(--accent))` },
            { label: 'ФРАКЦИЯ', value: user?.fraction?.toUpperCase() || '—', color: 'var(--text-bright)' },
            { label: 'БАЛАНС', value: `₽ ${user?.balance || 0}`, color: 'var(--yellow)' },
          ].map(s => (
            <div key={s.label} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: '14px 16px' }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-dim)', letterSpacing: 2, marginBottom: 6 }}>{s.label}</div>
              <div style={{ fontFamily: 'var(--font-head)', fontSize: 14, color: s.color, letterSpacing: 1 }}>{s.value}</div>
            </div>
          ))}
        </div>

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
            <div className="id-card-row"><span className="id-card-label">ФРАКЦИЯ</span><span className="id-card-value">{user?.fraction}</span></div>
            <div className="id-card-row"><span className="id-card-label">ТИП</span><span className="id-card-value">{user?.fractionType === 'combat' ? 'БОЕВАЯ' : 'ГРАЖДАНСКАЯ'}</span></div>
            <div className="id-card-row"><span className="id-card-label">ДОЛЖНОСТЬ</span><span className="id-card-value">{user?.position}</span></div>
            <div className="id-card-row"><span className="id-card-label">DISCORD</span><span className="id-card-value">{user?.discordNick}</span></div>
            {user?.clearanceExtensions?.length > 0 && (
              <div>
                <div className="id-card-label" style={{ marginTop: 12, marginBottom: 6 }}>РАСШИРЕНИЯ</div>
                <div className="id-card-extensions">
                  {user.clearanceExtensions.map(ext => <span key={ext} className="ext-badge">[{ext}]</span>)}
                </div>
              </div>
            )}
            <div className="id-card-id">{user?.employeeId}</div>
          </div>

          {/* Описание УД */}
          <div className="card">
            <div className="card-title">ОПИСАНИЕ УД-{user?.clearanceLevel}</div>
            <div style={{ fontSize: 13, lineHeight: 1.8, color: 'var(--text-dim)', marginBottom: 16 }}>
              {clInfo.description}
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-dim)', letterSpacing: 1, marginBottom: 10 }}>УРОВНИ ДОПУСКА</div>
            {Object.entries(CLEARANCE_LEVELS).map(([lvl, info]) => (
              <div key={lvl} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0', borderBottom: '1px solid var(--border)', opacity: parseInt(lvl) === user?.clearanceLevel ? 1 : 0.4 }}>
                <span className={`cl-${lvl}`} style={{ fontFamily: 'var(--font-head)', fontWeight: 900, minWidth: 24 }}>{lvl}</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11 }}>{info.short}</span>
                <span style={{ fontSize: 13 }}>{info.name}</span>
                {parseInt(lvl) === user?.clearanceLevel && <span style={{ marginLeft: 'auto', fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--accent)' }}>← ВАШ УД</span>}
              </div>
            ))}
          </div>
        </div>

        {/* Биография */}
        {user?.biography && (
          <div className="card" style={{ marginBottom: 16 }}>
            <div className="card-title">БИОГРАФИЯ / ДОСЬЕ</div>
            <div style={{ fontSize: 13, lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>{user.biography}</div>
          </div>
        )}

        {/* УД других служб */}
        {user?.serviceIds?.length > 0 && (
          <div className="card">
            <div className="card-title">УД ДРУГИХ СЛУЖБ</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
              {user.serviceIds.map((sid, i) => (
                <div key={i} style={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 6, padding: '12px 16px', minWidth: 200 }}>
                  <div style={{ fontFamily: 'var(--font-head)', fontSize: 11, color: 'var(--accent)', letterSpacing: 2, marginBottom: 8 }}>{sid.service}</div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 14, color: 'var(--text-bright)' }}>{sid.idNumber}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </AnimatedPage>
  );
}
