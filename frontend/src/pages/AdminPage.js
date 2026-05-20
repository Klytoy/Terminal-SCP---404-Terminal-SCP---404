import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  getAdminRequests, approveRequest, rejectRequest,
  getAdminUsers, updateUser, blockAllComms, getCommsStatus,
  issueServiceId, getConversations, blockConversation
} from '../utils/api';
import { CLEARANCE_LEVELS, EXTENSIONS } from '../utils/clearance';

const TABS = ['ЗАЯВКИ', 'ПОЛЬЗОВАТЕЛИ', 'ТВИНКИ', 'СВЯЗЬ'];

function RequestCard({ req, onApprove, onReject }) {
  const [note, setNote] = useState('');
  const [empId, setEmpId] = useState('');

  const data = req.registrationData || {};

  return (
    <div className="card" style={{ marginBottom: 12 }}>
      <div style={{ display: 'flex', gap: 8, marginBottom: 12, alignItems: 'center' }}>
        <span className={`badge badge-${req.status}`}>{req.status.toUpperCase()}</span>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-dim)' }}>
          {req.type} · {new Date(req.createdAt).toLocaleString('ru')}
        </span>
      </div>

      {req.type === 'registration' && data && (
        <div className="grid-2" style={{ gap: 8, marginBottom: 12 }}>
          {[
            ['Логин', data.username],
            ['ФИО', data.fio],
            ['Позывной', data.callsign],
            ['Discord', data.discordNick],
            ['Фракция', `${data.fraction} (${data.fractionType === 'combat' ? 'боевая' : 'гражданская'})`],
            ['Должность', data.position],
            ['УД', `УД-${data.clearanceLevel}`],
          ].map(([k, v]) => (
            <div key={k}>
              <span className="id-card-label">{k}: </span>
              <span style={{ color: 'var(--text-bright)', fontSize: 13 }}>{v}</span>
            </div>
          ))}
          {data.suggestion && (
            <div style={{ gridColumn: '1/-1' }}>
              <span className="id-card-label">Предложения: </span>
              <span style={{ fontSize: 13 }}>{data.suggestion}</span>
            </div>
          )}
        </div>
      )}

      {req.type === 'clearance_upgrade' && (
        <div style={{ marginBottom: 12 }}>
          <div><span className="id-card-label">Сотрудник: </span>{req.requester?.fio} ({req.requester?.employeeId})</div>
          {req.requestedLevel !== undefined && <div><span className="id-card-label">Запрошен УД: </span>УД-{req.requestedLevel}</div>}
          {req.requestedExtensions?.length > 0 && <div><span className="id-card-label">Расширения: </span>{req.requestedExtensions.join(', ')}</div>}
          {req.reason && <div><span className="id-card-label">Причина: </span>{req.reason}</div>}
        </div>
      )}

      {req.type === 'twin_account' && (
        <div style={{ marginBottom: 12 }}>
          <div><span className="id-card-label">Владелец: </span>{req.requester?.fio} ({req.requester?.employeeId})</div>
          <div><span className="id-card-label">Логин твинка: </span>{req.twinUsername}</div>
          <div><span className="id-card-label">ФИО твинка: </span>{req.twinFio}</div>
          <div><span className="id-card-label">Позывной: </span>{req.twinCallsign}</div>
          <div><span className="id-card-label">Discord: </span>{req.twinDiscordNick}</div>
        </div>
      )}

      {req.type === 'document_access' && (
        <div style={{ marginBottom: 12 }}>
          <div><span className="id-card-label">Сотрудник: </span>{req.requester?.fio}</div>
          <div><span className="id-card-label">Документ: </span>{req.documentId?.title}</div>
          {req.reason && <div><span className="id-card-label">Причина: </span>{req.reason}</div>}
        </div>
      )}

      {req.status === 'pending' && (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div style={{ flex: '0 0 160px' }}>
            <label className="form-label" style={{ fontSize: 10 }}>ID сотрудника (опц.)</label>
            <input className="form-input" style={{ padding: '6px 8px', fontSize: 12 }} value={empId} onChange={e => setEmpId(e.target.value)} placeholder="SCP-0001" />
          </div>
          <div style={{ flex: 1 }}>
            <label className="form-label" style={{ fontSize: 10 }}>Комментарий</label>
            <input className="form-input" style={{ padding: '6px 8px', fontSize: 12 }} value={note} onChange={e => setNote(e.target.value)} placeholder="Заметка (опц.)" />
          </div>
          <button className="btn btn-primary btn-sm" onClick={() => onApprove(req._id, note, empId)}>ОДОБРИТЬ</button>
          <button className="btn btn-danger btn-sm" onClick={() => onReject(req._id, note)}>ОТКЛОНИТЬ</button>
        </div>
      )}
    </div>
  );
}

function UserRow({ u, onUpdate, onIssueId }) {
  const [editing, setEditing] = useState(false);
  const [cl, setCl] = useState(u.clearanceLevel);
  const [status, setStatus] = useState(u.status);
  const [empId, setEmpId] = useState(u.employeeId || '');

  const save = async () => {
    await onUpdate(u._id, { clearanceLevel: parseInt(cl), status, employeeId: empId });
    setEditing(false);
  };

  return (
    <tr>
      <td>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-dim)' }}>{u.employeeId || '—'}</div>
        <div style={{ fontWeight: 600 }}>{u.callsign}</div>
        <div style={{ fontSize: 12, color: 'var(--text-dim)' }}>{u.fio}</div>
      </td>
      <td style={{ fontSize: 13 }}>{u.fraction}</td>
      <td>
        <span className={`cl-${u.clearanceLevel}`} style={{ fontFamily: 'var(--font-head)', fontWeight: 900, fontSize: 18 }}>
          {u.clearanceLevel}
        </span>
      </td>
      <td><span className={`badge badge-${u.status}`}>{u.status}</span></td>
      <td>
        {editing ? (
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            <select className="form-select" style={{ width: 60, padding: '4px 6px', fontSize: 12 }} value={cl} onChange={e => setCl(e.target.value)}>
              {[0,1,2,3,4,5,6].map(l => <option key={l} value={l}>{l}</option>)}
            </select>
            <select className="form-select" style={{ width: 100, padding: '4px 6px', fontSize: 12 }} value={status} onChange={e => setStatus(e.target.value)}>
              <option value="approved">approved</option>
              <option value="banned">banned</option>
            </select>
            <input className="form-input" style={{ width: 100, padding: '4px 6px', fontSize: 12 }} value={empId} onChange={e => setEmpId(e.target.value)} placeholder="ID" />
            <button className="btn btn-primary btn-sm" onClick={save}>✓</button>
            <button className="btn btn-ghost btn-sm" onClick={() => setEditing(false)}>✕</button>
          </div>
        ) : (
          <div style={{ display: 'flex', gap: 6 }}>
            <button className="btn btn-ghost btn-sm" onClick={() => setEditing(true)}>✎</button>
            <button className="btn btn-ghost btn-sm" onClick={() => onIssueId(u._id)}>+ УД службы</button>
          </div>
        )}
      </td>
    </tr>
  );
}

export default function AdminPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState(0);
  const [requests, setRequests] = useState([]);
  const [users, setUsers] = useState([]);
  const [twins, setTwins] = useState([]);
  const [convs, setConvs] = useState([]);
  const [commsBlocked, setCommsBlocked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [reqFilter, setReqFilter] = useState('pending');

  const [issueModal, setIssueModal] = useState(null);
  const [issueSvc, setIssueSvc] = useState('');
  const [issueIdNum, setIssueIdNum] = useState('');

  const loadRequests = useCallback(async () => {
    const res = await getAdminRequests({ status: reqFilter });
    setRequests(res.data);
  }, [reqFilter]);

  const loadUsers = useCallback(async () => {
    const [ur, tr] = await Promise.all([
      getAdminUsers({ isTwin: 'false' }),
      getAdminUsers({ isTwin: 'true' })
    ]);
    setUsers(ur.data);
    setTwins(tr.data);
  }, []);

  const loadConvs = useCallback(async () => {
    // Admin can see all conversations - for now get all
    try {
      const res = await getConversations();
      setConvs(res.data);
    } catch (e) {}
  }, []);

  const loadCommsStatus = useCallback(async () => {
    const res = await getCommsStatus();
    setCommsBlocked(res.data.blocked);
  }, []);

  useEffect(() => {
    if (tab === 0) loadRequests();
    else if (tab === 1 || tab === 2) loadUsers();
    else if (tab === 3) { loadConvs(); loadCommsStatus(); }
  }, [tab, loadRequests, loadUsers, loadConvs, loadCommsStatus]);

  useEffect(() => { loadRequests(); }, [reqFilter, loadRequests]);

  const handleApprove = async (id, note, empId) => {
    try { await approveRequest(id, { note, employeeId: empId }); loadRequests(); }
    catch (e) { alert(e.response?.data?.message || 'Ошибка'); }
  };

  const handleReject = async (id, note) => {
    try { await rejectRequest(id, { note }); loadRequests(); }
    catch (e) {}
  };

  const handleUpdateUser = async (id, data) => {
    try { await updateUser(id, data); loadUsers(); }
    catch (e) {}
  };

  const handleBlockAllComms = async () => {
    try {
      const res = await blockAllComms(!commsBlocked);
      setCommsBlocked(res.data.blocked);
    } catch (e) {}
  };

  const handleBlockConv = async (convId, blocked) => {
    try {
      await blockConversation(convId, blocked);
      setConvs(prev => prev.map(c => c._id === convId ? { ...c, isBlocked: blocked } : c));
    } catch (e) {}
  };

  const handleIssueId = async () => {
    if (!issueSvc || !issueIdNum) return;
    try {
      await issueServiceId({ userId: issueModal, service: issueSvc, idNumber: issueIdNum });
      setIssueModal(null); setIssueSvc(''); setIssueIdNum('');
    } catch (e) {}
  };

  const pendingCount = requests.filter(r => r.status === 'pending').length;

  return (
    <div className="page">
      <div className="page-title">ПАНЕЛЬ УПРАВЛЕНИЯ</div>

      <div className="tabs">
        {TABS.map((t, i) => (
          <div key={t} className={`tab ${tab === i ? 'active' : ''}`} onClick={() => setTab(i)}>
            {t}
            {i === 0 && pendingCount > 0 && <span className="nav-badge" style={{ marginLeft: 6 }}>{pendingCount}</span>}
          </div>
        ))}
      </div>

      {/* REQUESTS */}
      {tab === 0 && (
        <div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            {['pending', 'approved', 'rejected'].map(s => (
              <button key={s} className={`btn btn-sm ${reqFilter === s ? 'btn-primary' : 'btn-ghost'}`}
                onClick={() => setReqFilter(s)}>{s.toUpperCase()}</button>
            ))}
          </div>
          {requests.length === 0 && <div className="loading">НЕТ ЗАЯВОК</div>}
          {requests.map(req => (
            <RequestCard key={req._id} req={req} onApprove={handleApprove} onReject={handleReject} />
          ))}
        </div>
      )}

      {/* USERS */}
      {tab === 1 && (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>СОТРУДНИК</th><th>ФРАКЦИЯ</th><th>УД</th><th>СТАТУС</th><th>ДЕЙСТВИЯ</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <UserRow key={u._id} u={u} onUpdate={handleUpdateUser} onIssueId={setIssueModal} />
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* TWINS */}
      {tab === 2 && (
        <div>
          <div className="alert alert-info" style={{ marginBottom: 16 }}>
            Твинки — дополнительные аккаунты сотрудников. Для одобрения/отклонения используйте вкладку Заявки.
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>ТВИНК</th><th>ОСНОВНОЙ АККАУНТ</th><th>УД</th><th>СТАТУС</th><th>ДЕЙСТВИЯ</th>
                </tr>
              </thead>
              <tbody>
                {twins.map(t => (
                  <tr key={t._id}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{t.callsign}</div>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-dim)' }}>{t.employeeId}</div>
                    </td>
                    <td>
                      <div>{t.parentAccount?.fio}</div>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-dim)' }}>{t.parentAccount?.employeeId}</div>
                    </td>
                    <td><span className={`cl-${t.clearanceLevel}`} style={{ fontFamily: 'var(--font-head)', fontWeight: 900, fontSize: 18 }}>{t.clearanceLevel}</span></td>
                    <td><span className={`badge badge-${t.status}`}>{t.status}</span></td>
                    <td>
                      <button className="btn btn-ghost btn-sm" onClick={() => handleUpdateUser(t._id, { status: t.status === 'approved' ? 'banned' : 'approved' })}>
                        {t.status === 'approved' ? 'БАН' : 'РАЗБАН'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* COMMS */}
      {tab === 3 && (
        <div>
          {/* Block all button */}
          <div className="card" style={{ marginBottom: 20 }}>
            <div className="card-title">УПРАВЛЕНИЕ СВЯЗЬЮ</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div>
                <div style={{ fontWeight: 600, marginBottom: 4 }}>Глобальная блокировка всей связи</div>
                <div style={{ fontSize: 13, color: 'var(--text-dim)' }}>
                  Блокирует все каналы связи для всех пользователей
                </div>
              </div>
              <button
                className={`btn ${commsBlocked ? 'btn-primary' : 'btn-danger'}`}
                onClick={handleBlockAllComms}
              >
                {commsBlocked ? '✓ СВЯЗЬ ВОССТАНОВИТЬ' : '⚠ ЗАБЛОКИРОВАТЬ ВСЮ СВЯЗЬ'}
              </button>
            </div>
            {commsBlocked && (
              <div className="alert alert-error" style={{ marginTop: 12 }}>
                ⚠ ВСЯ СВЯЗЬ ЗАБЛОКИРОВАНА
              </div>
            )}
          </div>

          {/* ЛС */}
          <div style={{ marginBottom: 8, fontFamily: 'var(--font-head)', fontSize: 12, color: 'var(--accent)', letterSpacing: 2 }}>
            ЛИЧНЫЕ СООБЩЕНИЯ
          </div>
          <div className="table-wrap" style={{ marginBottom: 20 }}>
            <table>
              <thead><tr><th>УЧАСТНИКИ</th><th>СТАТУС</th><th>ДЕЙСТВИЯ</th></tr></thead>
              <tbody>
                {convs.filter(c => c.type === 'dm').map(c => {
                  const names = c.participants?.map(p => p.callsign || p.username).join(' ↔ ') || '';
                  return (
                    <tr key={c._id}>
                      <td>{names}</td>
                      <td>{c.isBlocked ? <span className="badge badge-blocked">ЗАБЛОКИРОВАНО</span> : <span className="badge badge-approved">АКТИВНО</span>}</td>
                      <td>
                        <button className={`btn btn-sm ${c.isBlocked ? 'btn-primary' : 'btn-danger'}`}
                          onClick={() => handleBlockConv(c._id, !c.isBlocked)}>
                          {c.isBlocked ? 'РАЗБЛОК' : 'БЛОК'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Groups */}
          <div style={{ marginBottom: 8, fontFamily: 'var(--font-head)', fontSize: 12, color: 'var(--accent)', letterSpacing: 2 }}>
            ГРУППЫ
          </div>
          <div className="table-wrap">
            <table>
              <thead><tr><th>ГРУППА</th><th>УЧАСТНИКИ</th><th>СТАТУС</th><th>ДЕЙСТВИЯ</th></tr></thead>
              <tbody>
                {convs.filter(c => c.type === 'group').map(c => (
                  <tr key={c._id}>
                    <td style={{ fontWeight: 600 }}>{c.name}</td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>
                      {c.participants?.map(p => p.callsign || p.username).join(', ')}
                    </td>
                    <td>{c.isBlocked ? <span className="badge badge-blocked">ЗАБЛОК</span> : <span className="badge badge-approved">АКТИВНО</span>}</td>
                    <td>
                      <button className={`btn btn-sm ${c.isBlocked ? 'btn-primary' : 'btn-danger'}`}
                        onClick={() => handleBlockConv(c._id, !c.isBlocked)}>
                        {c.isBlocked ? 'РАЗБЛОК' : 'БЛОК'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Issue Service ID Modal */}
      {issueModal && (
        <div className="modal-overlay" onClick={() => setIssueModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-title">ВЫДАТЬ УД СЛУЖБЫ</div>
            <div className="form-group">
              <label className="form-label">Служба (напр. АПАИБ)</label>
              <input className="form-input" value={issueSvc} onChange={e => setIssueSvc(e.target.value)} placeholder="АПАИБ" />
            </div>
            <div className="form-group">
              <label className="form-label">Номер УД</label>
              <input className="form-input" value={issueIdNum} onChange={e => setIssueIdNum(e.target.value)} placeholder="APAIB-0001" />
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-ghost" onClick={() => setIssueModal(null)} style={{ flex: 1 }}>ОТМЕНА</button>
              <button className="btn btn-primary" onClick={handleIssueId} style={{ flex: 2 }}>ВЫДАТЬ</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
