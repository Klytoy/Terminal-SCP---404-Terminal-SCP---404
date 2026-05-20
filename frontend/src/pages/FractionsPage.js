import React, { useState, useEffect } from 'react';
import { getUsers } from '../utils/api';
import { getClearanceInfo } from '../utils/clearance';
import { useNavigate } from 'react-router-dom';

export default function FractionsPage() {
  const [users, setUsers] = useState([]);
  const [tab, setTab] = useState('all');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    getUsers({ search }).then(r => setUsers(r.data)).catch(() => {});
  }, [search]);

  const groups = users.reduce((acc, u) => {
    const key = u.fraction || 'Без фракции';
    if (!acc[key]) acc[key] = { name: key, type: u.fractionType, members: [] };
    acc[key].members.push(u);
    return acc;
  }, {});

  const filtered = Object.values(groups).filter(g => {
    if (tab === 'civilian') return g.type === 'civilian';
    if (tab === 'combat') return g.type === 'combat';
    return true;
  });

  return (
    <div className="page">
      <div className="page-title">ФРАКЦИИ</div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
        <input className="form-input" style={{ width: 240 }} placeholder="Поиск сотрудника..." value={search} onChange={e => setSearch(e.target.value)} />
        {[['all','ВСЕ'], ['civilian','ГРАЖДАНСКИЕ'], ['combat','БОЕВЫЕ']].map(([v, l]) => (
          <button key={v} className={`btn btn-sm ${tab === v ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setTab(v)}>{l}</button>
        ))}
      </div>

      {filtered.map(g => (
        <div key={g.name} className="card" style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
            <div>
              <div style={{ fontFamily: 'var(--font-head)', fontSize: 14, color: 'var(--text-bright)', letterSpacing: 1 }}>{g.name}</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: g.type === 'combat' ? 'var(--red)' : 'var(--accent)', marginTop: 2 }}>
                {g.type === 'combat' ? '⚔ БОЕВАЯ' : '◎ ГРАЖДАНСКАЯ'} · {g.members.length} чел.
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {g.members.map(m => {
              const cl = getClearanceInfo(m.clearanceLevel);
              return (
                <div
                  key={m._id}
                  onClick={() => setSelected(m)}
                  style={{
                    background: 'var(--bg3)',
                    border: '1px solid var(--border)',
                    borderRadius: 6,
                    padding: '10px 14px',
                    cursor: 'pointer',
                    transition: 'border-color 0.15s',
                    minWidth: 160
                  }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent)'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span className={`cl-${m.clearanceLevel}`} style={{ fontFamily: 'var(--font-head)', fontWeight: 900, fontSize: 18 }}>
                      {m.clearanceLevel}
                    </span>
                    <span style={{ fontWeight: 700, fontSize: 13 }}>{m.callsign}</span>
                  </div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-dim)' }}>{m.position}</div>
                  {m.employeeId && <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-dim)', marginTop: 2 }}>{m.employeeId}</div>}
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {/* Profile modal */}
      {selected && (
        <div className="modal-overlay" onClick={() => setSelected(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-title">ПРОФИЛЬ СОТРУДНИКА</div>
            <div className={`id-card id-card-cl${selected.clearanceLevel}`}>
              <div className="id-card-header">ФОНД SCP</div>
              <div className="id-card-name">{selected.fio}</div>
              <div className="id-card-callsign">«{selected.callsign}»</div>
              <div className={`id-card-cl-badge cl-${selected.clearanceLevel}`}>УД-{selected.clearanceLevel}</div>
              {[
                ['ФРАКЦИЯ', selected.fraction],
                ['ДОЛЖНОСТЬ', selected.position],
                ['DISCORD', selected.discordNick],
              ].map(([k, v]) => (
                <div className="id-card-row" key={k}>
                  <span className="id-card-label">{k}</span>
                  <span className="id-card-value">{v}</span>
                </div>
              ))}
              {selected.clearanceExtensions?.length > 0 && (
                <div className="id-card-extensions" style={{ marginTop: 12 }}>
                  {selected.clearanceExtensions.map(e => <span key={e} className="ext-badge">[{e}]</span>)}
                </div>
              )}
              <div className="id-card-id">{selected.employeeId}</div>
            </div>
            <button className="btn btn-ghost" onClick={() => setSelected(null)} style={{ width: '100%', marginTop: 16 }}>ЗАКРЫТЬ</button>
          </div>
        </div>
      )}
    </div>
  );
}
