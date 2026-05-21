import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getLinkedOrgs, createLinkedOrg, updateLinkedOrg, deleteLinkedOrg } from '../utils/api';
import { PageWrapper, CardMotion, ModalMotion } from '../components/Animated';

const RELATION_COLORS = { allied: 'var(--green)', neutral: 'var(--text-dim)', hostile: 'var(--red)' };
const RELATION_LABELS = { allied: '⚔ СОЮЗНИК', neutral: '◎ НЕЙТРАЛ', hostile: '✕ ВРАГ' };

export default function LinkedOrgsPage() {
  const { user } = useAuth();
  const [orgs, setOrgs] = useState([]);
  const [selected, setSelected] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const isAdmin = user?.role === 'admin' || user?.role === 'superadmin';
  const canSeeDocLink = user?.clearanceLevel >= 5 || user?.role === 'superadmin';

  const [form, setForm] = useState({ name: '', logo: '', description: '', relation: 'neutral', minClearanceLevel: 0, documentLink: '', notes: '' });

  const load = async () => {
    try { const res = await getLinkedOrgs(); setOrgs(res.data); } catch (e) {}
  };

  useEffect(() => { load(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editItem) await updateLinkedOrg(editItem._id, form);
      else await createLinkedOrg(form);
      setShowForm(false); setEditItem(null); load();
    } catch (e) {}
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Удалить организацию?')) return;
    try { await deleteLinkedOrg(id); load(); } catch (e) {}
  };

  const openEdit = (org) => {
    setForm({ name: org.name, logo: org.logo, description: org.description, relation: org.relation, minClearanceLevel: org.minClearanceLevel, documentLink: org.documentLink || '', notes: org.notes });
    setEditItem(org); setShowForm(true);
  };

  return (
    <PageWrapper>
      <div className="page">
        <div className="page-title">СВЯЗАННЫЕ ОРГАНИЗАЦИИ</div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
          {isAdmin && (
            <button className="btn btn-primary btn-sm" onClick={() => { setForm({ name:'', logo:'', description:'', relation:'neutral', minClearanceLevel:0, documentLink:'', notes:'' }); setEditItem(null); setShowForm(true); }}>
              + ДОБАВИТЬ ОРГАНИЗАЦИЮ
            </button>
          )}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
          {orgs.map((org, i) => (
            <CardMotion key={org._id} delay={i * 0.05} onClick={() => org.canAccess && setSelected(org)}>
              <div className="card" style={{
                borderLeft: `4px solid ${RELATION_COLORS[org.relation]}`,
                opacity: org.canAccess ? 1 : 0.5,
                cursor: org.canAccess ? 'pointer' : 'default'
              }}>
                {!org.canAccess ? (
                  <div>
                    <div style={{ filter: 'blur(3px)', fontFamily: 'var(--font-head)', fontSize: 14 }}>██████████</div>
                    <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 4 }}>🔒 УД-{org.minClearanceLevel} ТРЕБУЕТСЯ</div>
                  </div>
                ) : (
                  <>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                      <div style={{ fontFamily: 'var(--font-head)', fontSize: 14, color: 'var(--text-bright)' }}>{org.name}</div>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: RELATION_COLORS[org.relation] }}>
                        {RELATION_LABELS[org.relation]}
                      </span>
                    </div>
                    <div style={{ fontSize: 13, color: 'var(--text-dim)', lineHeight: 1.5 }}>
                      {org.description.slice(0, 120)}{org.description.length > 120 ? '...' : ''}
                    </div>
                    {isAdmin && (
                      <div style={{ display: 'flex', gap: 6, marginTop: 10 }} onClick={e => e.stopPropagation()}>
                        <button className="btn btn-ghost btn-sm" onClick={() => openEdit(org)}>✎</button>
                        <button className="btn btn-danger btn-sm" onClick={() => handleDelete(org._id)}>✕</button>
                      </div>
                    )}
                  </>
                )}
              </div>
            </CardMotion>
          ))}
          {orgs.length === 0 && <div className="loading">НЕТ ОРГАНИЗАЦИЙ</div>}
        </div>

        {/* Detail modal */}
        {selected && (
          <div className="modal-overlay" onClick={() => setSelected(null)}>
            <ModalMotion>
              <div className="modal" style={{ maxWidth: 500 }} onClick={e => e.stopPropagation()}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                  <div className="modal-title">{selected.name}</div>
                  <button className="btn btn-ghost btn-sm" onClick={() => setSelected(null)}>✕</button>
                </div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: RELATION_COLORS[selected.relation], marginBottom: 12 }}>
                  {RELATION_LABELS[selected.relation]}
                </div>
                <div style={{ fontSize: 14, lineHeight: 1.7, color: 'var(--text)', marginBottom: 16, whiteSpace: 'pre-wrap' }}>{selected.description}</div>
                {selected.notes && (
                  <div>
                    <div className="id-card-label" style={{ marginBottom: 6 }}>ЗАМЕТКИ</div>
                    <div style={{ fontSize: 13, color: 'var(--text-dim)', whiteSpace: 'pre-wrap' }}>{selected.notes}</div>
                  </div>
                )}
                {canSeeDocLink && selected.documentLink && (
                  <div style={{ marginTop: 16 }}>
                    <div className="id-card-label" style={{ marginBottom: 6 }}>ДОКУМЕНТ</div>
                    <a href={selected.documentLink} target="_blank" rel="noreferrer" style={{ color: 'var(--accent)', fontFamily: 'var(--font-mono)', fontSize: 12 }}>
                      {selected.documentLink}
                    </a>
                  </div>
                )}
              </div>
            </ModalMotion>
          </div>
        )}

        {/* Form modal */}
        {showForm && (
          <div className="modal-overlay" onClick={() => setShowForm(false)}>
            <ModalMotion>
              <div className="modal" onClick={e => e.stopPropagation()}>
                <div className="modal-title">{editItem ? 'РЕДАКТИРОВАТЬ' : 'НОВАЯ ОРГАНИЗАЦИЯ'}</div>
                <form onSubmit={handleSubmit}>
                  <div className="form-group">
                    <label className="form-label">Название *</label>
                    <input className="form-input" value={form.name} onChange={e => setForm(p => ({...p, name: e.target.value}))} required />
                  </div>
                  <div className="grid-2">
                    <div className="form-group">
                      <label className="form-label">Тип отношений</label>
                      <select className="form-select" value={form.relation} onChange={e => setForm(p => ({...p, relation: e.target.value}))}>
                        <option value="allied">Союзник</option>
                        <option value="neutral">Нейтрал</option>
                        <option value="hostile">Враг</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Мин. УД</label>
                      <select className="form-select" value={form.minClearanceLevel} onChange={e => setForm(p => ({...p, minClearanceLevel: parseInt(e.target.value)}))}>
                        {[0,1,2,3,4,5,6].map(l => <option key={l} value={l}>УД-{l}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Описание</label>
                    <textarea className="form-textarea" rows={4} value={form.description} onChange={e => setForm(p => ({...p, description: e.target.value}))} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Заметки</label>
                    <textarea className="form-textarea" rows={3} value={form.notes} onChange={e => setForm(p => ({...p, notes: e.target.value}))} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Ссылка на документ (только УД-5+)</label>
                    <input className="form-input" value={form.documentLink} onChange={e => setForm(p => ({...p, documentLink: e.target.value}))} placeholder="https://..." />
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
