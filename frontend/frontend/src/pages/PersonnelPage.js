import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getPersonnel, createPersonnel, updatePersonnel, deletePersonnel } from '../utils/api';
import { PageWrapper, ListItem, ModalMotion, FadeIn } from '../components/Animated';
import { getClearanceInfo } from '../utils/clearance';

const STATUS_CONFIG = {
  active:     { label: 'Активен',           color: 'var(--green)',    bg: 'rgba(46,204,113,0.12)'  },
  inactive:   { label: 'Неактивен',         color: '#888',            bg: 'rgba(136,136,136,0.1)'  },
  kia:        { label: 'Погиб',             color: 'var(--red)',      bg: 'rgba(231,76,60,0.12)'   },
  mia:        { label: 'Пропал б/в',        color: 'var(--yellow)',   bg: 'rgba(241,196,15,0.12)'  },
  suspended:  { label: 'Отстранён',         color: 'var(--orange)',   bg: 'rgba(230,126,34,0.12)'  },
  archived:   { label: 'Архивирован',       color: 'var(--text-dim)', bg: 'rgba(100,100,120,0.1)'  },
  classified: { label: 'Засекречен',        color: 'var(--purple)',   bg: 'rgba(155,89,182,0.12)'  },
  fake:       { label: 'Подделка',          color: '#ff4444',         bg: 'rgba(255,68,68,0.12)'   },
};

const EMPTY_FORM = {
  fio: '', callsign: '', position: '', fraction: '', fractionType: 'general',
  clearanceLevel: 1, clearanceExtensions: [],
  employeeId: '', discordNick: '', personnelStatus: 'active',
  biography: '', photo: '', minClearanceToView: 0, isClassified: false,
  serviceIds: []
};

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.active;
  return (
    <span style={{
      fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 700,
      color: cfg.color, background: cfg.bg,
      border: `1px solid ${cfg.color}`,
      padding: '2px 8px', borderRadius: 3, letterSpacing: 1
    }}>
      {cfg.label.toUpperCase()}
    </span>
  );
}

function ClearanceBadge({ level }) {
  return (
    <span className={`cl-${level}`} style={{
      fontFamily: 'var(--font-head)', fontWeight: 900, fontSize: 14,
      background: 'var(--bg3)', border: `1px solid currentColor`,
      padding: '2px 8px', borderRadius: 3
    }}>
      УД-{level}
    </span>
  );
}

function PersonnelCard({ record, onClick, onEdit, onDelete, isAdmin }) {
  const cl = getClearanceInfo(record.clearanceLevel || 0);
  if (record.isRedacted) {
    return (
      <div className="card" style={{ borderLeft: '4px solid var(--border)', opacity: 0.5 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 44, height: 44, background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, color: 'var(--text-dim)' }}>🔒</div>
          <div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--text-dim)', letterSpacing: 2 }}>█████████ █████</div>
            <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 3 }}>УД-{record.minClearanceToView} — доступ закрыт</div>
          </div>
          <div style={{ marginLeft: 'auto' }}>
            <ClearanceBadge level={record.clearanceLevel} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="card"
      onClick={onClick}
      style={{
        borderLeft: `4px solid ${STATUS_CONFIG[record.personnelStatus]?.color || 'var(--border)'}`,
        cursor: 'pointer', transition: 'border-color 0.15s',
      }}
      onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent)'}
      onMouseLeave={e => e.currentTarget.style.borderColor = STATUS_CONFIG[record.personnelStatus]?.color || 'var(--border)'}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {/* Avatar */}
        <div style={{
          width: 44, height: 44, background: 'var(--surface2)', border: '1px solid var(--border)',
          borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 18, color: 'var(--accent)', flexShrink: 0, overflow: 'hidden'
        }}>
          {record.photo
            ? <img src={record.photo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : (record.callsign?.[0] || '?').toUpperCase()}
        </div>

        {/* Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-bright)' }}>{record.fio}</span>
            {record.callsign && (
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--accent)' }}>«{record.callsign}»</span>
            )}
            <ClearanceBadge level={record.clearanceLevel} />
            <StatusBadge status={record.personnelStatus} />
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 4 }}>
            {record.position && <span>{record.position}</span>}
            {record.position && record.fraction && <span style={{ margin: '0 6px', opacity: 0.4 }}>•</span>}
            {record.fraction && <span>{record.fraction}</span>}
            {record.employeeId && <span style={{ marginLeft: 8, fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-dim)', opacity: 0.7 }}>[{record.employeeId}]</span>}
          </div>
        </div>

        {/* Admin actions */}
        {isAdmin && (
          <div style={{ display: 'flex', gap: 4, flexShrink: 0 }} onClick={e => e.stopPropagation()}>
            <button className="btn btn-ghost btn-sm" onClick={e => { e.stopPropagation(); onEdit(record); }}>✎</button>
            <button className="btn btn-danger btn-sm" onClick={e => { e.stopPropagation(); onDelete(record._id); }}>✕</button>
          </div>
        )}
      </div>
    </div>
  );
}

function PersonnelModal({ record, onClose, isAdmin, onEdit }) {
  const cl = getClearanceInfo(record.clearanceLevel || 0);
  return (
    <div className="modal-overlay" onClick={onClose}>
      <ModalMotion>
        <div className="modal" style={{ maxWidth: 520 }} onClick={e => e.stopPropagation()}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
            <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
              <div style={{
                width: 64, height: 64, background: 'var(--surface2)', border: '1px solid var(--border)',
                borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 28, color: 'var(--accent)', flexShrink: 0, overflow: 'hidden'
              }}>
                {record.photo
                  ? <img src={record.photo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 8 }} />
                  : (record.callsign?.[0] || '?').toUpperCase()}
              </div>
              <div>
                <div style={{ fontFamily: 'var(--font-head)', fontSize: 18, color: 'var(--text-bright)' }}>{record.fio}</div>
                {record.callsign && <div style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--accent)', marginTop: 2 }}>«{record.callsign}»</div>}
                <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
                  <ClearanceBadge level={record.clearanceLevel} />
                  <StatusBadge status={record.personnelStatus} />
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              {isAdmin && <button className="btn btn-ghost btn-sm" onClick={() => onEdit(record)}>✎</button>}
              <button className="btn btn-ghost btn-sm" onClick={onClose}>✕</button>
            </div>
          </div>

          <div style={{ borderTop: '1px solid var(--border)', paddingTop: 16 }}>
            {[
              ['ПОЗЫВНОЙ', record.callsign],
              ['ДОЛЖНОСТЬ', record.position],
              ['ФРАКЦИЯ', record.fraction + (record.fractionType !== 'general' ? ` (${record.fractionType === 'combat' ? 'боевая' : 'гражданская'})` : '')],
              ['DISCORD', record.discordNick],
              ['ID СОТРУДНИКА', record.employeeId],
              ['УД', `${record.clearanceLevel} — ${cl.name}`],
            ].filter(([, v]) => v).map(([k, v]) => (
              <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid var(--border)' }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-dim)', letterSpacing: 1 }}>{k}</span>
                <span style={{ fontSize: 13, color: 'var(--text-bright)', fontWeight: 600 }}>{v}</span>
              </div>
            ))}

            {record.clearanceExtensions?.length > 0 && (
              <div style={{ padding: '7px 0', borderBottom: '1px solid var(--border)' }}>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-dim)', marginBottom: 6 }}>РАСШИРЕНИЯ</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                  {record.clearanceExtensions.map(e => <span key={e} className="ext-badge">[{e}]</span>)}
                </div>
              </div>
            )}

            {record.serviceIds?.length > 0 && (
              <div style={{ padding: '7px 0', borderBottom: '1px solid var(--border)' }}>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-dim)', marginBottom: 6 }}>УД ДРУГИХ СЛУЖБ</div>
                {record.serviceIds.map((s, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                    <span style={{ color: 'var(--text-dim)' }}>{s.service}</span>
                    <span style={{ color: 'var(--accent)', fontFamily: 'var(--font-mono)' }}>{s.idNumber}</span>
                  </div>
                ))}
              </div>
            )}

            {record.biography && (
              <div style={{ marginTop: 12 }}>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-dim)', marginBottom: 6 }}>БИОГРАФИЯ / ЗАМЕТКИ</div>
                <div style={{ fontSize: 13, lineHeight: 1.7, color: 'var(--text)', whiteSpace: 'pre-wrap' }}>{record.biography}</div>
              </div>
            )}
          </div>
        </div>
      </ModalMotion>
    </div>
  );
}

function EditForm({ record, onSave, onClose }) {
  const [form, setForm] = useState(record ? { ...record, clearanceExtensions: record.clearanceExtensions || [], serviceIds: record.serviceIds || [] } : { ...EMPTY_FORM });
  const [svcService, setSvcService] = useState('');
  const [svcId, setSvcId] = useState('');

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const addServiceId = () => {
    if (!svcService || !svcId) return;
    setForm(p => ({ ...p, serviceIds: [...(p.serviceIds || []), { service: svcService, idNumber: svcId }] }));
    setSvcService(''); setSvcId('');
  };

  const removeServiceId = (i) => setForm(p => ({ ...p, serviceIds: p.serviceIds.filter((_, idx) => idx !== i) }));

  const handleSubmit = (e) => { e.preventDefault(); onSave(form); };

  const EXTENSIONS = ['A', 'M', 'SI', 'I', 'T', 'O', 'H', 'P', 'ET', 'S', 'R4', 'T4', 'O5'];

  const toggleExt = (ext) => {
    const cur = form.clearanceExtensions || [];
    setForm(p => ({ ...p, clearanceExtensions: cur.includes(ext) ? cur.filter(e => e !== ext) : [...cur, ext] }));
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <ModalMotion>
        <div className="modal" style={{ maxWidth: 640, maxHeight: '90vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
          <div className="modal-title">{record?._id ? 'РЕДАКТИРОВАТЬ ЗАПИСЬ' : 'СОЗДАТЬ ЗАПИСЬ'}</div>
          <form onSubmit={handleSubmit}>
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">ФИО *</label>
                <input className="form-input" value={form.fio} onChange={e => set('fio', e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label">Позывной *</label>
                <input className="form-input" value={form.callsign} onChange={e => set('callsign', e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label">Должность</label>
                <input className="form-input" value={form.position} onChange={e => set('position', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Фракция</label>
                <input className="form-input" value={form.fraction} onChange={e => set('fraction', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Тип фракции</label>
                <select className="form-select" value={form.fractionType} onChange={e => set('fractionType', e.target.value)}>
                  <option value="general">Общий</option>
                  <option value="combat">Боевая</option>
                  <option value="civilian">Гражданская</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Discord</label>
                <input className="form-input" value={form.discordNick} onChange={e => set('discordNick', e.target.value)} placeholder="@ник" />
              </div>
              <div className="form-group">
                <label className="form-label">ID сотрудника</label>
                <input className="form-input" value={form.employeeId} onChange={e => set('employeeId', e.target.value)} placeholder="SCP-0001" />
              </div>
              <div className="form-group">
                <label className="form-label">Статус персонала</label>
                <select className="form-select" value={form.personnelStatus} onChange={e => set('personnelStatus', e.target.value)}>
                  {Object.entries({ active:'Активен', inactive:'Неактивен', kia:'Погиб', mia:'Пропал б/в', suspended:'Отстранён', archived:'Архивирован', classified:'Засекречен', fake:'Подделка' }).map(([k,v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Уровень допуска</label>
                <select className="form-select" value={form.clearanceLevel} onChange={e => set('clearanceLevel', parseInt(e.target.value))}>
                  {[0,1,2,3,4,5,6].map(l => <option key={l} value={l}>УД-{l}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Мин. УД для просмотра</label>
                <select className="form-select" value={form.minClearanceToView} onChange={e => set('minClearanceToView', parseInt(e.target.value))}>
                  {[0,1,2,3,4,5,6].map(l => <option key={l} value={l}>УД-{l}</option>)}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Расширения УД</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {EXTENSIONS.map(ext => (
                  <button key={ext} type="button"
                    className={`btn btn-sm ${(form.clearanceExtensions || []).includes(ext) ? 'btn-primary' : 'btn-ghost'}`}
                    onClick={() => toggleExt(ext)}
                  >
                    [{ext}]
                  </button>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Фото (URL)</label>
              <input className="form-input" value={form.photo} onChange={e => set('photo', e.target.value)} placeholder="https://..." />
            </div>

            <div className="form-group">
              <label className="form-label">Биография / Заметки</label>
              <textarea className="form-textarea" rows={4} value={form.biography} onChange={e => set('biography', e.target.value)} />
            </div>

            {/* Service IDs */}
            <div className="form-group">
              <label className="form-label">УД других служб</label>
              {(form.serviceIds || []).map((s, i) => (
                <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 6 }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, flex: 1 }}>{s.service} — {s.idNumber}</span>
                  <button type="button" className="btn btn-danger btn-sm" onClick={() => removeServiceId(i)}>✕</button>
                </div>
              ))}
              <div style={{ display: 'flex', gap: 6 }}>
                <input className="form-input" style={{ flex: 1 }} placeholder="Служба (АПАИБ...)" value={svcService} onChange={e => setSvcService(e.target.value)} />
                <input className="form-input" style={{ flex: 1 }} placeholder="Номер УД" value={svcId} onChange={e => setSvcId(e.target.value)} />
                <button type="button" className="btn btn-ghost btn-sm" onClick={addServiceId}>+</button>
              </div>
            </div>

            <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <input type="checkbox" id="isClassified" checked={form.isClassified} onChange={e => set('isClassified', e.target.checked)} />
              <label htmlFor="isClassified" className="form-label" style={{ margin: 0, cursor: 'pointer' }}>
                Засекречено (скрыть для всех кроме администраторов)
              </label>
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              <button type="button" className="btn btn-ghost" onClick={onClose} style={{ flex: 1 }}>ОТМЕНА</button>
              <button type="submit" className="btn btn-primary" style={{ flex: 2 }}>СОХРАНИТЬ</button>
            </div>
          </form>
        </div>
      </ModalMotion>
    </div>
  );
}

export default function PersonnelPage() {
  const { user } = useAuth();
  const [records, setRecords] = useState([]);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [selected, setSelected] = useState(null);
  const [editRecord, setEditRecord] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const isAdmin = user?.role === 'admin' || user?.role === 'superadmin';

  const load = async () => {
    try {
      const res = await getPersonnel({ search, fractionType: filterType, personnelStatus: filterStatus });
      setRecords(res.data);
    } catch (e) {}
  };

  useEffect(() => { load(); }, [search, filterType, filterStatus]);

  const handleSave = async (form) => {
    try {
      if (editRecord?._id) await updatePersonnel(editRecord._id, form);
      else await createPersonnel(form);
      setEditRecord(null); setShowCreate(false); load();
    } catch (e) {}
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Удалить запись?')) return;
    try { await deletePersonnel(id); load(); } catch (e) {}
  };

  return (
    <PageWrapper>
      <div className="page">
        <div className="page-title">ПЕРСОНАЛ ФОНДА</div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
          <input className="form-input" style={{ width: 220 }} placeholder="Поиск по ФИО, позывному, ID..." value={search} onChange={e => setSearch(e.target.value)} />
          <select className="form-select" style={{ width: 140 }} value={filterType} onChange={e => setFilterType(e.target.value)}>
            <option value="">Все</option>
            <option value="combat">Боевые</option>
            <option value="civilian">Гражданские</option>
            <option value="general">Общие</option>
          </select>
          <select className="form-select" style={{ width: 150 }} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
            <option value="">Все статусы</option>
            {Object.entries(STATUS_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
          {isAdmin && (
            <button className="btn btn-primary btn-sm" style={{ marginLeft: 'auto' }} onClick={() => setShowCreate(true)}>
              + ДОБАВИТЬ
            </button>
          )}
        </div>

        {/* Stats bar */}
        <FadeIn>
          <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
            {Object.entries(STATUS_CONFIG).map(([k, v]) => {
              const count = records.filter(r => r.personnelStatus === k && !r.isRedacted).length;
              if (!count) return null;
              return (
                <div key={k} style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: v.color, background: v.bg, border: `1px solid ${v.color}`, padding: '4px 10px', borderRadius: 4 }}>
                  {v.label}: {count}
                </div>
              );
            })}
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-dim)', padding: '4px 10px' }}>
              Всего: {records.length}
            </div>
          </div>
        </FadeIn>

        {/* Records list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {records.map((r, i) => (
            <ListItem key={r._id} index={i}>
              <PersonnelCard
                record={r}
                onClick={() => !r.isRedacted && setSelected(r)}
                onEdit={setEditRecord}
                onDelete={handleDelete}
                isAdmin={isAdmin}
              />
            </ListItem>
          ))}
          {records.length === 0 && (
            <div className="loading" style={{ height: 80 }}>НЕТ ЗАПИСЕЙ</div>
          )}
        </div>

        {/* Detail modal */}
        {selected && (
          <PersonnelModal
            record={selected}
            onClose={() => setSelected(null)}
            isAdmin={isAdmin}
            onEdit={(r) => { setSelected(null); setEditRecord(r); }}
          />
        )}

        {/* Edit/Create form */}
        {(editRecord || showCreate) && (
          <EditForm
            record={editRecord || null}
            onSave={handleSave}
            onClose={() => { setEditRecord(null); setShowCreate(false); }}
          />
        )}
      </div>
    </PageWrapper>
  );
}
