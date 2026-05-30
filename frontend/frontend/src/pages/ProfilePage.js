import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getUser, updateCallsign, requestTwin, getMyTwins, getMyRequests } from '../utils/api';
import { getClearanceInfo, EXTENSIONS } from '../utils/clearance';

export default function ProfilePage() {
  const { id } = useParams();
  const { user, setUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [twins, setTwins] = useState([]);
  const [myRequests, setMyRequests] = useState([]);
  const [tab, setTab] = useState(0);
  const [newCallsign, setNewCallsign] = useState('');
  const [showTwinForm, setShowTwinForm] = useState(false);
  const [twinForm, setTwinForm] = useState({ twinUsername:'', twinPassword:'', twinFio:'', twinCallsign:'', twinPosition:'', twinDiscordNick:'' });
  const [msg, setMsg] = useState('');

  const isOwn = !id || id === user?._id;

  useEffect(() => {
    if (isOwn) {
      setProfile(user);
      setNewCallsign(user?.callsign || '');
      getMyTwins().then(r => setTwins(r.data)).catch(() => {});
      getMyRequests().then(r => setMyRequests(r.data)).catch(() => {});
    } else {
      getUser(id).then(r => setProfile(r.data)).catch(() => {});
    }
  }, [id, user, isOwn]);

  const handleCallsignSave = async () => {
    try {
      const res = await updateCallsign(newCallsign);
      setUser(res.data);
      setMsg('Позывной обновлён');
    } catch (e) { setMsg('Ошибка'); }
  };

  const handleTwinRequest = async (e) => {
    e.preventDefault();
    try {
      await requestTwin(twinForm);
      setShowTwinForm(false);
      setMsg('Заявка на твинк отправлена');
    } catch (e) { setMsg(e.response?.data?.message || 'Ошибка'); }
  };

  if (!profile) return <div className="loading">ЗАГРУЗКА...</div>;
  const clInfo = getClearanceInfo(profile.clearanceLevel);

  return (
    <div className="page">
      <div className="page-title">{isOwn ? 'МОЙ ПРОФИЛЬ' : 'ПРОФИЛЬ СОТРУДНИКА'}</div>
      {msg && <div className="alert alert-success" onClick={() => setMsg('')}>{msg}</div>}

      <div className="grid-2" style={{ marginBottom: 24 }}>
        {/* ID Card */}
        <div className={`id-card id-card-cl${profile.clearanceLevel}`}>
          <div className="id-card-header">ФОНД SCP — УДОСТОВЕРЕНИЕ</div>
          <div className="id-card-name">{profile.fio}</div>
          <div className="id-card-callsign">«{profile.callsign}»</div>
          <div className={`id-card-cl-badge cl-${profile.clearanceLevel}`}>УД-{profile.clearanceLevel}</div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-dim)', textAlign: 'center', marginBottom: 16 }}>
            {clInfo.name} [{clInfo.short}]
          </div>
          {[
            ['ФРАКЦИЯ', profile.fraction],
            ['ТИП', profile.fractionType === 'combat' ? 'БОЕВАЯ' : 'ГРАЖДАНСКАЯ'],
            ['ДОЛЖНОСТЬ', profile.position],
            ['DISCORD', profile.discordNick],
          ].map(([k, v]) => (
            <div className="id-card-row" key={k}>
              <span className="id-card-label">{k}</span>
              <span className="id-card-value">{v}</span>
            </div>
          ))}
          {profile.clearanceExtensions?.length > 0 && (
            <div className="id-card-extensions" style={{ marginTop: 12 }}>
              {profile.clearanceExtensions.map(ext => (
                <span key={ext} className="ext-badge" title={EXTENSIONS[ext]?.description}>[{ext}] {EXTENSIONS[ext]?.name}</span>
              ))}
            </div>
          )}
          <div className="id-card-id">{profile.employeeId}</div>
        </div>

        {/* Info / Actions */}
        <div>
          {isOwn && (
            <div className="card" style={{ marginBottom: 16 }}>
              <div className="card-title">ИЗМЕНИТЬ ПОЗЫВНОЙ</div>
              <div style={{ display: 'flex', gap: 8 }}>
                <input className="form-input" value={newCallsign} onChange={e => setNewCallsign(e.target.value)} />
                <button className="btn btn-primary" onClick={handleCallsignSave}>СОХРАНИТЬ</button>
              </div>
            </div>
          )}

          {profile.serviceIds?.length > 0 && (
            <div className="card">
              <div className="card-title">УД ДРУГИХ СЛУЖБ</div>
              {profile.serviceIds.map((s, i) => (
                <div key={i} style={{ padding: '8px 0', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-dim)' }}>{s.service}</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--accent)' }}>{s.idNumber}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {isOwn && (
        <>
          <div className="tabs">
            {['ТВИНКИ', 'МОИ ЗАЯВКИ'].map((t, i) => (
              <div key={t} className={`tab ${tab === i ? 'active' : ''}`} onClick={() => setTab(i)}>{t}</div>
            ))}
          </div>

          {tab === 0 && (
            <div>
              <button className="btn btn-primary" style={{ marginBottom: 16 }} onClick={() => setShowTwinForm(true)}>
                + СОЗДАТЬ ТВИНК
              </button>

              {twins.length === 0 && <div style={{ color: 'var(--text-dim)', fontFamily: 'var(--font-mono)', fontSize: 12 }}>НЕТ ТВИНКОВ</div>}

              {twins.map(t => (
                <div key={t._id} className="card" style={{ marginBottom: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 15 }}>{t.callsign}</div>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-dim)' }}>
                        {t.employeeId} · {t.fio}
                      </div>
                    </div>
                    <span className={`badge badge-${t.status}`}>{t.status}</span>
                  </div>
                </div>
              ))}

              {showTwinForm && (
                <div className="modal-overlay" onClick={() => setShowTwinForm(false)}>
                  <div className="modal" onClick={e => e.stopPropagation()}>
                    <div className="modal-title">ЗАПРОС ТВИНК-АККАУНТА</div>
                    <form onSubmit={handleTwinRequest}>
                      {[
                        ['twinUsername', 'Логин'],
                        ['twinPassword', 'Пароль'],
                        ['twinFio', 'ФИО'],
                        ['twinCallsign', 'Позывной'],
                        ['twinPosition', 'Должность'],
                        ['twinDiscordNick', 'Discord ник (@ник)'],
                      ].map(([k, label]) => (
                        <div className="form-group" key={k}>
                          <label className="form-label">{label}</label>
                          <input
                            className="form-input"
                            type={k === 'twinPassword' ? 'password' : 'text'}
                            value={twinForm[k]}
                            onChange={e => setTwinForm(p => ({ ...p, [k]: e.target.value }))}
                            required
                          />
                        </div>
                      ))}
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button type="button" className="btn btn-ghost" onClick={() => setShowTwinForm(false)} style={{ flex: 1 }}>ОТМЕНА</button>
                        <button type="submit" className="btn btn-primary" style={{ flex: 2 }}>ОТПРАВИТЬ ЗАЯВКУ</button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </div>
          )}

          {tab === 1 && (
            <div>
              {myRequests.length === 0 && <div style={{ color: 'var(--text-dim)', fontFamily: 'var(--font-mono)', fontSize: 12 }}>НЕТ ЗАЯВОК</div>}
              {myRequests.map(r => (
                <div key={r._id} className="card" style={{ marginBottom: 12 }}>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
                    <span className={`badge badge-${r.status}`}>{r.status}</span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-dim)' }}>
                      {r.type} · {new Date(r.createdAt).toLocaleString('ru')}
                    </span>
                  </div>
                  {r.requestedLevel !== undefined && (
                    <div style={{ fontSize: 13 }}>Запрошен УД-{r.requestedLevel}</div>
                  )}
                  {r.documentId && (
                    <div style={{ fontSize: 13 }}>Документ: {r.documentId.title}</div>
                  )}
                  {r.reviewNote && (
                    <div style={{ fontSize: 13, color: 'var(--text-dim)', marginTop: 4 }}>Комментарий: {r.reviewNote}</div>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
