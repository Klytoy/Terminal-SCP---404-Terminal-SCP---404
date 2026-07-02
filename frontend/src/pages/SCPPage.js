import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getSCPs, createSCP, updateSCP, deleteSCP } from '../api';
import { useAuth } from '../context/AuthContext';

const CLASS_BADGE = { Safe:'badge-safe', Euclid:'badge-euclid', Keter:'badge-keter', Thaumiel:'badge-thaumiel', Apollyon:'badge-dead', Neutralized:'badge-inactive' };

export default function SCPPage() {
  const { user } = useAuth();
  const [scps, setScps] = useState([]);
  const [selected, setSelected] = useState(null);
  const [creating, setCreating] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [search, setSearch] = useState('');
  const [filterClass, setFilterClass] = useState('');
  const isAdmin = ['superadmin','admin','moderator'].includes(user?.role);

  const [form, setForm] = useState({ number:'', title:'', objectClass:'Euclid', clearanceLevel:2, containmentProcedures:'', description:'', addenda:'', tags:'' });

  useEffect(() => { getSCPs().then(r=>setScps(r.data)).catch(console.error); }, []);

  const load = () => getSCPs().then(r=>setScps(r.data)).catch(console.error);
  const set = (k,v) => setForm(f=>({...f,[k]:v}));

  const save = async () => {
    try {
      const data = { ...form, tags: form.tags.split(',').map(t=>t.trim()).filter(Boolean) };
      if (editTarget) { await updateSCP(editTarget._id, data); setEditTarget(null); }
      else { await createSCP(data); setCreating(false); }
      setForm({number:'',title:'',objectClass:'Euclid',clearanceLevel:2,containmentProcedures:'',description:'',addenda:'',tags:''});
      load();
    } catch(e) { alert(e.response?.data?.error||'Ошибка'); }
  };

  const startEdit = (scp) => {
    setForm({ number:scp.number, title:scp.title, objectClass:scp.objectClass, clearanceLevel:scp.clearanceLevel, containmentProcedures:scp.containmentProcedures, description:scp.description, addenda:scp.addenda||'', tags:(scp.tags||[]).join(', ') });
    setEditTarget(scp); setCreating(true); setSelected(null);
  };

  const filtered = scps.filter(s => {
    if (search && !s.number?.includes(search) && !s.title?.toLowerCase().includes(search.toLowerCase())) return false;
    if (filterClass && s.objectClass !== filterClass) return false;
    return true;
  });

  return (
    <motion.div initial={{opacity:0}} animate={{opacity:1}}>
      <div className="page-header">
        <div className="page-title">☢ <span>Архив SCP</span></div>
        {isAdmin && <button className="btn btn-primary" onClick={()=>{setCreating(true);setEditTarget(null);}}>+ Добавить</button>}
      </div>

      <div className="card" style={{marginBottom:16}}>
        <div style={{display:'flex',gap:10,flexWrap:'wrap',alignItems:'center'}}>
          <input className="form-input" style={{flex:1,minWidth:160}} placeholder="⌕ Поиск по номеру или названию..." value={search} onChange={e=>setSearch(e.target.value)}/>
          <select className="form-input" style={{width:'auto'}} value={filterClass} onChange={e=>setFilterClass(e.target.value)}>
            <option value="">Все классы</option>
            {['Safe','Euclid','Keter','Thaumiel','Apollyon','Neutralized'].map(c=><option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>

      <div className="grid-3">
        {filtered.map((s,i) => (
          <motion.div key={s._id} initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} transition={{delay:i*0.03}}>
            <div className={`card ${s.classified?'':'cursor-pointer'}`} style={{cursor:s.classified?'default':'pointer'}} onClick={()=>!s.classified&&setSelected(s)}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:8}}>
                <div style={{fontFamily:'var(--font-ui)',fontWeight:700,fontSize:16,color:'var(--primary)'}}>SCP-{s.number}</div>
                <span className={`badge ${CLASS_BADGE[s.objectClass]||'badge-inactive'}`}>{s.objectClass}</span>
              </div>
              <div style={{fontSize:14,marginBottom:8}}>{s.classified ? '█████ █████ █████' : s.title}</div>
              <div style={{display:'flex',gap:6,alignItems:'center'}}>
                <span className="badge badge-ud">УД-{s.clearanceLevel}</span>
                {s.classified && <span style={{fontSize:11,color:'var(--red)'}}>🔒 ЗАСЕКРЕЧЕНО</span>}
              </div>
            </div>
          </motion.div>
        ))}
        {filtered.length===0&&<div className="empty-state" style={{gridColumn:'1/-1'}}><div className="empty-state-icon">☢</div><div>Нет объектов</div></div>}
      </div>

      {/* Detail modal */}
      <AnimatePresence>
        {selected && !creating && (
          <motion.div className="modal-overlay" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} onClick={()=>setSelected(null)}>
            <motion.div className="modal" style={{maxWidth:700}} initial={{scale:0.95}} animate={{scale:1}} exit={{scale:0.95}} onClick={e=>e.stopPropagation()}>
              <div className="modal-title">
                <span>SCP-{selected.number}: {selected.title}</span>
                <button className="modal-close" onClick={()=>setSelected(null)}>✕</button>
              </div>
              <div style={{display:'flex',gap:8,marginBottom:16}}>
                <span className={`badge ${CLASS_BADGE[selected.objectClass]}`}>{selected.objectClass}</span>
                <span className="badge badge-ud">УД-{selected.clearanceLevel}</span>
              </div>
              {selected.containmentProcedures && <><div style={{fontSize:11,color:'var(--text-dim)',textTransform:'uppercase',letterSpacing:1,marginBottom:6}}>ОСОБЫЕ УСЛОВИЯ СОДЕРЖАНИЯ</div><div style={{fontSize:13,lineHeight:1.7,marginBottom:16,borderLeft:'2px solid var(--primary-dim)',paddingLeft:12}}>{selected.containmentProcedures}</div></>}
              {selected.description && <><div style={{fontSize:11,color:'var(--text-dim)',textTransform:'uppercase',letterSpacing:1,marginBottom:6}}>ОПИСАНИЕ</div><div style={{fontSize:13,lineHeight:1.7,marginBottom:16}}>{selected.description}</div></>}
              {selected.addenda && <><div style={{fontSize:11,color:'var(--text-dim)',textTransform:'uppercase',letterSpacing:1,marginBottom:6}}>ПРИЛОЖЕНИЯ</div><div style={{fontSize:13,lineHeight:1.7}}>{selected.addenda}</div></>}
              {isAdmin && <div style={{marginTop:20,display:'flex',gap:8}}><button className="btn btn-primary" onClick={()=>startEdit(selected)}>✎ Редактировать</button><button className="btn btn-danger" onClick={async()=>{if(window.confirm('Удалить?')){await deleteSCP(selected._id);load();setSelected(null)}}}>✕ Удалить</button></div>}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Create/Edit modal */}
      <AnimatePresence>
        {creating && (
          <motion.div className="modal-overlay" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} onClick={()=>{setCreating(false);setEditTarget(null);}}>
            <motion.div className="modal" style={{maxWidth:600}} initial={{scale:0.95}} animate={{scale:1}} exit={{scale:0.95}} onClick={e=>e.stopPropagation()}>
              <div className="modal-title">
                <span>{editTarget?'✎ Редактировать SCP':'+ Новый SCP'}</span>
                <button className="modal-close" onClick={()=>{setCreating(false);setEditTarget(null);}}>✕</button>
              </div>
              <div className="grid-2">
                <div className="form-group"><label className="form-label">Номер</label><input className="form-input" placeholder="XXX" value={form.number} onChange={e=>set('number',e.target.value)}/></div>
                <div className="form-group"><label className="form-label">Класс</label><select className="form-input" value={form.objectClass} onChange={e=>set('objectClass',e.target.value)}>{['Safe','Euclid','Keter','Thaumiel','Apollyon','Neutralized'].map(c=><option key={c} value={c}>{c}</option>)}</select></div>
              </div>
              <div className="form-group"><label className="form-label">Название</label><input className="form-input" placeholder="Название объекта" value={form.title} onChange={e=>set('title',e.target.value)}/></div>
              <div className="form-group"><label className="form-label">УД (1-6)</label><select className="form-input" value={form.clearanceLevel} onChange={e=>set('clearanceLevel',Number(e.target.value))}>{[1,2,3,4,5,6].map(n=><option key={n} value={n}>{n}</option>)}</select></div>
              <div className="form-group"><label className="form-label">Процедуры содержания</label><textarea className="form-input" rows={3} value={form.containmentProcedures} onChange={e=>set('containmentProcedures',e.target.value)}/></div>
              <div className="form-group"><label className="form-label">Описание</label><textarea className="form-input" rows={4} value={form.description} onChange={e=>set('description',e.target.value)}/></div>
              <div className="form-group"><label className="form-label">Приложения</label><textarea className="form-input" rows={2} value={form.addenda} onChange={e=>set('addenda',e.target.value)}/></div>
              <div className="form-group"><label className="form-label">Теги (через запятую)</label><input className="form-input" placeholder="humanoid, sentient, ..." value={form.tags} onChange={e=>set('tags',e.target.value)}/></div>
              <div style={{display:'flex',gap:8,justifyContent:'flex-end',marginTop:8}}>
                <button className="btn" onClick={()=>{setCreating(false);setEditTarget(null);}}>Отмена</button>
                <button className="btn btn-primary" onClick={save}>✓ Сохранить</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
