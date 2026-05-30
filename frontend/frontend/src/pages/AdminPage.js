import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  getAdminRequests, approveRequest, rejectRequest,
  getAdminUsers, updateUser, blockAllComms, getCommsStatus,
  issueServiceId, getConversations, blockConversation,
  getCustomClearances, createCustomClearance, updateCustomClearance,
  deleteCustomClearance, assignCustomClearance, unassignCustomClearance,
  getPersonnel, updatePersonnel
} from '../utils/api';
import { CLEARANCE_LEVELS, EXTENSIONS } from '../utils/clearance';
import { PageWrapper, FadeIn, ModalMotion, ListItem } from '../components/Animated';

const TABS = ['ЗАЯВКИ', 'ПОЛЬЗОВАТЕЛИ', 'ТВИНКИ', 'СВЯЗЬ', 'ПЕРСОНАЛ', 'УД'];
const EXTENSIONS_LIST = ['A','M','SI','I','T','O','H','P','ET','S','R4','T4','O5'];

// ─── APPROVE MODAL ────────────────────────────────────────────────────────────
function ApproveModal({ req, onApprove, onClose }) {
  const data = req.registrationData || {};
  const [empId, setEmpId] = useState('');
  const [note, setNote] = useState('');
  const [cl, setCl] = useState(data.clearanceLevel ?? 1);
  const [extensions, setExtensions] = useState([]);
  const [fraction, setFraction] = useState(data.fraction || '');
  const [fractionType, setFractionType] = useState(data.fractionType || 'civilian');
  const [position, setPosition] = useState(data.position || '');
  const [role, setRole] = useState('user');

  const toggleExt = (ext) => setExtensions(p => p.includes(ext) ? p.filter(e=>e!==ext) : [...p, ext]);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <ModalMotion>
        <div className="modal" style={{ maxWidth: 560 }} onClick={e => e.stopPropagation()}>
          <div className="modal-title">ОДОБРИТЬ ЗАЯВКУ</div>
          <div style={{ background: 'var(--bg3)', borderRadius: 6, padding: 14, marginBottom: 16, fontSize: 13 }}>
            <div style={{ fontFamily: 'var(--font-head)', fontSize: 14, color: 'var(--text-bright)', marginBottom: 8 }}>{data.fio}</div>
            {[['Логин', data.username],['Discord', data.discordNick],['Позывной', data.callsign]].map(([k,v]) => (
              <div key={k} style={{ display: 'flex', gap: 8, marginBottom: 4 }}>
                <span style={{ color: 'var(--text-dim)', fontFamily: 'var(--font-mono)', fontSize: 11, minWidth: 70 }}>{k}:</span>
                <span style={{ color: 'var(--text-bright)' }}>{v}</span>
              </div>
            ))}
            {data.suggestion && <div style={{ marginTop: 8, color: 'var(--text-dim)', fontSize: 12 }}>Предложение: {data.suggestion}</div>}
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">ID сотрудника</label>
              <input className="form-input" value={empId} onChange={e => setEmpId(e.target.value)} placeholder="SCP-0001 (авто)" />
            </div>
            <div className="form-group">
              <label className="form-label">Уровень допуска</label>
              <select className="form-select" value={cl} onChange={e => setCl(e.target.value)}>
                {[0,1,2,3,4,5,6].map(l => <option key={l} value={l}>УД-{l}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Фракция</label>
              <input className="form-input" value={fraction} onChange={e => setFraction(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Тип фракции</label>
              <select className="form-select" value={fractionType} onChange={e => setFractionType(e.target.value)}>
                <option value="civilian">Гражданская</option>
                <option value="combat">Боевая</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Должность</label>
              <input className="form-input" value={position} onChange={e => setPosition(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Роль</label>
              <select className="form-select" value={role} onChange={e => setRole(e.target.value)}>
                <option value="user">Пользователь</option>
                <option value="admin">Администратор</option>
                <option value="superadmin">Супер Админ</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Расширения УД</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {EXTENSIONS_LIST.map(ext => (
                <button key={ext} type="button"
                  className={`btn btn-sm ${extensions.includes(ext) ? 'btn-primary' : 'btn-ghost'}`}
                  onClick={() => toggleExt(ext)}>
                  [{ext}]
                </button>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Комментарий (необязательно)</label>
            <input className="form-input" value={note} onChange={e => setNote(e.target.value)} />
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-ghost" onClick={onClose} style={{ flex: 1 }}>ОТМЕНА</button>
            <button className="btn btn-primary" style={{ flex: 2 }} onClick={() => onApprove(req._id, {
              note, employeeId: empId,
              overrideClearance: parseInt(cl),
              overrideExtensions: extensions,
              overrideFraction: fraction,
              overridePosition: position,
              overrideRole: role,
            })}>
              ✓ ОДОБРИТЬ И СОЗДАТЬ
            </button>
          </div>
        </div>
      </ModalMotion>
    </div>
  );
}

// ─── USER EDIT MODAL ──────────────────────────────────────────────────────────
function UserEditModal({ user: u, onSave, onClose }) {
  const [form, setForm] = useState({
    fio: u.fio || '', callsign: u.callsign || '', discordNick: u.discordNick || '',
    fraction: u.fraction || '', fractionType: u.fractionType || 'civilian',
    position: u.position || '', employeeId: u.employeeId || '',
    clearanceLevel: u.clearanceLevel ?? 0,
    clearanceExtensions: u.clearanceExtensions || [],
    role: u.role || 'user', status: u.status || 'approved',
    personnelStatus: u.personnelStatus || 'active',
    biography: u.biography || ''
  });
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const toggleExt = (ext) => {
    const cur = form.clearanceExtensions;
    set('clearanceExtensions', cur.includes(ext) ? cur.filter(e=>e!==ext) : [...cur, ext]);
  };

  const PERSONNEL_STATUSES = ['active','inactive','kia','mia','suspended','archived','classified','fake'];
  const PERSONNEL_LABELS = { active:'Активен', inactive:'Неактивен', kia:'Погиб', mia:'Пропал б/в', suspended:'Отстранён', archived:'Архивирован', classified:'Засекречен', fake:'Подделка' };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <ModalMotion>
        <div className="modal" style={{ maxWidth: 640, maxHeight: '90vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
          <div className="modal-title">РЕДАКТИРОВАТЬ: {u.callsign}</div>
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">ФИО</label>
              <input className="form-input" value={form.fio} onChange={e => set('fio', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Позывной</label>
              <input className="form-input" value={form.callsign} onChange={e => set('callsign', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Discord</label>
              <input className="form-input" value={form.discordNick} onChange={e => set('discordNick', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">ID сотрудника</label>
              <input className="form-input" value={form.employeeId} onChange={e => set('employeeId', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Фракция</label>
              <input className="form-input" value={form.fraction} onChange={e => set('fraction', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Тип фракции</label>
              <select className="form-select" value={form.fractionType} onChange={e => set('fractionType', e.target.value)}>
                <option value="civilian">Гражданская</option>
                <option value="combat">Боевая</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Должность</label>
              <input className="form-input" value={form.position} onChange={e => set('position', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Уровень допуска</label>
              <select className="form-select" value={form.clearanceLevel} onChange={e => set('clearanceLevel', parseInt(e.target.value))}>
                {[0,1,2,3,4,5,6].map(l => <option key={l} value={l}>УД-{l}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Роль</label>
              <select className="form-select" value={form.role} onChange={e => set('role', e.target.value)}>
                <option value="user">Пользователь</option>
                <option value="admin">Администратор</option>
                <option value="superadmin">Супер Админ</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Статус аккаунта</label>
              <select className="form-select" value={form.status} onChange={e => set('status', e.target.value)}>
                <option value="approved">Активен</option>
                <option value="banned">Заблокирован</option>
              </select>
            </div>
            <div className="form-group" style={{ gridColumn: '1/-1' }}>
              <label className="form-label">Статус персонала</label>
              <select className="form-select" value={form.personnelStatus} onChange={e => set('personnelStatus', e.target.value)}>
                {PERSONNEL_STATUSES.map(s => <option key={s} value={s}>{PERSONNEL_LABELS[s]}</option>)}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Расширения УД</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {EXTENSIONS_LIST.map(ext => (
                <button key={ext} type="button"
                  className={`btn btn-sm ${form.clearanceExtensions.includes(ext) ? 'btn-primary' : 'btn-ghost'}`}
                  onClick={() => toggleExt(ext)}>
                  [{ext}]
                </button>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Биография / Заметки</label>
            <textarea className="form-textarea" rows={3} value={form.biography} onChange={e => set('biography', e.target.value)} />
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-ghost" onClick={onClose} style={{ flex: 1 }}>ОТМЕНА</button>
            <button className="btn btn-primary" onClick={() => onSave(u._id, form)} style={{ flex: 2 }}>СОХРАНИТЬ</button>
          </div>
        </div>
      </ModalMotion>
    </div>
  );
}

// ─── CUSTOM CLEARANCE EDITOR ──────────────────────────────────────────────────
function CustomClearanceEditor({ cc, onSave, onClose }) {
  const [form, setForm] = useState(cc ? { ...cc } : {
    name: '', code: '', description: '', baseLevel: 1,
    extensions: [], color: '#00b4d8',
    permissions: {
      canViewPersonnel: true, canViewSCP: true, canViewDocuments: true,
      canViewFactions: true, canViewWanted: true, canViewLinkedOrgs: false,
      canSendMessages: true, canCreateRequests: true, maxViewableClearance: 3
    }
  });
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const setPerm = (k, v) => setForm(p => ({ ...p, permissions: { ...p.permissions, [k]: v } }));
  const toggleExt = (ext) => set('extensions', form.extensions?.includes(ext)
    ? form.extensions.filter(e=>e!==ext) : [...(form.extensions||[]), ext]);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <ModalMotion>
        <div className="modal" style={{ maxWidth: 600, maxHeight: '90vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
          <div className="modal-title">{cc?._id ? 'РЕДАКТИРОВАТЬ УД' : 'СОЗДАТЬ УД'}</div>

          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Название УД *</label>
              <input className="form-input" value={form.name} onChange={e => set('name', e.target.value)} placeholder="напр. Красная Рука" required />
            </div>
            <div className="form-group">
              <label className="form-label">Код *</label>
              <input className="form-input" value={form.code} onChange={e => set('code', e.target.value)} placeholder="напр. A1-RRH" />
            </div>
            <div className="form-group">
              <label className="form-label">Базовый уровень</label>
              <select className="form-select" value={form.baseLevel} onChange={e => set('baseLevel', parseInt(e.target.value))}>
                {[0,1,2,3,4,5,6].map(l => <option key={l} value={l}>УД-{l}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Цвет</label>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <input type="color" value={form.color} onChange={e => set('color', e.target.value)}
                  style={{ width: 40, height: 36, border: '1px solid var(--border)', borderRadius: 4, cursor: 'pointer', background: 'none' }} />
                <input className="form-input" value={form.color} onChange={e => set('color', e.target.value)} style={{ flex: 1 }} />
              </div>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Описание</label>
            <textarea className="form-textarea" rows={2} value={form.description} onChange={e => set('description', e.target.value)} />
          </div>

          <div className="form-group">
            <label className="form-label">Расширения (входят в этот УД)</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {EXTENSIONS_LIST.map(ext => (
                <button key={ext} type="button"
                  className={`btn btn-sm ${(form.extensions||[]).includes(ext) ? 'btn-primary' : 'btn-ghost'}`}
                  onClick={() => toggleExt(ext)}>
                  [{ext}]
                </button>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: 16 }}>
            <div className="form-label" style={{ marginBottom: 12 }}>ПРАВА ДОСТУПА</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {[
                ['canViewPersonnel', 'Просмотр персонала'],
                ['canViewSCP', 'Просмотр архива SCP'],
                ['canViewDocuments', 'Просмотр документов'],
                ['canViewFactions', 'Просмотр фракций'],
                ['canViewWanted', 'Просмотр розыска'],
                ['canViewLinkedOrgs', 'Связанные организации'],
                ['canSendMessages', 'Отправка сообщений'],
                ['canCreateRequests', 'Подача запросов'],
              ].map(([k, label]) => (
                <label key={k} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13 }}>
                  <input type="checkbox" checked={form.permissions?.[k] ?? true}
                    onChange={e => setPerm(k, e.target.checked)}
                    style={{ width: 16, height: 16 }} />
                  {label}
                </label>
              ))}
            </div>
            <div className="form-group" style={{ marginTop: 12 }}>
              <label className="form-label">Макс. просматриваемый УД</label>
              <select className="form-select" value={form.permissions?.maxViewableClearance ?? 3}
                onChange={e => setPerm('maxViewableClearance', parseInt(e.target.value))}>
                {[0,1,2,3,4,5,6].map(l => <option key={l} value={l}>УД-{l} и ниже</option>)}
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-ghost" onClick={onClose} style={{ flex: 1 }}>ОТМЕНА</button>
            <button className="btn btn-primary" onClick={() => onSave(form)} style={{ flex: 2 }}>СОХРАНИТЬ</button>
          </div>
        </div>
      </ModalMotion>
    </div>
  );
}

// ─── PERSONNEL ADMIN TAB ──────────────────────────────────────────────────────
function PersonnelAdminTab() {
  const [records, setRecords] = useState([]);
  const [search, setSearch] = useState('');
  const [editRec, setEditRec] = useState(null);

  const load = async () => {
    try { const res = await getPersonnel({ search }); setRecords(res.data); } catch(e) {}
  };
  useEffect(() => { load(); }, [search]);

  const handleSave = async (form) => {
    try { await updatePersonnel(editRec._id, form); setEditRec(null); load(); } catch(e) {}
  };

  const STATUS_COLORS = { active:'var(--green)', inactive:'#888', kia:'var(--red)', mia:'var(--yellow)', suspended:'var(--orange)', archived:'var(--text-dim)', classified:'var(--purple)', fake:'#ff4444' };

  return (
    <div>
      <input className="form-input" style={{ marginBottom: 16 }} placeholder="Поиск..." value={search} onChange={e => setSearch(e.target.value)} />
      {records.map((r, i) => (
        <ListItem key={r._id} index={i}>
          <div className="card" style={{ marginBottom: 8, borderLeft: `4px solid ${STATUS_COLORS[r.personnelStatus] || 'var(--border)'}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ fontWeight: 700 }}>{r.fio}</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--accent)', marginLeft: 8 }}>«{r.callsign}»</span>
                <span className={`cl-${r.clearanceLevel}`} style={{ fontFamily: 'var(--font-head)', fontWeight: 900, fontSize: 16, marginLeft: 10 }}>УД-{r.clearanceLevel}</span>
              </div>
              <button className="btn btn-ghost btn-sm" onClick={() => setEditRec(r)}>✎ РЕДАКТ.</button>
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 4 }}>{r.position} · {r.fraction}</div>
          </div>
        </ListItem>
      ))}

      {editRec && (
        <div className="modal-overlay" onClick={() => setEditRec(null)}>
          <ModalMotion>
            <div className="modal" style={{ maxWidth: 640, maxHeight: '90vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
              <div className="modal-title">РЕДАКТИРОВАТЬ ПЕРСОНАЛ: {editRec.callsign}</div>
              <PersonnelAdminForm record={editRec} onSave={handleSave} onClose={() => setEditRec(null)} />
            </div>
          </ModalMotion>
        </div>
      )}
    </div>
  );
}

function PersonnelAdminForm({ record, onSave, onClose }) {
  const [form, setForm] = useState({
    fio: record.fio || '', callsign: record.callsign || '', position: record.position || '',
    fraction: record.fraction || '', fractionType: record.fractionType || 'general',
    clearanceLevel: record.clearanceLevel ?? 0, clearanceExtensions: record.clearanceExtensions || [],
    employeeId: record.employeeId || '', discordNick: record.discordNick || '',
    personnelStatus: record.personnelStatus || 'active', biography: record.biography || '',
    minClearanceToView: record.minClearanceToView ?? 0, isClassified: record.isClassified ?? false
  });
  const set = (k,v) => setForm(p=>({...p,[k]:v}));
  const toggleExt = (ext) => set('clearanceExtensions', form.clearanceExtensions.includes(ext)
    ? form.clearanceExtensions.filter(e=>e!==ext) : [...form.clearanceExtensions, ext]);

  const STATUSES = { active:'Активен', inactive:'Неактивен', kia:'Погиб', mia:'Пропал б/в', suspended:'Отстранён', archived:'Архивирован', classified:'Засекречен', fake:'Подделка' };

  return (
    <form onSubmit={e => { e.preventDefault(); onSave(form); }}>
      <div className="grid-2">
        <div className="form-group"><label className="form-label">ФИО</label><input className="form-input" value={form.fio} onChange={e=>set('fio',e.target.value)} /></div>
        <div className="form-group"><label className="form-label">Позывной</label><input className="form-input" value={form.callsign} onChange={e=>set('callsign',e.target.value)} /></div>
        <div className="form-group"><label className="form-label">Должность</label><input className="form-input" value={form.position} onChange={e=>set('position',e.target.value)} /></div>
        <div className="form-group"><label className="form-label">Фракция</label><input className="form-input" value={form.fraction} onChange={e=>set('fraction',e.target.value)} /></div>
        <div className="form-group"><label className="form-label">Уровень допуска</label>
          <select className="form-select" value={form.clearanceLevel} onChange={e=>set('clearanceLevel',parseInt(e.target.value))}>
            {[0,1,2,3,4,5,6].map(l=><option key={l} value={l}>УД-{l}</option>)}
          </select>
        </div>
        <div className="form-group"><label className="form-label">Статус персонала</label>
          <select className="form-select" value={form.personnelStatus} onChange={e=>set('personnelStatus',e.target.value)}>
            {Object.entries(STATUSES).map(([k,v])=><option key={k} value={k}>{v}</option>)}
          </select>
        </div>
        <div className="form-group"><label className="form-label">ID сотрудника</label><input className="form-input" value={form.employeeId} onChange={e=>set('employeeId',e.target.value)} /></div>
        <div className="form-group"><label className="form-label">Discord</label><input className="form-input" value={form.discordNick} onChange={e=>set('discordNick',e.target.value)} /></div>
        <div className="form-group"><label className="form-label">Мин. УД для просмотра</label>
          <select className="form-select" value={form.minClearanceToView} onChange={e=>set('minClearanceToView',parseInt(e.target.value))}>
            {[0,1,2,3,4,5,6].map(l=><option key={l} value={l}>УД-{l}</option>)}
          </select>
        </div>
        <div className="form-group" style={{ display:'flex', alignItems:'center', gap:10 }}>
          <input type="checkbox" id="isClass" checked={form.isClassified} onChange={e=>set('isClassified',e.target.checked)} />
          <label htmlFor="isClass" className="form-label" style={{margin:0, cursor:'pointer'}}>Засекречено</label>
        </div>
      </div>
      <div className="form-group">
        <label className="form-label">Расширения УД</label>
        <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
          {EXTENSIONS_LIST.map(ext=>(
            <button key={ext} type="button" className={`btn btn-sm ${form.clearanceExtensions.includes(ext)?'btn-primary':'btn-ghost'}`} onClick={()=>toggleExt(ext)}>[{ext}]</button>
          ))}
        </div>
      </div>
      <div className="form-group"><label className="form-label">Биография</label><textarea className="form-textarea" rows={3} value={form.biography} onChange={e=>set('biography',e.target.value)} /></div>
      <div style={{ display:'flex', gap:8 }}>
        <button type="button" className="btn btn-ghost" onClick={onClose} style={{flex:1}}>ОТМЕНА</button>
        <button type="submit" className="btn btn-primary" style={{flex:2}}>СОХРАНИТЬ</button>
      </div>
    </form>
  );
}

// ─── MAIN AdminPage ────────────────────────────────────────────────────────────
export default function AdminPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState(0);
  const [requests, setRequests] = useState([]);
  const [users, setUsers] = useState([]);
  const [twins, setTwins] = useState([]);
  const [convs, setConvs] = useState([]);
  const [commsBlocked, setCommsBlocked] = useState(false);
  const [reqFilter, setReqFilter] = useState('pending');
  const [userSearch, setUserSearch] = useState('');
  const [approveModal, setApproveModal] = useState(null);
  const [editUserModal, setEditUserModal] = useState(null);
  const [issueModal, setIssueModal] = useState(null);
  const [issueSvc, setIssueSvc] = useState('');
  const [issueIdNum, setIssueIdNum] = useState('');

  // Custom clearances
  const [customClearances, setCustomClearances] = useState([]);
  const [ccEditor, setCcEditor] = useState(null);
  const [ccAssignUser, setCcAssignUser] = useState(null); // { cc, users }
  const [ccUserSearch, setCcUserSearch] = useState('');

  const loadRequests = useCallback(async () => {
    try { const res = await getAdminRequests({ status: reqFilter }); setRequests(res.data); } catch(e) {}
  }, [reqFilter]);

  const loadUsers = useCallback(async () => {
    try {
      const [ur, tr] = await Promise.all([
        getAdminUsers({ isTwin: 'false', search: userSearch }),
        getAdminUsers({ isTwin: 'true' })
      ]);
      setUsers(ur.data); setTwins(tr.data);
    } catch(e) {}
  }, [userSearch]);

  const loadConvs = useCallback(async () => {
    try { const res = await getConversations(); setConvs(res.data); } catch(e) {}
  }, []);

  const loadCommsStatus = useCallback(async () => {
    try { const res = await getCommsStatus(); setCommsBlocked(res.data.blocked); } catch(e) {}
  }, []);

  const loadCustomClearances = useCallback(async () => {
    try { const res = await getCustomClearances(); setCustomClearances(res.data); } catch(e) {}
  }, []);

  useEffect(() => {
    if (tab === 0) loadRequests();
    else if (tab === 1 || tab === 2) loadUsers();
    else if (tab === 3) { loadConvs(); loadCommsStatus(); }
    else if (tab === 5) loadCustomClearances();
  }, [tab]);

  useEffect(() => { if (tab === 0) loadRequests(); }, [reqFilter]);
  useEffect(() => { if (tab === 1) loadUsers(); }, [userSearch]);

  const handleApprove = async (id, overrides) => {
    try { await approveRequest(id, overrides); setApproveModal(null); loadRequests(); }
    catch(e) { alert(e.response?.data?.message || 'Ошибка'); }
  };

  const handleReject = async (id, note) => {
    try { await rejectRequest(id, { note }); loadRequests(); } catch(e) {}
  };

  const handleUpdateUser = async (id, data) => {
    try { await updateUser(id, data); setEditUserModal(null); loadUsers(); } catch(e) {}
  };

  const handleBlockAllComms = async () => {
    try { const res = await blockAllComms(!commsBlocked); setCommsBlocked(res.data.blocked); } catch(e) {}
  };

  const handleBlockConv = async (convId, blocked) => {
    try { await blockConversation(convId, blocked); setConvs(prev => prev.map(c => c._id===convId ? {...c,isBlocked:blocked} : c)); } catch(e) {}
  };

  const handleIssueId = async () => {
    if (!issueSvc || !issueIdNum) return;
    try { await issueServiceId({ userId: issueModal, service: issueSvc, idNumber: issueIdNum }); setIssueModal(null); setIssueSvc(''); setIssueIdNum(''); } catch(e) {}
  };

  const handleSaveCc = async (form) => {
    try {
      if (ccEditor?._id) await updateCustomClearance(ccEditor._id, form);
      else await createCustomClearance(form);
      setCcEditor(null); loadCustomClearances();
    } catch(e) {}
  };

  const handleDeleteCc = async (id) => {
    if (!window.confirm('Удалить УД?')) return;
    try { await deleteCustomClearance(id); loadCustomClearances(); } catch(e) {}
  };

  const handleAssignCc = async (ccId, userId) => {
    try { await assignCustomClearance(ccId, userId); loadCustomClearances(); } catch(e) {}
  };

  const handleUnassignCc = async (ccId, userId) => {
    try { await unassignCustomClearance(ccId, userId); loadCustomClearances(); } catch(e) {}
  };

  const pendingCount = requests.filter(r => r.status === 'pending').length;

  const STATUS_COLORS = { active:'var(--green)', inactive:'#888', kia:'var(--red)', mia:'var(--yellow)', suspended:'var(--orange)', archived:'var(--text-dim)', classified:'var(--purple)', fake:'#ff4444' };

  return (
    <PageWrapper>
      <div className="page">
        <div className="page-title">ПАНЕЛЬ УПРАВЛЕНИЯ</div>

        <div className="tabs" style={{ flexWrap: 'wrap' }}>
          {TABS.map((t, i) => (
            <div key={t} className={`tab ${tab===i?'active':''}`} onClick={() => setTab(i)}>
              {t}
              {i===0 && pendingCount>0 && <span className="nav-badge" style={{marginLeft:6}}>{pendingCount}</span>}
            </div>
          ))}
        </div>

        {/* ── ЗАЯВКИ ── */}
        {tab===0 && (
          <FadeIn>
            <div style={{ display:'flex', gap:8, marginBottom:16, flexWrap:'wrap' }}>
              {['pending','approved','rejected'].map(s => (
                <button key={s} className={`btn btn-sm ${reqFilter===s?'btn-primary':'btn-ghost'}`} onClick={()=>setReqFilter(s)}>{s.toUpperCase()}</button>
              ))}
            </div>
            {requests.length===0 && <div className="loading">НЕТ ЗАЯВОК</div>}
            {requests.map((req, i) => (
              <ListItem key={req._id} index={i}>
                <div className="card" style={{ marginBottom:12 }}>
                  <div style={{ display:'flex', gap:8, marginBottom:10, alignItems:'center', flexWrap:'wrap' }}>
                    <span className={`badge badge-${req.status}`}>{req.status.toUpperCase()}</span>
                    <span style={{ fontFamily:'var(--font-mono)', fontSize:11, color:'var(--text-dim)' }}>{req.type} · {new Date(req.createdAt).toLocaleString('ru')}</span>
                  </div>

                  {req.type==='registration' && req.registrationData && (
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:6, marginBottom:12 }}>
                      {[['ФИО',req.registrationData.fio],['Позывной',req.registrationData.callsign],['Discord',req.registrationData.discordNick],['Фракция',req.registrationData.fraction],['Должность',req.registrationData.position],['УД',`УД-${req.registrationData.clearanceLevel}`]].map(([k,v]) => (
                        <div key={k}><span className="id-card-label">{k}: </span><span style={{color:'var(--text-bright)',fontSize:13}}>{v}</span></div>
                      ))}
                      {req.registrationData.suggestion && <div style={{gridColumn:'1/-1'}}><span className="id-card-label">Предложение: </span><span style={{fontSize:13}}>{req.registrationData.suggestion}</span></div>}
                    </div>
                  )}

                  {req.type==='clearance_upgrade' && (
                    <div style={{marginBottom:12}}>
                      <div><span className="id-card-label">Сотрудник: </span>{req.requester?.fio} ({req.requester?.employeeId})</div>
                      {req.requestedLevel!==undefined && <div><span className="id-card-label">Запрошен УД: </span>УД-{req.requestedLevel}</div>}
                      {req.reason && <div><span className="id-card-label">Причина: </span>{req.reason}</div>}
                    </div>
                  )}

                  {req.type==='twin_account' && (
                    <div style={{marginBottom:12}}>
                      <div><span className="id-card-label">Владелец: </span>{req.requester?.fio}</div>
                      <div><span className="id-card-label">Твинк: </span>{req.twinFio} «{req.twinCallsign}»</div>
                    </div>
                  )}

                  {req.status==='pending' && (
                    <div style={{display:'flex', gap:8, flexWrap:'wrap'}}>
                      {req.type==='registration' && (
                        <button className="btn btn-primary btn-sm" onClick={()=>setApproveModal(req)}>✓ ОДОБРИТЬ С НАСТРОЙКОЙ</button>
                      )}
                      {req.type!=='registration' && (
                        <button className="btn btn-primary btn-sm" onClick={()=>handleApprove(req._id, {})}>✓ ОДОБРИТЬ</button>
                      )}
                      <button className="btn btn-danger btn-sm" onClick={()=>handleReject(req._id, '')}>✕ ОТКЛОНИТЬ</button>
                    </div>
                  )}
                </div>
              </ListItem>
            ))}
          </FadeIn>
        )}

        {/* ── ПОЛЬЗОВАТЕЛИ ── */}
        {tab===1 && (
          <FadeIn>
            <input className="form-input" style={{marginBottom:16}} placeholder="Поиск..." value={userSearch} onChange={e=>setUserSearch(e.target.value)} />
            <div style={{display:'flex', flexDirection:'column', gap:8}}>
              {users.map((u, i) => (
                <ListItem key={u._id} index={i}>
                  <div className="card" style={{borderLeft:`4px solid ${STATUS_COLORS[u.personnelStatus]||'var(--border)'}`}}>
                    <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:8}}>
                      <div>
                        <div style={{display:'flex', alignItems:'center', gap:8, flexWrap:'wrap'}}>
                          <span style={{fontWeight:700}}>{u.fio}</span>
                          <span style={{fontFamily:'var(--font-mono)', fontSize:11, color:'var(--accent)'}}>«{u.callsign}»</span>
                          <span className={`cl-${u.clearanceLevel}`} style={{fontFamily:'var(--font-head)', fontWeight:900, fontSize:18}}>УД-{u.clearanceLevel}</span>
                          {u.clearanceExtensions?.length>0 && u.clearanceExtensions.map(e=><span key={e} className="ext-badge">[{e}]</span>)}
                          <span className={`badge badge-${u.status}`}>{u.status}</span>
                        </div>
                        <div style={{fontSize:12, color:'var(--text-dim)', marginTop:4}}>
                          {u.employeeId && <span style={{fontFamily:'var(--font-mono)', marginRight:8}}>{u.employeeId}</span>}
                          {u.position} · {u.fraction}
                        </div>
                      </div>
                      <div style={{display:'flex', gap:6, flexWrap:'wrap'}}>
                        <button className="btn btn-ghost btn-sm" onClick={()=>setEditUserModal(u)}>✎ РЕДАКТ.</button>
                        <button className="btn btn-ghost btn-sm" onClick={()=>setIssueModal(u._id)}>+ УД службы</button>
                      </div>
                    </div>
                  </div>
                </ListItem>
              ))}
            </div>
          </FadeIn>
        )}

        {/* ── ТВИНКИ ── */}
        {tab===2 && (
          <FadeIn>
            <div className="alert alert-info" style={{marginBottom:16}}>Твинки — дополнительные аккаунты. Одобрение через вкладку Заявки.</div>
            {twins.map((t,i) => (
              <ListItem key={t._id} index={i}>
                <div className="card" style={{marginBottom:8}}>
                  <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                    <div>
                      <span style={{fontWeight:700}}>{t.callsign}</span>
                      <span style={{fontFamily:'var(--font-mono)', fontSize:11, color:'var(--text-dim)', marginLeft:8}}>{t.employeeId}</span>
                      <span className={`cl-${t.clearanceLevel}`} style={{fontFamily:'var(--font-head)', fontWeight:900, fontSize:16, marginLeft:10}}>УД-{t.clearanceLevel}</span>
                      <div style={{fontSize:12, color:'var(--text-dim)', marginTop:4}}>
                        Владелец: {t.parentAccount?.fio} ({t.parentAccount?.employeeId})
                      </div>
                    </div>
                    <div style={{display:'flex', gap:6}}>
                      <button className="btn btn-ghost btn-sm" onClick={()=>setEditUserModal(t)}>✎</button>
                      <button className={`btn btn-sm ${t.status==='approved'?'btn-danger':'btn-primary'}`}
                        onClick={()=>handleUpdateUser(t._id,{status:t.status==='approved'?'banned':'approved'})}>
                        {t.status==='approved'?'БАН':'РАЗБАН'}
                      </button>
                    </div>
                  </div>
                </div>
              </ListItem>
            ))}
          </FadeIn>
        )}

        {/* ── СВЯЗЬ ── */}
        {tab===3 && (
          <FadeIn>
            <div className="card" style={{marginBottom:20}}>
              <div className="card-title">УПРАВЛЕНИЕ СВЯЗЬЮ</div>
              <div style={{display:'flex', alignItems:'center', gap:16, flexWrap:'wrap'}}>
                <div>
                  <div style={{fontWeight:600, marginBottom:4}}>Глобальная блокировка</div>
                  <div style={{fontSize:13, color:'var(--text-dim)'}}>Блокирует всю связь для всех пользователей</div>
                </div>
                <button className={`btn ${commsBlocked?'btn-primary':'btn-danger'}`} onClick={handleBlockAllComms}>
                  {commsBlocked?'✓ ВОССТАНОВИТЬ СВЯЗЬ':'⚠ ЗАБЛОКИРОВАТЬ ВСЮ СВЯЗЬ'}
                </button>
              </div>
              {commsBlocked && <div className="alert alert-error" style={{marginTop:12}}>⚠ ВСЯ СВЯЗЬ ЗАБЛОКИРОВАНА</div>}
            </div>

            <div style={{marginBottom:8, fontFamily:'var(--font-head)', fontSize:12, color:'var(--accent)', letterSpacing:2}}>ЛИЧНЫЕ СООБЩЕНИЯ</div>
            <div className="table-wrap" style={{marginBottom:20}}>
              <table><thead><tr><th>УЧАСТНИКИ</th><th>СТАТУС</th><th>ДЕЙСТВИЯ</th></tr></thead>
                <tbody>
                  {convs.filter(c=>c.type==='dm').map(c=>(
                    <tr key={c._id}>
                      <td>{c.participants?.map(p=>p.callsign||p.username).join(' ↔ ')}</td>
                      <td>{c.isBlocked?<span className="badge badge-blocked">ЗАБЛОК</span>:<span className="badge badge-approved">АКТИВНО</span>}</td>
                      <td><button className={`btn btn-sm ${c.isBlocked?'btn-primary':'btn-danger'}`} onClick={()=>handleBlockConv(c._id,!c.isBlocked)}>{c.isBlocked?'РАЗБЛОК':'БЛОК'}</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{marginBottom:8, fontFamily:'var(--font-head)', fontSize:12, color:'var(--accent)', letterSpacing:2}}>ГРУППЫ</div>
            <div className="table-wrap">
              <table><thead><tr><th>ГРУППА</th><th>УЧАСТНИКИ</th><th>СТАТУС</th><th>ДЕЙСТВИЯ</th></tr></thead>
                <tbody>
                  {convs.filter(c=>c.type==='group').map(c=>(
                    <tr key={c._id}>
                      <td style={{fontWeight:600}}>{c.name}</td>
                      <td style={{fontSize:12}}>{c.participants?.map(p=>p.callsign||p.username).join(', ')}</td>
                      <td>{c.isBlocked?<span className="badge badge-blocked">ЗАБЛОК</span>:<span className="badge badge-approved">АКТИВНО</span>}</td>
                      <td><button className={`btn btn-sm ${c.isBlocked?'btn-primary':'btn-danger'}`} onClick={()=>handleBlockConv(c._id,!c.isBlocked)}>{c.isBlocked?'РАЗБЛОК':'БЛОК'}</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </FadeIn>
        )}

        {/* ── ПЕРСОНАЛ ── */}
        {tab===4 && <FadeIn><PersonnelAdminTab /></FadeIn>}

        {/* ── УД ── */}
        {tab===5 && (
          <FadeIn>
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16}}>
              <div style={{color:'var(--text-dim)', fontSize:13}}>Кастомные УД — создайте свой уровень с расширениями и правами, назначьте сотрудникам. Расширения автоматически добавятся к их УД.</div>
              <button className="btn btn-primary btn-sm" onClick={()=>setCcEditor({})}>+ СОЗДАТЬ УД</button>
            </div>

            {customClearances.length===0 && <div className="loading" style={{height:80}}>НЕТ КАСТОМНЫХ УД</div>}
            {customClearances.map((cc, i) => (
              <ListItem key={cc._id} index={i}>
                <div className="card" style={{marginBottom:12, borderLeft:`4px solid ${cc.color||'var(--accent)'}`}}>
                  <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start', flexWrap:'wrap', gap:8}}>
                    <div>
                      <div style={{display:'flex', alignItems:'center', gap:10}}>
                        <span style={{fontFamily:'var(--font-head)', fontSize:16, color:cc.color}}>{cc.name}</span>
                        <span style={{fontFamily:'var(--font-mono)', fontSize:11, color:'var(--text-dim)', border:'1px solid var(--border)', padding:'2px 6px', borderRadius:3}}>[{cc.code}]</span>
                        <span className={`cl-${cc.baseLevel}`} style={{fontFamily:'var(--font-head)', fontWeight:900, fontSize:16}}>УД-{cc.baseLevel}</span>
                      </div>
                      {cc.description && <div style={{fontSize:13, color:'var(--text-dim)', marginTop:4}}>{cc.description}</div>}
                      {cc.extensions?.length>0 && (
                        <div style={{display:'flex', gap:4, marginTop:6, flexWrap:'wrap'}}>
                          {cc.extensions.map(e=><span key={e} className="ext-badge">[{e}]</span>)}
                        </div>
                      )}
                      <div style={{marginTop:8, display:'flex', gap:6, flexWrap:'wrap'}}>
                        {Object.entries(cc.permissions||{}).filter(([k,v])=>k!=='maxViewableClearance'&&v).map(([k])=>(
                          <span key={k} style={{fontFamily:'var(--font-mono)', fontSize:10, color:'var(--green)', background:'rgba(46,204,113,0.1)', border:'1px solid var(--green)', padding:'1px 6px', borderRadius:3}}>
                            {k.replace('can','').replace(/([A-Z])/g,' $1').trim()}
                          </span>
                        ))}
                        <span style={{fontFamily:'var(--font-mono)', fontSize:10, color:'var(--accent)', background:'rgba(0,180,216,0.1)', border:'1px solid var(--accent)', padding:'1px 6px', borderRadius:3}}>
                          Видит до УД-{cc.permissions?.maxViewableClearance}
                        </span>
                      </div>
                    </div>
                    <div style={{display:'flex', gap:6}}>
                      <button className="btn btn-ghost btn-sm" onClick={()=>setCcEditor(cc)}>✎</button>
                      <button className="btn btn-ghost btn-sm" onClick={()=>{ setCcAssignUser({ cc, search: '' }); loadUsers(); }}>👤 Назначить</button>
                      <button className="btn btn-danger btn-sm" onClick={()=>handleDeleteCc(cc._id)}>✕</button>
                    </div>
                  </div>

                  {/* Assigned users */}
                  {cc.assignedTo?.length>0 && (
                    <div style={{marginTop:12, borderTop:'1px solid var(--border)', paddingTop:10}}>
                      <div style={{fontFamily:'var(--font-mono)', fontSize:10, color:'var(--text-dim)', marginBottom:6}}>НАЗНАЧЕН:</div>
                      <div style={{display:'flex', flexWrap:'wrap', gap:6}}>
                        {cc.assignedTo.map(u=>(
                          <div key={u._id||u} style={{display:'flex', alignItems:'center', gap:4, background:'var(--bg3)', border:'1px solid var(--border)', borderRadius:4, padding:'3px 8px'}}>
                            <span style={{fontSize:12}}>{u.callsign||u.username||u}</span>
                            <button onClick={()=>handleUnassignCc(cc._id, u._id||u)} style={{background:'none', border:'none', color:'var(--red)', cursor:'pointer', fontSize:12, padding:0}}>✕</button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </ListItem>
            ))}
          </FadeIn>
        )}

        {/* ── MODALS ── */}
        {approveModal && <ApproveModal req={approveModal} onApprove={handleApprove} onClose={()=>setApproveModal(null)} />}

        {editUserModal && (
          <UserEditModal user={editUserModal} onSave={handleUpdateUser} onClose={()=>setEditUserModal(null)} />
        )}

        {ccEditor !== null && (
          <CustomClearanceEditor cc={ccEditor?._id ? ccEditor : null} onSave={handleSaveCc} onClose={()=>setCcEditor(null)} />
        )}

        {/* Assign CC to user modal */}
        {ccAssignUser && (
          <div className="modal-overlay" onClick={()=>setCcAssignUser(null)}>
            <ModalMotion>
              <div className="modal" onClick={e=>e.stopPropagation()}>
                <div className="modal-title">НАЗНАЧИТЬ УД: {ccAssignUser.cc.name}</div>
                <input className="form-input" style={{marginBottom:12}} placeholder="Поиск сотрудника..." value={ccUserSearch} onChange={e=>setCcUserSearch(e.target.value)} />
                <div style={{maxHeight:300, overflowY:'auto'}}>
                  {users.filter(u=>!ccUserSearch || u.fio?.toLowerCase().includes(ccUserSearch.toLowerCase()) || u.callsign?.toLowerCase().includes(ccUserSearch.toLowerCase())).map(u=>{
                    const assigned = ccAssignUser.cc.assignedTo?.some(a=>(a._id||a)===u._id);
                    return (
                      <div key={u._id} style={{display:'flex', alignItems:'center', justifyContent:'space-between', padding:'8px 0', borderBottom:'1px solid var(--border)'}}>
                        <div>
                          <span style={{fontWeight:600}}>{u.callsign}</span>
                          <span style={{fontFamily:'var(--font-mono)', fontSize:11, color:'var(--text-dim)', marginLeft:8}}>{u.fio}</span>
                          <span className={`cl-${u.clearanceLevel}`} style={{fontFamily:'var(--font-head)', fontWeight:900, marginLeft:8}}>УД-{u.clearanceLevel}</span>
                        </div>
                        {assigned ? (
                          <button className="btn btn-danger btn-sm" onClick={()=>handleUnassignCc(ccAssignUser.cc._id, u._id)}>СНЯТЬ</button>
                        ) : (
                          <button className="btn btn-primary btn-sm" onClick={()=>handleAssignCc(ccAssignUser.cc._id, u._id)}>НАЗНАЧИТЬ</button>
                        )}
                      </div>
                    );
                  })}
                </div>
                <button className="btn btn-ghost" style={{marginTop:12, width:'100%'}} onClick={()=>setCcAssignUser(null)}>ЗАКРЫТЬ</button>
              </div>
            </ModalMotion>
          </div>
        )}

        {/* Issue Service ID */}
        {issueModal && (
          <div className="modal-overlay" onClick={()=>setIssueModal(null)}>
            <ModalMotion>
              <div className="modal" onClick={e=>e.stopPropagation()}>
                <div className="modal-title">ВЫДАТЬ УД СЛУЖБЫ</div>
                <div className="form-group"><label className="form-label">Служба</label><input className="form-input" value={issueSvc} onChange={e=>setIssueSvc(e.target.value)} placeholder="АПАИБ" /></div>
                <div className="form-group"><label className="form-label">Номер УД</label><input className="form-input" value={issueIdNum} onChange={e=>setIssueIdNum(e.target.value)} placeholder="APAIB-0001" /></div>
                <div style={{display:'flex', gap:8}}>
                  <button className="btn btn-ghost" onClick={()=>setIssueModal(null)} style={{flex:1}}>ОТМЕНА</button>
                  <button className="btn btn-primary" onClick={handleIssueId} style={{flex:2}}>ВЫДАТЬ</button>
                </div>
              </div>
            </ModalMotion>
          </div>
        )}
      </div>
    </PageWrapper>
  );
}
