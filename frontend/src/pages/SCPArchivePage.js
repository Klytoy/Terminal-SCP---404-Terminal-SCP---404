import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getSCPs, createSCP, updateSCP, deleteSCP, requestDocAccess } from '../utils/api';
import { PageWrapper, ListItem, FadeIn, ModalMotion } from '../components/Animated';

const CLASS_COLORS = {
  Safe: 'var(--green)',
  Euclid: 'var(--yellow)',
  Keter: 'var(--red)',
  Thaumiel: 'var(--purple)',
  Apollyon: '#ff0000',
  Neutralized: '#888'
};

const CLASSES = ['Safe', 'Euclid', 'Keter', 'Thaumiel', 'Apollyon', 'Neutralized'];

export default function SCPArchivePage() {
  const { user } = useAuth();
  const [scps, setSCPs] = useState([]);
  const [search, setSearch] = useState('');
  const [filterClass, setFilterClass] = useState('');
  const [filterSection, setFilterSection] = useState('');
  const [selected, setSelected] = useState(null);
  const [selectedData, setSelectedData] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit] = useState(null);
  const [reqSent, setReqSent] = useState(false);
  const isAdmin = user?.role === 'admin' || user?.role === 'superadmin';

  const [form, setForm] = useState({
    number: '', name: '', objectClass: 'Euclid',
    containmentProcedures: '', description: '', addendum: '',
    minClearanceLevel: 1, section: 'general', tags: ''
  });

  const load = async () => {
    try {
      const res = await getSCPs({ search, objectClass: filterClass, section: filterSection });
      setSCPs(res.data);
    } catch (e) {}
  };

  useEffect(() => { load(); }, [search, filterClass, filterSection]);

  const openSCP = async (scp) => {
    setSelected(scp);
    setSelectedData(null);
    setReqSent(false);
    if (!scp.canAccess) return;
    try {
      const res = await import('../utils/api').then(m => m.getSCP(scp._id));
      setSelectedData(res.data);
    } catch (e) {}
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await createSCP({
        ...form,
        minClearanceLevel: parseInt(form.minClearanceLevel),
        tags: form.tags ? form.tags.split(',').map(t => t.trim()) : []
      });
      setShowCreate(false);
      load();
    } catch (e) {}
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      await updateSCP(showEdit._id, {
        ...form,
        minClearanceLevel: parseInt(form.minClearanceLevel),
        tags: form.tags ? form.tags.split(',').map(t => t.trim()) : []
      });
      setShowEdit(null);
      load();
    } catch (e) {}
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Удалить SCP объект?')) return;
    try { await deleteSCP(id); load(); } catch (e) {}
  };

  const openEdit = (scp) => {
    setForm({
      number: scp.number, name: scp.name, objectClass: scp.objectClass,
      containmentProcedures: scp.containmentProcedures, description: scp.description,
      addendum: scp.addendum, minClearanceLevel: scp.minClearanceLevel,
      section: scp.section, tags: scp.tags?.join(', ') || ''
    });
    setShowEdit(scp);
  };

  const resetForm = () => setForm({ number:'', name:'', objectClass:'Euclid', containmentProcedures:'', description:'', addendum:'', minClearanceLevel:1, section:'general', tags:'' });

  return (
    <PageWrapper>
      <div className="page">
        <div className="page-title">АРХИВ SCP</div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
          <input className="form-input" style={{ width: 200 }} placeholder="Поиск..." value={search} onChange={e => setSearch(e.target.value)} />
          <select className="form-select" style={{ width: 140 }} value={filterClass} onChange={e => setFilterClass(e.target.value)}>
            <option value="">Все классы</option>
            {CLASSES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <select className="form-select" style={{ width: 140 }} value={filterSection} onChange={e => setFilterSection(e.target.value)}>
            <option value="">Все разделы</option>
            <option value="combat">Боевой</option>
            <option value="civilian">Гражданский</option>
            <option value="general">Общий</option>
          </select>
          {isAdmin && (
            <button className="btn btn-primary btn-sm" style={{ marginLeft: 'auto' }} onClick={() => { resetForm(); setShowCreate(true); }}>
              + СОЗДАТЬ SCP
            </button>
          )}
        </div>

        <div className="grid-2">
          <div>
            {scps.map((scp, i) => (
              <ListItem key={scp._id} index={i}>
                <div
                  className={`doc-item ${!scp.canAccess ? 'locked' : ''}`}
                  onClick={() => openSCP(scp)}
                  style={{ borderColor: selected?._id === scp._id ? 'var(--accent)' : '', borderLeft: `4px solid ${CLASS_COLORS[scp.objectClass] || '#888'}` }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: CLASS_COLORS[scp.objectClass], fontWeight: 700 }}>
                          {scp.number}
                        </span>
                        <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-bright)' }}>{scp.name}</span>
                      </div>
                      <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: CLASS_COLORS[scp.objectClass], border: `1px solid ${CLASS_COLORS[scp.objectClass]}`, padding: '1px 6px', borderRadius: 3 }}>
                          {scp.objectClass}
                        </span>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-dim)' }}>УД-{scp.minClearanceLevel}</span>
                      </div>
                    </div>
                    {isAdmin && (
                      <div style={{ display: 'flex', gap: 4 }} onClick={e => e.stopPropagation()}>
                        <button className="btn btn-ghost btn-sm" onClick={() => openEdit(scp)}>✎</button>
                        <button className="btn btn-danger btn-sm" onClick={() => handleDelete(scp._id)}>✕</button>
                      </div>
                    )}
                  </div>
                  {!scp.canAccess && <div className="doc-lock">🔒 УД-{scp.minClearanceLevel} ТРЕБУЕТСЯ</div>}
                </div>
              </ListItem>
            ))}
            {scps.length === 0 && <div className="loading" style={{ height: 80 }}>НЕТ ОБЪЕКТОВ</div>}
          </div>

          {/* Detail panel */}
          <div>
            {selected && (
              <FadeIn>
                <div className="card" style={{ position: 'sticky', top: 16, borderLeft: `4px solid ${CLASS_COLORS[selected.objectClass]}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                    <div>
                      <div style={{ fontFamily: 'var(--font-head)', fontSize: 16, color: CLASS_COLORS[selected.objectClass] }}>{selected.number}</div>
                      <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-bright)' }}>{selected.name}</div>
                    </div>
                    <button className="btn btn-ghost btn-sm" onClick={() => setSelected(null)}>✕</button>
                  </div>

                  {!selected.canAccess ? (
                    <div>
                      <div className="alert alert-error">🔒 Требуется УД-{selected.minClearanceLevel}</div>
                      {!reqSent ? (
                        <div>
                          <button className="btn btn-primary" onClick={async () => { await requestDocAccess(selected._id, 'Запрос доступа к SCP'); setReqSent(true); }}>
                            ЗАПРОСИТЬ ДОСТУП
                          </button>
                        </div>
                      ) : <div className="alert alert-success">Запрос отправлен</div>}
                    </div>
                  ) : selectedData ? (
                    <div style={{ maxHeight: 500, overflowY: 'auto' }}>
                      <div style={{ marginBottom: 16 }}>
                        <div className="id-card-label">КЛАСС ОБЪЕКТА</div>
                        <div style={{ color: CLASS_COLORS[selectedData.objectClass], fontWeight: 700, fontFamily: 'var(--font-head)' }}>{selectedData.objectClass}</div>
                      </div>
                      {selectedData.containmentProcedures && (
                        <div style={{ marginBottom: 16 }}>
                          <div className="id-card-label" style={{ marginBottom: 8 }}>ПРОЦЕДУРЫ СОДЕРЖАНИЯ</div>
                          <div style={{ fontSize: 13, lineHeight: 1.7, color: 'var(--text)', whiteSpace: 'pre-wrap' }}>{selectedData.containmentProcedures}</div>
                        </div>
                      )}
                      {selectedData.description && (
                        <div style={{ marginBottom: 16 }}>
                          <div className="id-card-label" style={{ marginBottom: 8 }}>ОПИСАНИЕ</div>
                          <div style={{ fontSize: 13, lineHeight: 1.7, color: 'var(--text)', whiteSpace: 'pre-wrap' }}>{selectedData.description}</div>
                        </div>
                      )}
                      {selectedData.addendum && (
                        <div>
                          <div className="id-card-label" style={{ marginBottom: 8 }}>АДДЕНДУМ</div>
                          <div style={{ fontSize: 13, lineHeight: 1.7, color: 'var(--text)', whiteSpace: 'pre-wrap' }}>{selectedData.addendum}</div>
                        </div>
                      )}
                    </div>
                  ) : <div className="loading" style={{ height: 60 }}>ЗАГРУЗКА...</div>}
                </div>
              </FadeIn>
            )}
          </div>
        </div>

        {/* Create/Edit Modal */}
        {(showCreate || showEdit) && (
          <div className="modal-overlay" onClick={() => { setShowCreate(false); setShowEdit(null); }}>
            <ModalMotion>
              <div className="modal" style={{ maxWidth: 640 }} onClick={e => e.stopPropagation()}>
                <div className="modal-title">{showCreate ? 'СОЗДАТЬ SCP ОБЪЕКТ' : 'РЕДАКТИРОВАТЬ SCP'}</div>
                <form onSubmit={showCreate ? handleCreate : handleUpdate}>
                  <div className="grid-2">
                    <div className="form-group">
                      <label className="form-label">Номер (SCP-XXX)</label>
                      <input className="form-input" value={form.number} onChange={e => setForm(p => ({...p, number: e.target.value}))} required placeholder="SCP-173" />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Название</label>
                      <input className="form-input" value={form.name} onChange={e => setForm(p => ({...p, name: e.target.value}))} required />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Класс объекта</label>
                      <select className="form-select" value={form.objectClass} onChange={e => setForm(p => ({...p, objectClass: e.target.value}))}>
                        {CLASSES.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Мин. УД</label>
                      <select className="form-select" value={form.minClearanceLevel} onChange={e => setForm(p => ({...p, minClearanceLevel: e.target.value}))}>
                        {[0,1,2,3,4,5,6].map(l => <option key={l} value={l}>УД-{l}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Раздел</label>
                    <select className="form-select" value={form.section} onChange={e => setForm(p => ({...p, section: e.target.value}))}>
                      <option value="general">Общий</option>
                      <option value="combat">Боевой</option>
                      <option value="civilian">Гражданский</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Процедуры содержания</label>
                    <textarea className="form-textarea" rows={4} value={form.containmentProcedures} onChange={e => setForm(p => ({...p, containmentProcedures: e.target.value}))} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Описание</label>
                    <textarea className="form-textarea" rows={4} value={form.description} onChange={e => setForm(p => ({...p, description: e.target.value}))} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Аддендум</label>
                    <textarea className="form-textarea" rows={3} value={form.addendum} onChange={e => setForm(p => ({...p, addendum: e.target.value}))} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Теги (через запятую)</label>
                    <input className="form-input" value={form.tags} onChange={e => setForm(p => ({...p, tags: e.target.value}))} />
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button type="button" className="btn btn-ghost" onClick={() => { setShowCreate(false); setShowEdit(null); }} style={{ flex: 1 }}>ОТМЕНА</button>
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
