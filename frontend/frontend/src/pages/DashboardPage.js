import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getClearanceInfo, CLEARANCE_LEVELS } from '../utils/clearance';
import { getPersonnel, getFactions, getSCPs, getWanted } from '../utils/api';
import { PageWrapper, FadeIn, CardMotion } from '../components/Animated';

const QUICK_LINKS = [
  { to: '/fractions',   icon: '◫',  label: 'Фракции',        color: 'var(--accent)',  desc: 'Боевые и гражданские подразделения' },
  { to: '/personnel',   icon: '👤', label: 'Персонал',       color: 'var(--green)',   desc: 'База сотрудников фонда' },
  { to: '/scp',         icon: '☢',  label: 'Архив SCP',      color: 'var(--red)',     desc: 'Аномальные объекты и существа' },
  { to: '/documents',   icon: '◧',  label: 'Документация',   color: 'var(--yellow)',  desc: 'Приказы, протоколы, директивы' },
  { to: '/linked-orgs', icon: '◉',  label: 'Связ. орг.',     color: 'var(--purple)',  desc: 'Союзники, нейтралы, враги' },
  { to: '/wanted',      icon: '⚠',  label: 'Розыск',         color: 'var(--orange)',  desc: 'База разыскиваемых лиц' },
  { to: '/comms',       icon: '◎',  label: 'Связь',          color: 'var(--accent2)', desc: 'Защищённые каналы коммуникации' },
  { to: '/profile',     icon: '◈',  label: 'Мой УД',         color: '#888',           desc: 'Удостоверение и профиль' },
];

export default function DashboardPage() {
  const { user, commsBlocked } = useAuth();
  const navigate = useNavigate();
  const clInfo = getClearanceInfo(user?.clearanceLevel || 0);
  const [stats, setStats] = useState({ personnel: 0, scps: 0, factions: 0, wanted: 0 });

  useEffect(() => {
    Promise.allSettled([
      getPersonnel({}),
      getSCPs({}),
      getFactions({}),
      getWanted({})
    ]).then(([p, s, f, w]) => {
      setStats({
        personnel: p.status === 'fulfilled' ? p.value.data.length : 0,
        scps:      s.status === 'fulfilled' ? s.value.data.length : 0,
        factions:  f.status === 'fulfilled' ? f.value.data.length : 0,
        wanted:    w.status === 'fulfilled' ? w.value.data.filter(x => x.status === 'active').length : 0,
      });
    });
  }, []);

  return (
    <PageWrapper>
      <div className="page">

        {commsBlocked && (
          <FadeIn>
            <div className="alert alert-error" style={{ marginBottom: 20, fontFamily: 'var(--font-mono)', letterSpacing: 1 }}>
              ⚠ ВНИМАНИЕ: ВСЕ КАНАЛЫ СВЯЗИ ЗАБЛОКИРОВАНЫ КОМАНДОВАНИЕМ
            </div>
          </FadeIn>
        )}

        {/* Top section: ID card + stats */}
        <div className="grid-2" style={{ marginBottom: 24, gap: 20 }}>

          {/* ID Card */}
          <FadeIn delay={0.05}>
            <div className={`id-card id-card-cl${user?.clearanceLevel}`} style={{ height: '100%' }}>
              <div className="id-card-header">ФОНД SCP — УДОСТОВЕРЕНИЕ СОТРУДНИКА</div>
              <div className="id-card-name">{user?.fio}</div>
              <div className="id-card-callsign">«{user?.callsign}»</div>

              <div className={`id-card-cl-badge cl-${user?.clearanceLevel}`}>
                УРОВЕНЬ ДОПУСКА {user?.clearanceLevel}
              </div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-dim)', textAlign: 'center', marginTop: -8, marginBottom: 16 }}>
                {clInfo.name} [{clInfo.short}]
              </div>

              {[
                ['ФРАКЦИЯ',   user?.fraction],
                ['ТИП',       user?.fractionType === 'combat' ? 'БОЕВАЯ' : 'ГРАЖДАНСКАЯ'],
                ['ДОЛЖНОСТЬ', user?.position],
                ['DISCORD',   user?.discordNick],
              ].map(([k, v]) => (
                <div className="id-card-row" key={k}>
                  <span className="id-card-label">{k}</span>
                  <span className="id-card-value">{v}</span>
                </div>
              ))}

              {user?.clearanceExtensions?.length > 0 && (
                <div className="id-card-extensions" style={{ marginTop: 12 }}>
                  {user.clearanceExtensions.map(ext => (
                    <span key={ext} className="ext-badge">[{ext}]</span>
                  ))}
                </div>
              )}

              <div className="id-card-id">{user?.employeeId}</div>
            </div>
          </FadeIn>

          {/* Right column: stats + clearance */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {/* Stats row */}
            <FadeIn delay={0.1}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {[
                  { label: 'ПЕРСОНАЛ',  value: stats.personnel, color: 'var(--green)',  icon: '👤' },
                  { label: 'SCP',       value: stats.scps,      color: 'var(--red)',    icon: '☢' },
                  { label: 'ФРАКЦИИ',   value: stats.factions,  color: 'var(--accent)', icon: '◫' },
                  { label: 'РОЗЫСК',    value: stats.wanted,    color: 'var(--orange)', icon: '⚠' },
                ].map(s => (
                  <div key={s.label} className="card" style={{ textAlign: 'center', padding: '14px 10px', borderTop: `3px solid ${s.color}` }}>
                    <div style={{ fontSize: 22, marginBottom: 4 }}>{s.icon}</div>
                    <div style={{ fontFamily: 'var(--font-head)', fontSize: 24, color: s.color, fontWeight: 900 }}>{s.value}</div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-dim)', letterSpacing: 1 }}>{s.label}</div>
                  </div>
                ))}
              </div>
            </FadeIn>

            {/* Clearance scale */}
            <FadeIn delay={0.15}>
              <div className="card">
                <div className="card-title">ШКАЛА ДОПУСКА</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {Object.entries(CLEARANCE_LEVELS).map(([lvl, info]) => {
                    const active = parseInt(lvl) === user?.clearanceLevel;
                    return (
                      <div key={lvl} style={{
                        display: 'flex', alignItems: 'center', gap: 10,
                        padding: '5px 8px', borderRadius: 4,
                        background: active ? 'var(--surface2)' : 'transparent',
                        border: active ? `1px solid ${info.color}` : '1px solid transparent',
                        opacity: parseInt(lvl) > user?.clearanceLevel ? 0.3 : 1
                      }}>
                        <span className={`cl-${lvl}`} style={{ fontFamily: 'var(--font-head)', fontWeight: 900, fontSize: 15, minWidth: 20 }}>{lvl}</span>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: info.color, minWidth: 40 }}>{info.short}</span>
                        <span style={{ fontSize: 12, color: active ? 'var(--text-bright)' : 'var(--text-dim)' }}>{info.name}</span>
                        {active && <span style={{ marginLeft: 'auto', fontFamily: 'var(--font-mono)', fontSize: 9, color: info.color }}>● ВАШ УД</span>}
                      </div>
                    );
                  })}
                </div>
              </div>
            </FadeIn>
          </div>
        </div>

        {/* Quick links grid */}
        <FadeIn delay={0.2}>
          <div style={{ fontFamily: 'var(--font-head)', fontSize: 12, letterSpacing: 3, color: 'var(--text-dim)', marginBottom: 12 }}>
            БЫСТРЫЙ ДОСТУП
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 10 }}>
            {QUICK_LINKS.map((link, i) => (
              <CardMotion key={link.to} delay={i * 0.04} onClick={() => navigate(link.to)}>
                <div className="card" style={{
                  borderLeft: `4px solid ${link.color}`,
                  cursor: 'pointer', padding: '14px 16px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                    <span style={{ fontSize: 20 }}>{link.icon}</span>
                    <span style={{ fontFamily: 'var(--font-head)', fontSize: 13, color: link.color, letterSpacing: 1 }}>{link.label}</span>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-dim)', lineHeight: 1.4 }}>{link.desc}</div>
                </div>
              </CardMotion>
            ))}
          </div>
        </FadeIn>

        {/* Service IDs */}
        {user?.serviceIds?.length > 0 && (
          <FadeIn delay={0.3}>
            <div className="card" style={{ marginTop: 20 }}>
              <div className="card-title">УД ДРУГИХ СЛУЖБ</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
                {user.serviceIds.map((sid, i) => (
                  <div key={i} style={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 6, padding: '10px 16px', minWidth: 180 }}>
                    <div style={{ fontFamily: 'var(--font-head)', fontSize: 11, color: 'var(--accent)', letterSpacing: 2, marginBottom: 6 }}>{sid.service}</div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 14, color: 'var(--text-bright)' }}>{sid.idNumber}</div>
                  </div>
                ))}
              </div>
            </div>
          </FadeIn>
        )}

        <div style={{ marginTop: 24, textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-dim)', letterSpacing: 2 }}>
          [СИСТЕМА SCP:КПК v3.0 — ПРОТОКОЛ СВЯЗИ {commsBlocked ? 'ЗАБЛОКИРОВАН' : 'АКТИВЕН'}]
        </div>
      </div>
    </PageWrapper>
  );
}
