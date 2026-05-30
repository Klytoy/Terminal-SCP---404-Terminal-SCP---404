import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getWanted, createWanted, updateWanted, deleteWanted } from '../utils/api';
import { PageWrapper, ListItem, ModalMotion } from '../components/Animated';

const DANGER_COLORS = { low: '#888', medium: 'var(--yellow)', high: 'var(--orange)', extreme: 'var(--red)' };
const DANGER_LABELS = { low: 'НИЗКИЙ', medium: 'СРЕДНИЙ', high: 'ВЫСОКИЙ', extreme: 'ЭКСТРЕМАЛЬНЫЙ' };
const STATUS_COLORS = { active: 'var(--red)', captured: 'var(--green)', eliminated: '#888', closed: 'var(--text-dim)' };
const STATUS_LABELS = { active: 'В РОЗЫСКЕ', captured: 'ЗАДЕРЖАН', eliminated: 'ЛИКВИДИРОВАН', closed: 'ЗАКРЫТ' };

export default function WantedPage() {
  const { user } = useAuth();
  const [wanted, setWanted] = useState([]);
  const [filterStatus, setFilterStatus] = useState('');
  const [selected, setSelected] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const isAdmin = user?.role === 'admin' || user?.role === 'superadmin';

  const [form, setForm] = useState({
    fio: '', alias: '', photo: '', description: '', crimes: '',
    article: '', dangerLevel: 'medium', status: 'active',
    reward: '', minClearanceLevel: 0
  });

  const load = async () => {
    try {
      const res = await getWanted({ status: filterStatus });
      setWanted(res.data);
    } catch (e) {}
  };

  useEffect(() => { load(); }, [filterStatus]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editItem) await updateWanted(editItem._id, form);
      else await createWanted(form);
      setShowForm(false); setEditItem(null);
      load();
    } catch (e) {}
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Удалить запись?')) return;
    try { await deleteWanted(id); load(); } catch (e) {}
  };

  const openEdit = (w) => {
    setForm({ fio: w.fio, alias: w.alias, photo: w.photo, description: w.description, crimes: w.crimes, article: w.article, dangerLevel: w.dangerLevel, status: w.status, reward: w.reward, minClearanceLevel: w.minClearanceLevel });
    setEditItem(w);
    setShowForm(true);
  };

  return (
    <PageWrapper>
      <div className="page">
        <div className="page-title">БАЗА РОЗЫСКА</div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 16, alignItems: 'center', flexWrap: 'wrap' }}>
          {['', 'active', 'captured', 'eliminated', 'closed'].map(s => (
            <button key={s} className={`btn btn-sm ${filterStatus === s ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setFilterStatus(s)}>
              {s === '' ? 'ВСЕ' : STATUS_LABELS[s]}
            </button>
          ))}
          {isAdmin && (
            <button className="btn btn-primary btn-sm" style={{ marginLeft: 'auto' }} onClick={() => { setForm({ fio:'', alias:'', photo:'', description:'', crimes:'', article:'', dangerLevel:'medium', status:'active', reward:'', minClearanceLevel:0 }); setEditItem(null); setShowForm(true); }}>
              + ДОБАВИТЬ
            </button>
          )}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
          {wanted.map((w, i) => (
            <ListItem key={w._id} index={i}>
              <div
                className="card"
                style={{ cursor: 'pointer', borderLeft: `4px solid ${DANGER_COLORS[w.dangerLevel]}`, position: 'relative' }}
                onClick={() => setSelected(w)}
              >
                {!w.canAccess ? (
                  <div style={{ filter: 'blur(4px)', pointerEvents: 'none' }}>
                    <div style={{ fontFamily: 'var(--font-head)', fontSize: 14, color: 'var(--text-dim)' }}>██████████</div>
                    <div style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 4 }}>ЗАСЕКРЕЧЕНО</div>
                  </div>
                ) : (
                  <>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-bright)' }}>{w.fio}</div>
                        {w.alias && <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-dim)' }}>«{w.alias}»</div>}
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: STATUS_COLORS[w.status], border: `1px solid ${STATUS_COLORS[w.status]}`, padding: '2px 6px', borderRadius: 3 }}>
                          {STATUS_LABELS[w.status]}
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: DANGER_COLORS[w.dangerLevel] }}>
                        ⚠ {DANGER_LABELS[w.dangerLevel]}
                      </span>
                      {w.reward && <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--yellow)' }}>💰 {w.reward}</span>}
                    </div>
                    {w.crimes && <div style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 8, lineHeight: 1.5 }}>{w.crimes.slice(0, 100)}{w.crimes.length > 100 ? '...' : ''}</div>}
                    {isAdmin && (
                      <div style={{ display: 'flex', gap: 6, marginTop: 10 }} onClick={e => e.stopPropagation()}>
                        <button className="btn btn-ghost btn-sm" onClick={() => openEdit(w)}>✎</button>
                        <button className="btn btn-danger btn-sm" onClick={() => handleDelete(w._id)}>✕</button>
                      </div>
                    )}
                  </>
                )}
              </div>
            </ListItem>
          ))}
        </div>

        {/* Detail modal */}
        {selected && selected.canAccess && (
          <div className="modal-overlay" onClick={() => setSelected(null)}>
            <ModalMotion>
              <div className="modal" style={{ maxWidth: 560 }} onClick={e => e.stopPropagation()}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                  <div className="modal-title" style={{ color: DANGER_COLORS[selected.dangerLevel] }}>
                    ⚠ {DANGER_LABELS[selected.dangerLevel]}
                  </div>
                  <button className="btn btn-ghost btn-sm" onClick={() => setSelected(null)}>✕</button>
                </div>
                <div style={{ fontFamily: 'var(--font-head)', fontSize: 18, color: 'var(--text-bright)', marginBottom: 4 }}>{selected.fio}</div>
                {selected.alias && <div style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--text-dim)', marginBottom: 12 }}>«{selected.alias}»</div>}
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: STATUS_COLORS[selected.status], marginBottom: 16 }}>
                  СТАТУС: {STATUS_LABELS[selected.status]}
                </div>
                {[
                  ['ПРЕСТУПЛЕНИЯ', selected.crimes],
                  ['СТАТЬЯ', selected.article],
                  ['ОПИСАНИЕ', selected.description],
                  ['ВОЗНАГРАЖДЕНИЕ', selected.reward],
                ].map(([label, val]) => val ? (
                  <div key={label} style={{ marginBottom: 12 }}>
                    <div className="id-card-label" style={{ marginBottom: 4 }}>{label}</div>
                    <div style={{ fontSize: 13, lineHeight: 1.6, color: 'var(--text)', whiteSpace: 'pre-wrap' }}>{val}</div>
                  </div>
                ) : null)}
              </div>
            </ModalMotion>
          </div>
        )}

        {/* Create/Edit form */}
        {showForm && (
          <div className="modal-overlay" onClick={() => setShowForm(false)}>
            <ModalMotion>
              <div className="modal" style={{ maxWidth: 560 }} onClick={e => e.stopPropagation()}>
                <div className="modal-title">{editItem ? 'РЕДАКТИРОВАТЬ' : 'ДОБАВИТЬ В РОЗЫСК'}</div>
                <form onSubmit={handleSubmit}>
                  <div className="grid-2">
                    <div className="form-group">
                      <label className="form-label">ФИО *</label>
                      <input className="form-input" value={form.fio} onChange={e => setForm(p => ({...p, fio: e.target.value}))} required />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Псевдоним/Позывной</label>
                      <input className="form-input" value={form.alias} onChange={e => setForm(p => ({...p, alias: e.target.value}))} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Уровень опасности</label>
                      <select className="form-select" value={form.dangerLevel} onChange={e => setForm(p => ({...p, dangerLevel: e.target.value}))}>
                        <option value="low">Низкий</option>
                        <option value="medium">Средний</option>
                        <option value="high">Высокий</option>
                        <option value="extreme">Экстремальный</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Статус</label>
                      <select className="form-select" value={form.status} onChange={e => setForm(p => ({...p, status: e.target.value}))}>
                        <option value="active">В розыске</option>
                        <option value="captured">Задержан</option>
                        <option value="eliminated">Ликвидирован</option>
                        <option value="closed">Закрыт</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Вознаграждение</label>
                      <input className="form-input" value={form.reward} onChange={e => setForm(p => ({...p, reward: e.target.value}))} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Мин. УД</label>
                      <select className="form-select" value={form.minClearanceLevel} onChange={e => setForm(p => ({...p, minClearanceLevel: parseInt(e.target.value)}))}>
                        {[0,1,2,3,4,5,6].map(l => <option key={l} value={l}>УД-{l}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Статья</label>
                    <input className="form-input" value={form.article} onChange={e => setForm(p => ({...p, article: e.target.value}))} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Преступления</label>
                    <textarea className="form-textarea" rows={3} value={form.crimes} onChange={e => setForm(p => ({...p, crimes: e.target.value}))} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Описание личности</label>
                    <textarea className="form-textarea" rows={3} value={form.description} onChange={e => setForm(p => ({...p, description: e.target.value}))} />
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button type="button" className="btn btn-ghost" onClick={() => setShowForm(false)} style={{ flex: 1 }}>ОТМЕНА</button>
                    <button type="submit" className="btn btn-primary" style={{ flex: 2 }}>СОХРАНИТЬ</button>
                  </div>
                </form>
              </div>
            </ModalMotion>
          </div>
        )}
      </div>
    </PageWrapper>
  );
}
