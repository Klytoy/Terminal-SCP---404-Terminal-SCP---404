import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  getConversations, startDM, createGroup, getMessages,
  sendMessage, editMessage, deleteMessage, blockConversation,
  deleteConversation, getUsers, addToGroup
} from '../utils/api';

const TABS = ['ВСЕ', 'ЛС', 'ГРУППЫ'];

function ConvItem({ conv, active, onClick, unread, myId }) {
  const other = conv.type === 'dm'
    ? conv.participants?.find(p => p._id !== myId)
    : null;
  const name = conv.type === 'group' ? conv.name : (other?.callsign || other?.username || '?');

  return (
    <div className={`chat-item ${active ? 'active' : ''} ${conv.isBlocked ? 'blocked' : ''}`} onClick={onClick}>
      <div className="chat-item-name">
        <span style={{ fontSize: 12 }}>{conv.type === 'group' ? '◎' : '◈'}</span>
        {name}
        {unread > 0 && <span className="nav-badge">{unread}</span>}
        {conv.isBlocked && <span className="badge badge-blocked" style={{ marginLeft: 'auto', fontSize: 9 }}>БЛОК</span>}
      </div>
      <div className="chat-item-preview">
        {conv.type === 'group' && `${conv.participants?.length || 0} участников`}
      </div>
    </div>
  );
}

function Message({ msg, myId, onReply, onEdit, onDelete }) {
  const isOwn = msg.sender?._id === myId;
  const [showActions, setShowActions] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(msg.content);

  const handleEdit = async () => {
    try {
      await editMessage(msg._id, editText);
      setEditing(false);
    } catch (e) {}
  };

  return (
    <div
      className={`message ${isOwn ? 'own' : ''}`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <div className="msg-avatar">
        {(msg.sender?.callsign || msg.sender?.username || '?')[0].toUpperCase()}
      </div>
      <div className="msg-body">
        <div className="msg-meta">
          {msg.sender?.callsign || msg.sender?.username}
          {msg.sender?.employeeId && ` [${msg.sender.employeeId}]`}
          {' · '}
          {new Date(msg.createdAt).toLocaleTimeString('ru', { hour: '2-digit', minute: '2-digit' })}
        </div>
        {msg.replyTo && (
          <div className="msg-reply">
            ↩ {msg.replyTo.sender?.callsign}: {msg.replyTo.content?.slice(0, 60)}
          </div>
        )}
        {editing ? (
          <div style={{ display: 'flex', gap: 8 }}>
            <textarea
              className="chat-input"
              value={editText}
              onChange={e => setEditText(e.target.value)}
              rows={2}
              autoFocus
            />
            <button className="btn btn-primary btn-sm" onClick={handleEdit}>✓</button>
            <button className="btn btn-ghost btn-sm" onClick={() => setEditing(false)}>✕</button>
          </div>
        ) : (
          <div className="msg-content">{msg.content}</div>
        )}
        {msg.isEdited && <div className="msg-edited">изменено</div>}
        {showActions && !editing && (
          <div style={{ display: 'flex', gap: 4, marginTop: 4 }}>
            <button className="btn btn-ghost btn-sm" onClick={() => onReply(msg)}>↩</button>
            {isOwn && (
              <>
                <button className="btn btn-ghost btn-sm" onClick={() => setEditing(true)}>✎</button>
                <button className="btn btn-danger btn-sm" onClick={() => onDelete(msg._id)}>✕</button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function CommsPage() {
  const { user, socket, commsBlocked, notifications, clearNotification } = useAuth();
  const isAdmin = user?.role === 'admin' || user?.role === 'superadmin';

  const [tab, setTab] = useState(0);
  const [conversations, setConversations] = useState([]);
  const [activeConv, setActiveConv] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [replyTo, setReplyTo] = useState(null);
  const [loading, setLoading] = useState(false);
  
  // Modals
  const [showNewDM, setShowNewDM] = useState(false);
  const [showNewGroup, setShowNewGroup] = useState(false);
  const [users, setUsers] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [groupName, setGroupName] = useState('');
  const [userSearch, setUserSearch] = useState('');

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const loadConversations = useCallback(async () => {
    try {
      const res = await getConversations();
      setConversations(res.data);
    } catch (e) {}
  }, []);

  useEffect(() => { loadConversations(); }, [loadConversations]);

  useEffect(() => {
    if (!socket) return;
    socket.on('new_message', ({ conversationId, message }) => {
      if (activeConv?._id === conversationId) {
        setMessages(prev => [...prev, message]);
      }
      loadConversations();
    });
    socket.on('message_edited', ({ messageId, content }) => {
      setMessages(prev => prev.map(m => m._id === messageId ? { ...m, content, isEdited: true } : m));
    });
    socket.on('message_deleted', ({ messageId }) => {
      setMessages(prev => prev.filter(m => m._id !== messageId));
    });
    socket.on('conversation_blocked', ({ conversationId, blocked }) => {
      setConversations(prev => prev.map(c => c._id === conversationId ? { ...c, isBlocked: blocked } : c));
    });
    return () => {
      socket.off('new_message');
      socket.off('message_edited');
      socket.off('message_deleted');
      socket.off('conversation_blocked');
    };
  }, [socket, activeConv, loadConversations]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const openConv = async (conv) => {
    setActiveConv(conv);
    clearNotification(conv._id);
    socket?.emit('join_conversation', conv._id);
    setLoading(true);
    try {
      const res = await getMessages(conv._id);
      setMessages(res.data);
    } catch (e) {} finally { setLoading(false); }
  };

  const handleSend = async () => {
    if (!input.trim() || !activeConv || commsBlocked || activeConv.isBlocked) return;
    const text = input;
    setInput('');
    setReplyTo(null);
    try {
      await sendMessage(activeConv._id, text, replyTo?._id);
    } catch (e) { setInput(text); }
  };

  const handleDelete = async (msgId) => {
    try { await deleteMessage(msgId); } catch (e) {}
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const loadUsers = async () => {
    try {
      const res = await getUsers({ search: userSearch });
      setUsers(res.data.filter(u => u._id !== user._id));
    } catch (e) {}
  };

  const startNewDM = async (targetId) => {
    try {
      const res = await startDM(targetId);
      await loadConversations();
      setShowNewDM(false);
      openConv(res.data);
    } catch (e) {}
  };

  const createNewGroup = async () => {
    if (!groupName || selectedUsers.length === 0) return;
    try {
      const res = await createGroup(groupName, selectedUsers);
      await loadConversations();
      setShowNewGroup(false);
      setGroupName('');
      setSelectedUsers([]);
      openConv(res.data);
    } catch (e) {}
  };

  const handleBlockConv = async (convId, blocked) => {
    try {
      await blockConversation(convId, blocked);
      setConversations(prev => prev.map(c => c._id === convId ? { ...c, isBlocked: blocked } : c));
      if (activeConv?._id === convId) setActiveConv(p => ({ ...p, isBlocked: blocked }));
    } catch (e) {}
  };

  const handleDeleteConv = async (convId) => {
    if (!window.confirm('Удалить переписку?')) return;
    try {
      await deleteConversation(convId);
      setConversations(prev => prev.filter(c => c._id !== convId));
      if (activeConv?._id === convId) { setActiveConv(null); setMessages([]); }
    } catch (e) {}
  };

  const filtered = conversations.filter(c => {
    if (tab === 1) return c.type === 'dm';
    if (tab === 2) return c.type === 'group';
    return true;
  });

  const other = activeConv?.type === 'dm'
    ? activeConv.participants?.find(p => p._id !== user._id)
    : null;
  const convName = activeConv?.type === 'group'
    ? activeConv.name
    : (other?.callsign || other?.username || '');

  return (
    <div className="chat-layout">
      {/* Sidebar */}
      <div className="chat-list">
        <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ fontFamily: 'var(--font-head)', fontSize: 12, color: 'var(--accent)', letterSpacing: 2, marginBottom: 10 }}>
            СВЯЗЬ
          </div>
          <div style={{ display: 'flex', gap: 4, marginBottom: 10 }}>
            {TABS.map((t, i) => (
              <button key={t} className={`tab ${tab === i ? 'active' : ''}`} onClick={() => setTab(i)}
                style={{ padding: '4px 8px', fontSize: 10 }}>
                {t}
              </button>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 4 }}>
            <button className="btn btn-ghost btn-sm" onClick={() => { setShowNewDM(true); loadUsers(); }} style={{ flex: 1 }}>
              + ЛС
            </button>
            <button className="btn btn-ghost btn-sm" onClick={() => { setShowNewGroup(true); loadUsers(); }} style={{ flex: 1 }}>
              + Группа
            </button>
          </div>
        </div>

        {filtered.map(conv => (
          <ConvItem
            key={conv._id}
            conv={conv}
            active={activeConv?._id === conv._id}
            onClick={() => openConv(conv)}
            unread={notifications[conv._id] || 0}
            myId={user._id}
          />
        ))}

        {filtered.length === 0 && (
          <div style={{ padding: 20, textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-dim)' }}>
            НЕТ ПЕРЕПИСОК
          </div>
        )}
      </div>

      {/* Main chat */}
      <div className="chat-main">
        {activeConv ? (
          <>
            {/* Chat header */}
            <div style={{
              padding: '12px 20px',
              borderBottom: '1px solid var(--border)',
              background: 'var(--bg2)',
              display: 'flex',
              alignItems: 'center',
              gap: 12
            }}>
              <div>
                <div style={{ fontWeight: 700, color: 'var(--text-bright)' }}>
                  {convName}
                  {activeConv.isBlocked && <span className="badge badge-blocked" style={{ marginLeft: 8, fontSize: 10 }}>ЗАБЛОКИРОВАНО</span>}
                </div>
                {activeConv.type === 'group' && (
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-dim)' }}>
                    {activeConv.participants?.length} участников
                  </div>
                )}
                {other && (
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-dim)' }}>
                    {other.employeeId} · УД-{other.clearanceLevel}
                  </div>
                )}
              </div>
              <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
                {isAdmin && (
                  <button
                    className={`btn btn-sm ${activeConv.isBlocked ? 'btn-primary' : 'btn-danger'}`}
                    onClick={() => handleBlockConv(activeConv._id, !activeConv.isBlocked)}
                  >
                    {activeConv.isBlocked ? 'РАЗБЛОКИРОВАТЬ' : 'ЗАБЛОКИРОВАТЬ'}
                  </button>
                )}
                <button className="btn btn-danger btn-sm" onClick={() => handleDeleteConv(activeConv._id)}>
                  УДАЛИТЬ
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="chat-messages">
              {loading && <div className="loading" style={{ height: 80 }}>ЗАГРУЗКА...</div>}
              {messages.map(msg => (
                <Message
                  key={msg._id}
                  msg={msg}
                  myId={user._id}
                  onReply={setReplyTo}
                  onEdit={() => {}}
                  onDelete={handleDelete}
                />
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="chat-input-area">
              {replyTo && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, padding: '6px 10px', background: 'var(--bg3)', borderRadius: 4, borderLeft: '3px solid var(--accent)' }}>
                  <span style={{ fontSize: 12, color: 'var(--text-dim)' }}>↩ Ответ: {replyTo.content?.slice(0, 60)}</span>
                  <button className="btn btn-ghost btn-sm" style={{ marginLeft: 'auto' }} onClick={() => setReplyTo(null)}>✕</button>
                </div>
              )}
              {(commsBlocked || activeConv.isBlocked) ? (
                <div className="alert alert-error" style={{ margin: 0 }}>
                  {commsBlocked ? '⚠ Связь заблокирована командованием' : '⚠ Этот канал заблокирован'}
                </div>
              ) : (
                <div className="chat-input-wrap">
                  <textarea
                    ref={inputRef}
                    className="chat-input"
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Введите сообщение... (Enter — отправить, Shift+Enter — новая строка)"
                    rows={1}
                  />
                  <button className="btn btn-primary" onClick={handleSend} disabled={!input.trim()}>
                    ОТПРАВИТЬ
                  </button>
                </div>
              )}
            </div>
          </>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', flexDirection: 'column', gap: 12 }}>
            <div style={{ fontFamily: 'var(--font-head)', fontSize: 14, color: 'var(--text-dim)', letterSpacing: 3 }}>ЗАЩИЩЁННЫЙ КАНАЛ</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-dim)' }}>Выберите переписку или создайте новую</div>
          </div>
        )}
      </div>

      {/* New DM Modal */}
      {showNewDM && (
        <div className="modal-overlay" onClick={() => setShowNewDM(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-title">НОВОЕ ЛС</div>
            <div className="form-group">
              <input className="form-input" placeholder="Поиск по имени / позывному / ID..." value={userSearch}
                onChange={e => setUserSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && loadUsers()} />
              <button className="btn btn-ghost btn-sm" onClick={loadUsers} style={{ marginTop: 6 }}>ПОИСК</button>
            </div>
            <div style={{ maxHeight: 300, overflowY: 'auto' }}>
              {users.map(u => (
                <div key={u._id} style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '10px 0', borderBottom: '1px solid var(--border)', cursor: 'pointer'
                }} onClick={() => startNewDM(u._id)}>
                  <div className={`cl-${u.clearanceLevel}`} style={{ fontFamily: 'var(--font-head)', fontWeight: 900, fontSize: 16 }}>
                    {u.clearanceLevel}
                  </div>
                  <div>
                    <div style={{ fontWeight: 600 }}>{u.callsign}</div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-dim)' }}>
                      {u.fio} · {u.employeeId}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <button className="btn btn-ghost" onClick={() => setShowNewDM(false)} style={{ marginTop: 12, width: '100%' }}>
              ОТМЕНА
            </button>
          </div>
        </div>
      )}

      {/* New Group Modal */}
      {showNewGroup && (
        <div className="modal-overlay" onClick={() => setShowNewGroup(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-title">СОЗДАТЬ ГРУППУ</div>
            <div className="form-group">
              <label className="form-label">Название группы</label>
              <input className="form-input" value={groupName} onChange={e => setGroupName(e.target.value)} />
            </div>
            <div className="form-group">
              <input className="form-input" placeholder="Поиск участников..." value={userSearch}
                onChange={e => setUserSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && loadUsers()} />
              <button className="btn btn-ghost btn-sm" onClick={loadUsers} style={{ marginTop: 6 }}>ПОИСК</button>
            </div>
            {selectedUsers.length > 0 && (
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--accent)', marginBottom: 8 }}>
                Выбрано: {selectedUsers.length} чел.
              </div>
            )}
            <div style={{ maxHeight: 250, overflowY: 'auto' }}>
              {users.map(u => {
                const selected = selectedUsers.includes(u._id);
                return (
                  <div key={u._id} style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '8px 0', borderBottom: '1px solid var(--border)',
                    cursor: 'pointer', opacity: selected ? 1 : 0.7
                  }} onClick={() => setSelectedUsers(p => selected ? p.filter(id => id !== u._id) : [...p, u._id])}>
                    <div style={{ width: 16, height: 16, border: '1px solid var(--accent)', borderRadius: 3, background: selected ? 'var(--accent)' : 'transparent' }} />
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 13 }}>{u.callsign}</div>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-dim)' }}>{u.employeeId}</div>
                    </div>
                  </div>
                );
              })}
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
              <button className="btn btn-ghost" onClick={() => setShowNewGroup(false)} style={{ flex: 1 }}>ОТМЕНА</button>
              <button className="btn btn-primary" onClick={createNewGroup} style={{ flex: 2 }}>СОЗДАТЬ</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
