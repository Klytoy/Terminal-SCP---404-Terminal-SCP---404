import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { CLEARANCE_LEVELS, EXTENSIONS } from '../utils/clearance';
import axios from 'axios';

const API = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
const h = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });

const TABS = ['ЗАЯВКИ', 'ПОЛЬЗОВАТЕЛИ', 'БАЛАНС', 'СВЯЗЬ', 'КЛЮЧИ'];
const FRACTIONS_LIST = [
  'SCP Foundation','Omega-1','MTF Alpha-1','MTF Epsilon-11','AMTF Nu-7',
  'Комитет по Этике','АпАИБ','Служба Оперативников','МТФ','Административный Департамент',
  'RAISA','Медицинский Департамент','Исследовательский Департамент','Служба Безопасности',
  'Отдел по аномалиям','НРП','Другое'
];
const PERSONNEL_STATUSES = [
  { value: 'active', label: 'Активен' }, { value: 'inactive', label: 'Неактивен' },
  { value: 'kia', label: 'Погиб' }, { value: 'mia', label: 'Пропал б/в' },
  { value: 'suspended', label: 'Отстранён' }, { value: 'archived', label: 'Архивирован' },
  { value: 'classified', label: 'Засекречен' }, { value: 'fake', label: 'Подделка' }
];

function UserEditor({ u, onSave, onDelete, onAddNote, onDeleteNote }) {
  const [data, setData] = useState({ ...u });
  const [noteForm, setNoteForm] = useState({ type: 'note', text: '' });
  const [tab, setTab] = useState('main');
  const set = (k, v) => setData(p => ({ ...p, [k]: v }));

  return (
    <div style={{ padding: 16 }}>
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        {['main', 'clearance', 'fake_id', 'notes', 'balance'].map(t => (
          <button key={t} className={`btn btn-sm ${tab === t ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setTab(t)}>
            {t === 'main' ? 'ОСНОВНОЕ' : t === 'clearance' ? 'УД' : t === 'fake_id' ? 'ФЕЙК УД' : t === 'notes' ? 'ЛИЧНОЕ ДЕЛО' : 'БАЛАНС'}
          </button>
        ))}
      </div>

      {tab === 'main' && (
        <div className="grid-2" style={{ gap: 12 }}>
          {[['fio','ФИО'],['callsign','Позывной'],['discordNick','Discord'],['position','Должность'],['employeeId','Таб. номер'],['photo','Фото URL']].map(([k,l]) => (
            <div key={k} className="form-group">
              <label className="form-label">{l}</label>
              <input className="form-input" value={data[k] || ''} onChange={e => set(k, e.target.value)} />
            </div>
          ))}
          <div className="form-group">
            <label className="form-label">Фракция</label>
            <select className="form-select" value={data.fraction} onChange={e => set('fraction', e.target.value)}>
              {FRACTIONS_LIST.map(f => <option key={f}>{f}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Тип фракции</label>
            <select className="form-select" value={data.fractionType} onChange={e => set('fractionType', e.target.value)}>
              <option value="civilian">Гражданская</option>
              <option value="combat">Боевая</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Статус аккаунта</label>
            <select className="form-select" value={data.status} onChange={e => set('status', e.target.value)}>
              <option value="approved">Одобрен</option>
              <option value="banned">Заблокирован</option>
              <option value="pending">Ожидание</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Статус персонала</label>
            <select className="form-select" value={data.personnelStatus} onChange={e => set('personnelStatus', e.target.value)}>
              {PERSONNEL_STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Роль</label>
            <select className="form-select" value={data.role} onChange={e => set('role', e.target.value)}>
              <option value="user">Пользователь</option>
              <option value="admin">Админ</option>
              <option value="superadmin">Суперадмин</option>
            </select>
          </div>
          <div className="form-group" style={{ gridColumn: '1/-1' }}>
            <label className="form-label">Биография</label>
            <textarea className="form-input" rows={4} value={data.biography || ''} onChange={e => set('biography', e.target.value)} style={{ resize: 'vertical' }} />
          </div>
          <div className="form-group">
            <label className="form-label">Новый пароль (оставьте пустым если не менять)</label>
            <input className="form-input" type="password" onChange={e => set('password', e.target.value)} />
          </div>
        </div>
      )}

      {tab === 'clearance' && (
        <div>
          <div className="form-group" style={{ marginBottom: 16 }}>
            <label className="form-label">Уровень допуска (УД)</label>
            <select className="form-select" value={data.clearanceLevel} onChange={e => set('clearanceLevel', parseInt(e.target.value))}>
              {[0,1,2,3,4,5,6].map(l => <option key={l} value={l}>УД-{l} — {CLEARANCE_LEVELS[l]?.name}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label" style={{ marginBottom: 10 }}>Расширения УД</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {['A','M','SI','I','T','O','H','P','ET','S','R4','T4','O5','КпЭ','АпАИБ','СО','МТФ','НРП','ФФ'].map(ext => {
                const active = (data.clearanceExtensions || []).includes(ext);
                return (
                  <button key={ext} className={`btn btn-sm ${active ? 'btn-primary' : 'btn-ghost'}`}
                    onClick={() => set('clearanceExtensions', active
                      ? data.clearanceExtensions.filter(e => e !== ext)
                      : [...(data.clearanceExtensions || []), ext]
                    )}>
                    [{ext}]
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {tab === 'fake_id' && (
        <div>
          <div style={{ marginBottom: 12, padding: '10px 14px', background: 'rgba(231,76,60,0.08)', border: '1px solid rgba(231,76,60,0.3)', borderRadius: 6, fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--red)' }}>
            ⚠ Фейковое УД — при проверке через список персонала другие пользователи увидят подменные данные. Только суперадмин/админ видит реальные.
          </div>
          <div className="form-group">
            <label className="form-label">Включить фейковое УД</label>
            <select className="form-select" value={data.fakeIdentity?.enabled ? 'true' : 'false'}
              onChange={e => set('fakeIdentity', { ...(data.fakeIdentity || {}), enabled: e.target.value === 'true' })}>
              <option value="false">Выключено</option>
              <option value="true">Включено</option>
            </select>
          </div>
          {data.fakeIdentity?.enabled && (
            <div className="grid-2" style={{ gap: 12, marginTop: 12 }}>
              {[['fakeFraction','Фейк фракция'],['fakePosition','Фейк должность'],['fakeFio','Фейк ФИО'],['fakeCallsign','Фейк позывной'],['fakeEmployeeId','Фейк таб. номер']].map(([k,l]) => (
                <div key={k} className="form-group">
                  <label className="form-label">{l}</label>
                  <input className="form-input" value={data.fakeIdentity?.[k] || ''} onChange={e => set('fakeIdentity', { ...(data.fakeIdentity || {}), [k]: e.target.value })} />
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'notes' && (
        <div>
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-dim)', marginBottom: 10 }}>ДОБАВИТЬ ЗАПИСЬ</div>
            <div className="grid-2" style={{ gap: 8 }}>
              <select className="form-select" value={noteForm.type} onChange={e => setNoteForm(p => ({ ...p, type: e.target.value }))}>
                <option value="note">Заметка</option>
                <option value="violation">Нарушение</option>
                <option value="warning">Предупреждение</option>
                <option value="commendation">Поощрение</option>
              </select>
              <button className="btn btn-primary btn-sm" onClick={() => { onAddNote(u._id, noteForm); setNoteForm({ type: 'note', text: '' }); }}>+ ДОБАВИТЬ</button>
            </div>
            <textarea className="form-input" rows={2} placeholder="Текст записи..." value={noteForm.text} onChange={e => setNoteForm(p => ({ ...p, text: e.target.value }))} style={{ marginTop: 8, resize: 'vertical' }} />
          </div>

          {(u.personnelNotes || []).length === 0 ? (
            <div style={{ color: 'var(--text-dim)', fontFamily: 'var(--font-mono)', fontSize: 12 }}>Записей нет</div>
          ) : (
            (u.personnelNotes || []).map((note, i) => {
              const colors = { violation: 'var(--red)', warning: 'var(--orange)', commendation: 'var(--green)', note: 'var(--accent)' };
              const labels = { violation: 'НАРУШЕНИЕ', warning: 'ПРЕДУПРЕЖДЕНИЕ', commendation: 'ПООЩРЕНИЕ', note: 'ЗАМЕТКА' };
              return (
                <div key={i} style={{ padding: '10px 12px', border: `1px solid ${colors[note.type]}33`, borderRadius: 6, marginBottom: 8, background: `${colors[note.type]}08` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: colors[note.type] }}>{labels[note.type]}</span>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-dim)' }}>{note.authorName} · {new Date(note.createdAt).toLocaleDateString('ru')}</span>
                      <button className="btn btn-ghost btn-sm" style={{ padding: '2px 6px', fontSize: 10 }} onClick={() => onDeleteNote(u._id, note._id)}>✕</button>
                    </div>
                  </div>
                  <div style={{ fontSize: 13 }}>{note.text}</div>
                </div>
              );
            })
          )}
        </div>
      )}

      {tab === 'balance' && (
        <div>
          <div style={{ fontFamily: 'var(--font-head)', fontSize: 24, color: 'var(--yellow)', marginBottom: 16 }}>₽{u.balance || 0}</div>
          <BalanceEditor userId={u._id} current={u.balance || 0} onDone={onSave} />
        </div>
      )}

      {tab !== 'notes' && tab !== 'balance' && (
        <div style={{ display: 'flex', gap: 8, marginTop: 20 }}>
          <button className="btn btn-primary btn-sm" onClick={() => onSave(u._id, data)}>СОХРАНИТЬ</button>
          <button className="btn btn-danger btn-sm" onClick={() => { if (window.confirm('Удалить пользователя?')) onDelete(u._id); }}>УДАЛИТЬ</button>
        </div>
      )}
    </div>
  );
}

function BalanceEditor({ userId, current, onDone }) {
  const [amount, setAmount] = useState('');
  const [op, setOp] = useState('add');
  const [msg, setMsg] = useState('');

  const apply = async () => {
    try {
      const r = await axios.patch(`${API}/users/${userId}/balance`, { amount: Number(amount), operation: op }, h());
      setMsg(`Готово! Новый баланс: ₽${r.data.balance}`);
      onDone();
    } catch (e) { setMsg('Ошибка'); }
  };

  return (
    <div>
      <div className="grid-2" style={{ gap: 8, marginBottom: 10 }}>
        <select className="form-select" value={op} onChange={e => setOp(e.target.value)}>
          <option value="add">Начислить</option>
          <option value="subtract">Снять</option>
          <option value="set">Установить</option>
        </select>
        <input className="form-input" type="number" placeholder="Сумма" value={amount} onChange={e => setAmount(e.target.value)} />
      </div>
      <button className="btn btn-primary btn-sm" onClick={apply}>ПРИМЕНИТЬ</button>
      {msg && <div style={{ marginTop: 8, fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--green)' }}>{msg}</div>}
    </div>
  );
}

export default function AdminPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState(0);
  const [requests, setRequests] = useState([]);
  const [users, setUsers] = useState([]);
  const [keys, setKeys] = useState([]);
  const [search, setSearch] = useState('');
  const [expandedUser, setExpandedUser] = useState(null);
  const [commsStatus, setCommsStatus] = useState(false);
  const [msg, setMsg] = useState('');
  const [newKey, setNewKey] = useState({ keyCode: '', name: '', ownerFraction: '', accessLevel: 1 });

  const loadRequests = useCallback(async () => {
    try { const r = await axios.get(`${API}/requests?status=pending`, h()); setRequests(r.data); } catch (e) {}
  }, []);

  const loadUsers = useCallback(async () => {
    try { const r = await axios.get(`${API}/users`, h()); setUsers(r.data); } catch (e) {}
  }, []);

  const loadKeys = useCallback(async () => {
    try { const r = await axios.get(`${API}/terminal/keys/all`, h()); setKeys(r.data); } catch (e) {}
  }, []);

  useEffect(() => {
    loadRequests(); loadUsers();
    if (['superadmin','admin'].includes(user?.role)) loadKeys();
  }, [loadRequests, loadUsers, loadKeys]);

  const approve = async (id, note, empId) => {
    try { await axios.patch(`${API}/requests/${id}/approve`, { note, employeeId: empId }, h()); setMsg('Одобрено'); loadRequests(); loadUsers(); } catch (e) { setMsg(e.response?.data?.message || 'Ошибка'); }
  };
  const reject = async (id, note) => {
    try { await axios.patch(`${API}/requests/${id}/reject`, { note }, h()); setMsg('Отклонено'); loadRequests(); } catch (e) { setMsg('Ошибка'); }
  };
  const saveUser = async (id, data) => {
    try { await axios.put(`${API}/users/${id}`, data, h()); setMsg('Сохранено'); loadUsers(); setExpandedUser(null); } catch (e) { setMsg('Ошибка сохранения'); }
  };
  const deleteUser = async (id) => {
    try { await axios.delete(`${API}/users/${id}`, h()); loadUsers(); setExpandedUser(null); } catch (e) { setMsg('Ошибка'); }
  };
  const addNote = async (id, note) => {
    try { await axios.post(`${API}/users/${id}/notes`, note, h()); loadUsers(); } catch (e) { setMsg('Ошибка'); }
  };
  const deleteNote = async (uid, nid) => {
    try { await axios.delete(`${API}/users/${uid}/notes/${nid}`, h()); loadUsers(); } catch (e) { setMsg('Ошибка'); }
  };
  const createKey = async () => {
    try { await axios.post(`${API}/terminal/keys`, newKey, h()); setMsg('Ключ создан'); loadKeys(); setNewKey({ keyCode: '', name: '', ownerFraction: '', accessLevel: 1 }); } catch (e) { setMsg(e.response?.data?.message || 'Ошибка'); }
  };

  const filtered = users.filter(u => search === '' || u.callsign?.toLowerCase().includes(search.toLowerCase()) || u.fio?.toLowerCase().includes(search.toLowerCase()) || u.fraction?.toLowerCase().includes(search.toLowerCase()));
  const pendingCount = requests.filter(r => r.status === 'pending').length;

  const statusColors = { active: 'var(--green)', inactive: 'var(--text-dim)', kia: 'var(--red)', mia: 'var(--orange)', suspended: 'var(--yellow)', archived: 'var(--text-dim)', classified: 'var(--purple)', fake: 'var(--red)' };

  return (
    <div className="page">
      <div className="page-title">⚙ ПАНЕЛЬ УПРАВЛЕНИЯ</div>
      {msg && <div className="alert alert-error" style={{ marginBottom: 16 }} onClick={() => setMsg('')}>{msg} ✕</div>}

      <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
        {TABS.map((t, i) => (
          <button key={t} className={`btn btn-sm ${tab === i ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setTab(i)}>
            {t}{i === 0 && pendingCount > 0 ? ` (${pendingCount})` : ''}
          </button>
        ))}
      </div>

      {/* ЗАЯВКИ */}
      {tab === 0 && (
        <div>
          {requests.filter(r => r.status === 'pending').length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: 40, color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>ЗАЯВКИ ОТСУТСТВУЮТ</div>
          ) : requests.filter(r => r.status === 'pending').map(req => {
            const d = req.registrationData || {};
            return (
              <div key={req._id} className="card" style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', gap: 8, marginBottom: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                  <span className="badge badge-pending">ОЖИДАЕТ</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-dim)' }}>{req.type} · {new Date(req.createdAt).toLocaleString('ru')}</span>
                </div>
                {req.type === 'registration' && d && (
                  <div className="grid-2" style={{ gap: 8, marginBottom: 12 }}>
                    {[['Логин', d.username],['ФИО', d.fio],['Позывной', d.callsign],['Discord', d.discordNick],['Фракция', `${d.fraction} (${d.fractionType === 'combat' ? 'боевая' : 'гражданская'})`],['Должность', d.position],['УД', `УД-${d.clearanceLevel}`]].map(([k,v]) => (
                      <div key={k}><span className="id-card-label">{k}: </span><span style={{ color: 'var(--text-bright)', fontSize: 13 }}>{v}</span></div>
                    ))}
                  </div>
                )}
                <RequestActions req={req} onApprove={approve} onReject={reject} />
              </div>
            );
          })}
        </div>
      )}

      {/* ПОЛЬЗОВАТЕЛИ */}
      {tab === 1 && (
        <div>
          <input className="form-input" placeholder="Поиск по позывному, ФИО, фракции..." value={search} onChange={e => setSearch(e.target.value)} style={{ marginBottom: 16 }} />
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-dim)', marginBottom: 12 }}>Всего: {filtered.length}</div>
          {filtered.map(u => (
            <div key={u._id} className="card" style={{ marginBottom: 8, cursor: 'pointer' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }} onClick={() => setExpandedUser(expandedUser === u._id ? null : u._id)}>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  <span className={`cl-${u.clearanceLevel}`} style={{ fontFamily: 'var(--font-head)', fontWeight: 900, fontSize: 20, minWidth: 28 }}>{u.clearanceLevel}</span>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 15 }}>{u.callsign}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-dim)' }}>{u.fio} · {u.fraction}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  {u.personnelNotes?.length > 0 && <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--red)' }}>⚠ {u.personnelNotes.length}</span>}
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: statusColors[u.personnelStatus] }}>● {u.personnelStatus}</span>
                  <span className={`badge badge-${u.status}`}>{u.status}</span>
                  <span style={{ color: 'var(--text-dim)' }}>{expandedUser === u._id ? '▲' : '▼'}</span>
                </div>
              </div>
              {expandedUser === u._id && (
                <div style={{ marginTop: 16, borderTop: '1px solid var(--border)', paddingTop: 16 }}>
                  <UserEditor u={users.find(x => x._id === u._id)} onSave={saveUser} onDelete={deleteUser} onAddNote={addNote} onDeleteNote={deleteNote} />
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* БАЛАНС */}
      {tab === 2 && (
        <div>
          <div className="card" style={{ marginBottom: 16 }}>
            <div className="card-title">НАЧИСЛЕНИЕ ВАЛЮТЫ</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-dim)', marginBottom: 16 }}>Выберите пользователя ниже для управления балансом</div>
          </div>
          {users.map(u => (
            <div key={u._id} className="card" style={{ marginBottom: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <span style={{ fontWeight: 600 }}>{u.callsign}</span>
                  <span style={{ fontSize: 12, color: 'var(--text-dim)', marginLeft: 8 }}>{u.fraction}</span>
                </div>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--yellow)' }}>₽{u.balance || 0}</span>
                  <button className="btn btn-ghost btn-sm" onClick={() => setExpandedUser(expandedUser === u._id ? null : u._id)}>
                    {expandedUser === u._id ? 'ЗАКРЫТЬ' : 'ИЗМЕНИТЬ'}
                  </button>
                </div>
              </div>
              {expandedUser === u._id && (
                <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--border)' }}>
                  <BalanceEditor userId={u._id} current={u.balance || 0} onDone={loadUsers} />
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* СВЯЗЬ */}
      {tab === 3 && (
        <div className="card">
          <div className="card-title">УПРАВЛЕНИЕ СВЯЗЬЮ</div>
          <div style={{ color: 'var(--text-dim)', fontFamily: 'var(--font-mono)', fontSize: 12 }}>Функции блокировки связи доступны в разделе СВЯЗЬ</div>
        </div>
      )}

      {/* КЛЮЧИ */}
      {tab === 4 && user?.role === 'superadmin' && (
        <div>
          <div className="card" style={{ marginBottom: 16 }}>
            <div className="card-title">СОЗДАТЬ КЛЮЧ ДОСТУПА</div>
            <div className="grid-2" style={{ gap: 10 }}>
              {[['keyCode','Код ключа (напр. KEY-001)'],['name','Название'],['ownerFraction','Фракция-владелец']].map(([k,l]) => (
                <div key={k} className="form-group">
                  <label className="form-label">{l}</label>
                  <input className="form-input" value={newKey[k]} onChange={e => setNewKey(p => ({ ...p, [k]: e.target.value }))} />
                </div>
              ))}
              <div className="form-group">
                <label className="form-label">Уровень доступа</label>
                <select className="form-select" value={newKey.accessLevel} onChange={e => setNewKey(p => ({ ...p, accessLevel: parseInt(e.target.value) }))}>
                  {[1,2,3,4,5,6].map(l => <option key={l} value={l}>УД-{l}</option>)}
                </select>
              </div>
            </div>
            <button className="btn btn-primary btn-sm" style={{ marginTop: 12 }} onClick={createKey}>СОЗДАТЬ КЛЮЧ</button>
          </div>

          <div className="card-title" style={{ marginBottom: 12 }}>ВСЕ КЛЮЧИ</div>
          {keys.map(k => (
            <div key={k._id} className="card" style={{ marginBottom: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent)' }}>[{k.keyCode}]</span>
                  <span style={{ marginLeft: 10, fontWeight: 600 }}>{k.name}</span>
                  <span style={{ marginLeft: 10, fontSize: 12, color: 'var(--text-dim)' }}>{k.ownerFraction}</span>
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  {k.isCompromised && <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--red)' }}>⚠ СКОМПРОМЕТИРОВАН</span>}
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-dim)' }}>УД-{k.accessLevel} · {k.holders?.length || 0} носителей</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function RequestActions({ req, onApprove, onReject }) {
  const [note, setNote] = useState('');
  const [empId, setEmpId] = useState('');
  return (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'flex-end' }}>
      <div style={{ flex: '0 0 150px' }}>
        <label className="form-label" style={{ fontSize: 10 }}>Таб. номер (опц.)</label>
        <input className="form-input" style={{ padding: '6px 8px', fontSize: 12 }} value={empId} onChange={e => setEmpId(e.target.value)} placeholder="SCP-0001" />
      </div>
      <div style={{ flex: 1 }}>
        <label className="form-label" style={{ fontSize: 10 }}>Комментарий</label>
        <input className="form-input" style={{ padding: '6px 8px', fontSize: 12 }} value={note} onChange={e => setNote(e.target.value)} placeholder="Заметка..." />
      </div>
      <button className="btn btn-primary btn-sm" onClick={() => onApprove(req._id, note, empId)}>ОДОБРИТЬ</button>
      <button className="btn btn-danger btn-sm" onClick={() => onReject(req._id, note)}>ОТКЛОНИТЬ</button>
    </div>
  );
}
