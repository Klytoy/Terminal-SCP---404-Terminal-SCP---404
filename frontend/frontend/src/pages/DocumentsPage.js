import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getDocs, getDoc, createDoc, requestDocAccess } from '../utils/api';
import { CLEARANCE_LEVELS } from '../utils/clearance';

const CATEGORIES = ['all', 'scp', 'documentation', 'order', 'protocol', 'other'];
const CAT_LABELS = { all: 'ВСЕ', scp: 'SCP', documentation: 'ДОКУМЕНТАЦИЯ', order: 'ПРИКАЗЫ', protocol: 'ПРОТОКОЛЫ', other: 'ПРОЧЕЕ' };

export default function DocumentsPage() {
  const { user } = useAuth();
  const [docs, setDocs] = useState([]);
  const [cat, setCat] = useState('all');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const [docContent, setDocContent] = useState(null);
  const [docError, setDocError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [reqReason, setReqReason] = useState('');
  const [reqSent, setReqSent] = useState(false);

  const isAdmin = user?.role === 'admin' || user?.role === 'superadmin';

  const [createForm, setCreateForm] = useState({
    title: '', content: '', category: 'documentation',
    minClearanceLevel: 0, requiredExtensions: '', tags: ''
  });

  const loadDocs = async () => {
    const params = {};
    if (cat !== 'all') params.category = cat;
    if (search) params.search = search;
    const res = await getDocs(params);
    setDocs(res.data);
  };

  useEffect(() => { loadDocs(); }, [cat, search]);

  const openDoc = async (doc) => {
    setSelected(doc);
    setDocContent(null);
    setDocError(null);
    setReqSent(false);
    if (!doc.canAccess) return;
    setLoading(true);
    try {
      const res = await getDoc(doc._id);
      setDocContent(res.data);
    } catch (e) {
      setDocError(e.response?.data);
    } finally { setLoading(false); }
  };

  const handleRequest = async () => {
    try {
      await requestDocAccess(selected._id, reqReason);
      setReqSent(true);
    } catch (e) {}
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await createDoc({
        ...createForm,
        minClearanceLevel: parseInt(createForm.minClearanceLevel),
        requiredExtensions: createForm.requiredExtensions ? createForm.requiredExtensions.split(',').map(s => s.trim()) : [],
        tags: createForm.tags ? createForm.tags.split(',').map(s => s.trim()) : []
      });
      setShowCreate(false);
      loadDocs();
    } catch (e) {}
  };

  return (
    <div className="page">
      <div className="page-title">ДОКУМЕНТАЦИЯ</div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <input
          className="form-input"
          style={{ width: 240 }}
          placeholder="Поиск..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        {CATEGORIES.map(c => (
          <button key={c} className={`btn btn-sm ${cat === c ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setCat(c)}>
            {CAT_LABELS[c]}
          </button>
        ))}
        {isAdmin && (
          <button className="btn btn-primary btn-sm" onClick={() => setShowCreate(true)} style={{ marginLeft: 'auto' }}>
            + СОЗДАТЬ
          </button>
        )}
      </div>

      <div className="grid-2">
        {/* Doc list */}
        <div>
          {docs.length === 0 && <div className="loading" style={{ height: 80 }}>НЕТ ДОКУМЕНТОВ</div>}
          {docs.map(doc => (
            <div
              key={doc._id}
              className={`doc-item ${!doc.canAccess ? 'locked' : ''} ${selected?._id === doc._id ? 'active' : ''}`}
              onClick={() => openDoc(doc)}
              style={{ borderColor: selected?._id === doc._id ? 'var(--accent)' : '' }}
            >
              <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <div className="doc-title">{doc.title}</div>
                  <div className="doc-meta">
                    {CAT_LABELS[doc.category] || doc.category}
                    {doc.subcategory && ` · ${doc.subcategory}`}
                    {' · '}
                    {new Date(doc.createdAt).toLocaleDateString('ru')}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div className={`cl-${doc.minClearanceLevel}`} style={{ fontFamily: 'var(--font-head)', fontWeight: 900, fontSize: 20 }}>
                    {doc.minClearanceLevel}
                  </div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-dim)' }}>УД</div>
                </div>
              </div>
              {!doc.canAccess && (
                <div className="doc-lock">
                  🔒 НЕДОСТАТОЧНЫЙ УРОВЕНЬ ДОПУСКА
                  {doc.requiredExtensions?.length > 0 && ` [${doc.requiredExtensions.join(', ')}]`}
                </div>
              )}
              {doc.tags?.length > 0 && (
                <div style={{ marginTop: 6, display: 'flex', gap: 4 }}>
                  {doc.tags.map(t => (
                    <span key={t} style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-dim)', background: 'var(--bg3)', padding: '2px 6px', borderRadius: 3 }}>
                      {t}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Doc content */}
        <div>
          {selected ? (
            <div className="card" style={{ position: 'sticky', top: 16 }}>
              <div style={{ display: 'flex', gap: 8, marginBottom: 12, alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: 'var(--font-head)', fontSize: 14, color: 'var(--text-bright)' }}>{selected.title}</div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-dim)', marginTop: 4 }}>
                    УД-{selected.minClearanceLevel} · {CAT_LABELS[selected.category]}
                  </div>
                </div>
                <button className="btn btn-ghost btn-sm" onClick={() => setSelected(null)}>✕</button>
              </div>

              {loading && <div className="loading" style={{ height: 80 }}>ЗАГРУЗКА...</div>}

              {docContent && (
                <div style={{ fontSize: 14, lineHeight: 1.8, color: 'var(--text)', whiteSpace: 'pre-wrap', maxHeight: 500, overflowY: 'auto' }}>
                  {docContent.content}
                </div>
              )}

              {!selected.canAccess && (
                <div>
                  <div className="alert alert-error">
                    🔒 Для доступа требуется УД-{selected.minClearanceLevel}
                    {selected.requiredExtensions?.length > 0 && ` + расширения [${selected.requiredExtensions.join(', ')}]`}
                  </div>
                  {!reqSent ? (
                    <div>
                      <div className="form-group">
                        <label className="form-label">Причина запроса</label>
                        <textarea className="form-textarea" value={reqReason} onChange={e => setReqReason(e.target.value)} rows={3} />
                      </div>
                      <button className="btn btn-primary" onClick={handleRequest}>ЗАПРОСИТЬ ДОСТУП</button>
                    </div>
                  ) : (
                    <div className="alert alert-success">Запрос отправлен</div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200, color: 'var(--text-dim)', fontFamily: 'var(--font-mono)', fontSize: 12 }}>
              ВЫБЕРИТЕ ДОКУМЕНТ
            </div>
          )}
        </div>
      </div>

      {/* Create modal */}
      {showCreate && (
        <div className="modal-overlay" onClick={() => setShowCreate(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 640 }}>
            <div className="modal-title">СОЗДАТЬ ДОКУМЕНТ</div>
            <form onSubmit={handleCreate}>
              <div className="form-group">
                <label className="form-label">Заголовок</label>
                <input className="form-input" value={createForm.title} onChange={e => setCreateForm(p => ({...p, title: e.target.value}))} required />
              </div>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Категория</label>
                  <select className="form-select" value={createForm.category} onChange={e => setCreateForm(p => ({...p, category: e.target.value}))}>
                    {Object.entries(CAT_LABELS).filter(([k]) => k !== 'all').map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Мин. УД (0-6)</label>
                  <select className="form-select" value={createForm.minClearanceLevel} onChange={e => setCreateForm(p => ({...p, minClearanceLevel: e.target.value}))}>
                    {[0,1,2,3,4,5,6].map(l => <option key={l} value={l}>УД-{l} — {CLEARANCE_LEVELS[l]?.short}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Расширения (через запятую, напр: ET,M)</label>
                <input className="form-input" value={createForm.requiredExtensions} onChange={e => setCreateForm(p => ({...p, requiredExtensions: e.target.value}))} placeholder="ET, M, SI..." />
              </div>
              <div className="form-group">
                <label className="form-label">Теги (через запятую)</label>
                <input className="form-input" value={createForm.tags} onChange={e => setCreateForm(p => ({...p, tags: e.target.value}))} />
              </div>
              <div className="form-group">
                <label className="form-label">Содержимое</label>
                <textarea className="form-textarea" value={createForm.content} onChange={e => setCreateForm(p => ({...p, content: e.target.value}))} rows={10} required />
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button type="button" className="btn btn-ghost" onClick={() => setShowCreate(false)} style={{ flex: 1 }}>ОТМЕНА</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 2 }}>СОЗДАТЬ</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
