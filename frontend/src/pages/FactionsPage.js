import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { getPersonnel } from '../api';

export default function FactionsPage() {
  const [personnel, setPersonnel] = useState([]);
  const [tab, setTab] = useState('all');

  useEffect(() => { getPersonnel().then(r => setPersonnel(r.data)).catch(console.error); }, []);

  const active = personnel.filter(p => p.personnelStatus === 'active');
  const byFraction = active.reduce((acc, p) => {
    const key = p.fraction || 'Без фракции';
    if (!acc[key]) acc[key] = { name: key, type: p.fractionType, members: [] };
    acc[key].members.push(p);
    return acc;
  }, {});

  const factions = Object.values(byFraction);
  const filtered = tab === 'all' ? factions : factions.filter(f => f.type === tab);

  return (
    <motion.div initial={{opacity:0}} animate={{opacity:1}}>
      <div className="page-header">
        <div className="page-title">⬢ <span>Фракции</span></div>
        <div style={{fontSize:12,color:'var(--text-dim)'}}>{factions.length} фракций</div>
      </div>

      <div className="tabs">
        {[['all','Все'],['combat','⚔ Боевые'],['civil','◎ Гражданские']].map(([k,l])=>(
          <div key={k} className={`tab ${tab===k?'active':''}`} onClick={()=>setTab(k)}>{l}</div>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state"><div className="empty-state-icon">⬢</div><div>Нет данных</div></div>
      ) : (
        <div style={{display:'flex',flexDirection:'column',gap:16}}>
          {filtered.map((f, i) => (
            <motion.div key={f.name} className="card" initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} transition={{delay:i*0.05}}>
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:14,flexWrap:'wrap',gap:8}}>
                <div style={{display:'flex',alignItems:'center',gap:10}}>
                  <span style={{fontSize:22,color:f.type==='combat'?'var(--red)':'var(--blue)'}}>{f.type==='combat'?'⚔':'◎'}</span>
                  <div>
                    <div style={{fontFamily:'var(--font-ui)',fontSize:16,fontWeight:700}}>{f.name}</div>
                    <div style={{fontSize:11,color:'var(--text-dim)'}}>{f.type==='combat'?'Боевая фракция':'Гражданская фракция'}</div>
                  </div>
                </div>
                <span className="badge badge-ud">{f.members.length} чел.</span>
              </div>
              <div className="grid-4">
                {f.members.map(m => (
                  <div key={m._id} style={{display:'flex',alignItems:'center',gap:8,padding:'8px',background:'var(--bg3)',borderRadius:4,border:'1px solid var(--border)'}}>
                    <div style={{width:32,height:32,minWidth:32,borderRadius:4,background:'var(--bg2)',border:'1px solid var(--border)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:13,color:'var(--primary)',fontFamily:'var(--font-ui)',fontWeight:700,overflow:'hidden'}}>
                      {m.avatar?<img src={m.avatar} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}}/>:(m.callsign?.[0]||'?')}
                    </div>
                    <div style={{minWidth:0}}>
                      <div style={{fontSize:12,fontFamily:'var(--font-ui)',fontWeight:600,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{m.callsign}</div>
                      <div style={{fontSize:10,color:'var(--text-dim)',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{m.position}</div>
                    </div>
                    <span className="badge badge-ud" style={{marginLeft:'auto',flexShrink:0,fontSize:10}}>{m.clearanceLevel}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
