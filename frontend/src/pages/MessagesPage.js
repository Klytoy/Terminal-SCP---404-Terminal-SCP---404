import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { getConversations, createConversation, getMessages, sendMessage } from '../api';
import { useAuth } from '../context/AuthContext';
import io from 'socket.io-client';

const SOCKET_URL = process.env.REACT_APP_API_URL?.replace('/api','') || 'http://localhost:5000';

export default function MessagesPage() {
  const { user } = useAuth();
  const [convs, setConvs] = useState([]);
  const [activeConv, setActiveConv] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [creating, setCreating] = useState(false);
  const [newConvName, setNewConvName] = useState('');
  const [newConvType, setNewConvType] = useState('group');
  const socketRef = useRef(null);
  const bottomRef = useRef(null);

  useEffect(() => {
    getConversations().then(r=>setConvs(r.data)).catch(console.error);
    socketRef.current = io(SOCKET_URL);
    return () => socketRef.current?.disconnect();
  }, []);

  useEffect(() => {
    if (!activeConv) return;
    getMessages(activeConv._id).then(r=>setMessages(r.data)).catch(console.error);
    socketRef.current?.emit('join', activeConv._id);
    socketRef.current?.on('message', msg => setMessages(m => [...m, msg]));
    return () => socketRef.current?.off('message');
  }, [activeConv]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior:'smooth' }); }, [messages]);

  const send = async () => {
    if (!text.trim() || !activeConv) return;
    try {
      await sendMessage(activeConv._id, { content: text });
      setText('');
    } catch(e) { console.error(e); }
  };

  const createConv = async () => {
    try {
      const conv = await createConversation({ name: newConvName, type: newConvType });
      setConvs(c=>[conv.data,...c]);
      setCreating(false); setNewConvName('');
    } catch(e) { console.error(e); }
  };

  return (
    <motion.div initial={{opacity:0}} animate={{opacity:1}} style={{height:'calc(100vh - 100px)',display:'flex',gap:16}}>
      {/* Conversations list */}
      <div style={{width:240,minWidth:240,display:'flex',flexDirection:'column',gap:8}}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:4}}>
          <div style={{fontFamily:'var(--font-ui)',fontWeight:700,fontSize:14}}>▣ Связь</div>
          <button className="btn btn-sm btn-primary" onClick={()=>setCreating(true)}>+</button>
        </div>
        {convs.length === 0 ? (
          <div style={{fontSize:12,color:'var(--text-dim)',textAlign:'center',paddingTop:20}}>Нет каналов</div>
        ) : convs.map(c => (
          <div key={c._id}
            className="card"
            style={{padding:'10px 12px',cursor:'pointer',borderColor:activeConv?._id===c._id?'var(--primary)':'var(--border)'}}
            onClick={()=>setActiveConv(c)}>
            <div style={{fontFamily:'var(--font-ui)',fontWeight:600,fontSize:13}}>{c.name || (c.type==='direct'?'ЛС':'Группа')}</div>
            <div style={{fontSize:10,color:'var(--text-dim)',marginTop:2}}>{c.type==='direct'?'Личные':'Групповой'}</div>
          </div>
        ))}
      </div>

      {/* Chat area */}
      <div style={{flex:1,display:'flex',flexDirection:'column'}}>
        {!activeConv ? (
          <div className="empty-state" style={{marginTop:60}}>
            <div className="empty-state-icon">▣</div>
            <div>Выберите канал связи</div>
          </div>
        ) : (
          <>
            <div style={{padding:'12px 16px',borderBottom:'1px solid var(--border)',fontFamily:'var(--font-ui)',fontWeight:700,background:'var(--bg2)',borderRadius:'4px 4px 0 0'}}>
              {activeConv.name || 'Канал'}
            </div>
            <div style={{flex:1,overflowY:'auto',padding:16,display:'flex',flexDirection:'column',gap:10,background:'var(--bg2)',borderLeft:'1px solid var(--border)',borderRight:'1px solid var(--border)'}}>
              {messages.map(m => (
                <div key={m._id} style={{display:'flex',gap:10,alignItems:'flex-start',flexDirection:m.sender?._id===user._id?'row-reverse':'row'}}>
                  <div style={{width:28,height:28,minWidth:28,borderRadius:4,background:'var(--bg3)',border:'1px solid var(--border)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,color:'var(--primary)',fontFamily:'var(--font-ui)',fontWeight:700}}>
                    {m.sender?.callsign?.[0]||'?'}
                  </div>
                  <div style={{maxWidth:'70%'}}>
                    <div style={{fontSize:10,color:'var(--text-dim)',marginBottom:3}}>{m.sender?.callsign}</div>
                    <div style={{background:'var(--bg3)',border:'1px solid var(--border)',borderRadius:4,padding:'8px 12px',fontSize:13,lineHeight:1.5}}>{m.content}</div>
                  </div>
                </div>
              ))}
              <div ref={bottomRef}/>
            </div>
            <div style={{display:'flex',gap:8,padding:12,background:'var(--bg2)',border:'1px solid var(--border)',borderTop:'none',borderRadius:'0 0 4px 4px'}}>
              <input className="form-input" style={{flex:1}} placeholder="Сообщение..." value={text} onChange={e=>setText(e.target.value)} onKeyDown={e=>e.key==='Enter'&&send()}/>
              <button className="btn btn-primary" onClick={send}>▶</button>
            </div>
          </>
        )}
      </div>

      {creating && (
        <div className="modal-overlay" onClick={()=>setCreating(false)}>
          <div className="modal" style={{maxWidth:400}} onClick={e=>e.stopPropagation()}>
            <div className="modal-title"><span>+ Новый канал</span><button className="modal-close" onClick={()=>setCreating(false)}>✕</button></div>
            <div className="form-group"><label className="form-label">Название</label><input className="form-input" value={newConvName} onChange={e=>setNewConvName(e.target.value)}/></div>
            <div className="form-group"><label className="form-label">Тип</label>
              <select className="form-input" value={newConvType} onChange={e=>setNewConvType(e.target.value)}>
                <option value="group">Групповой</option>
                <option value="general">Общий</option>
                <option value="direct">Личные</option>
              </select>
            </div>
            <div style={{display:'flex',gap:8,justifyContent:'flex-end'}}>
              <button className="btn" onClick={()=>setCreating(false)}>Отмена</button>
              <button className="btn btn-primary" onClick={createConv}>Создать</button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}
