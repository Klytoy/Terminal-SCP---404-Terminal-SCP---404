import React from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';

const EXTENSIONS_INFO = {
  A: 'Административный', M: 'Медицинский', SI: 'Специальные Интересы',
  I: 'Разведка', T: 'Тактический', O: 'Оперативный', H: 'HAZMAT',
  P: 'Проекты', ET: 'Экстра-Территориальный', S: 'Секретный',
  R: 'Исследовательский', T4: 'Уровень-4 Тактический', O5: 'О5 Совет'
};

const LEVEL_COLORS = ['var(--text-dim)','var(--green)','var(--blue)','var(--orange)','var(--red)','var(--purple)','var(--primary)'];
const LEVEL_NAMES = ['Нет доступа','Начальный','Стандартный','Ограниченный','Секретный','Совершенно Секретный','Абсолютный'];

export default function HomePage() {
  const { user } = useAuth();

  const shortcuts = [
    { to: '/personnel', icon: '◈', label: 'Персонал', desc: 'База сотрудников' },
    { to: '/factions', icon: '⬢', label: 'Фракции', desc: 'Гражданские и боевые' },
    { to: '/scp', icon: '☢', label: 'Архив SCP', desc: 'Объекты и процедуры' },
    { to: '/documents', icon: '◉', label: 'Документация', desc: 'Приказы и отчёты' },
    { to: '/messages', icon: '▣', label: 'Связь', desc: 'Сообщения' },
  ];

  return (
    <motion.div initial={{opacity:0}} animate={{opacity:1}} transition={{duration:0.3}}>
      <div className="page-header">
        <div>
          <div className="page-title">Добро пожаловать, <span>{user?.callsign}</span></div>
          <div style={{fontSize:12,color:'var(--text-dim)',marginTop:4}}>{user?.fio} · {user?.position} · {user?.fraction}</div>
        </div>
      </div>

      {/* УД карточка */}
      <motion.div className="card" style={{marginBottom:24,borderColor:'rgba(255,215,0,0.2)'}}
        initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} transition={{delay:0.1}}>
        <div style={{display:'flex',alignItems:'center',gap:20,flexWrap:'wrap'}}>
          <div>
            <div style={{fontSize:11,color:'var(--text-dim)',marginBottom:4,textTransform:'uppercase',letterSpacing:1}}>Уровень Допуска</div>
            <div style={{display:'flex',alignItems:'baseline',gap:8}}>
              <span style={{fontFamily:'var(--font-ui)',fontSize:48,fontWeight:700,color:LEVEL_COLORS[user?.clearanceLevel||0],lineHeight:1}}>
                {user?.clearanceLevel || 0}
              </span>
              <span style={{fontFamily:'var(--font-ui)',fontSize:16,color:'var(--text-dim)'}}>
                {LEVEL_NAMES[user?.clearanceLevel||0]}
              </span>
            </div>
          </div>
          {user?.clearanceExtensions?.length > 0 && (
            <div>
              <div style={{fontSize:11,color:'var(--text-dim)',marginBottom:6,textTransform:'uppercase',letterSpacing:1}}>Расширения</div>
              <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
                {user.clearanceExtensions.map(ext => (
                  <span key={ext} className="badge badge-ud" title={EXTENSIONS_INFO[ext]||ext}>{ext}</span>
                ))}
              </div>
            </div>
          )}
          <div style={{marginLeft:'auto',textAlign:'right'}}>
            <div style={{fontSize:11,color:'var(--text-dim)',marginBottom:4}}>Статус</div>
            <span className={`badge badge-${user?.personnelStatus||'active'}`}>
              {{active:'Активен',inactive:'Неактивен',dead:'Погиб',mia:'Пропал б/в',suspended:'Отстранён',archived:'Архивирован',classified:'Засекречен'}[user?.personnelStatus||'active']}
            </span>
          </div>
        </div>
      </motion.div>

      {/* Быстрый доступ */}
      <div style={{marginBottom:8,fontSize:11,color:'var(--text-dim)',textTransform:'uppercase',letterSpacing:2}}>БЫСТРЫЙ ДОСТУП</div>
      <div className="grid-3" style={{marginBottom:24}}>
        {shortcuts.map((s, i) => (
          <motion.div key={s.to} initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} transition={{delay:0.15+i*0.05}}>
            <Link to={s.to} style={{textDecoration:'none'}}>
              <div className="card" style={{display:'flex',alignItems:'center',gap:14,cursor:'pointer',transition:'border-color 0.15s',borderColor:'var(--border)'}}>
                <span style={{fontSize:24,color:'var(--primary)'}}>{s.icon}</span>
                <div>
                  <div style={{fontFamily:'var(--font-ui)',fontWeight:700,fontSize:14,color:'var(--text)'}}>{s.label}</div>
                  <div style={{fontSize:11,color:'var(--text-dim)',marginTop:2}}>{s.desc}</div>
                </div>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>

      {/* Инфо об аккаунте */}
      <motion.div className="card" initial={{opacity:0}} animate={{opacity:1}} transition={{delay:0.4}}>
        <div className="card-title">◉ ДАННЫЕ СОТРУДНИКА</div>
        <div className="grid-2">
          {[
            ['ФИО', user?.fio],
            ['Позывной', user?.callsign],
            ['Discord', user?.discordNick],
            ['Фракция', user?.fraction],
            ['Тип', user?.fractionType==='combat'?'⚔ Боевая':'◎ Гражданская'],
            ['Должность', user?.position],
            ['ID Сотрудника', user?.employeeId || '—'],
            ['Роль', user?.role],
          ].map(([k, v]) => (
            <div key={k} style={{display:'flex',gap:8,padding:'6px 0',borderBottom:'1px solid rgba(30,42,30,0.4)'}}>
              <span style={{fontSize:11,color:'var(--text-dim)',minWidth:100,textTransform:'uppercase',letterSpacing:0.5}}>{k}</span>
              <span style={{fontSize:13,color:'var(--text)'}}>{v}</span>
            </div>
          ))}
        </div>
        {user?.bio && (
          <div style={{marginTop:16}}>
            <div style={{fontSize:11,color:'var(--text-dim)',marginBottom:6,textTransform:'uppercase',letterSpacing:1}}>Биография</div>
            <div style={{fontSize:13,color:'var(--text)',lineHeight:1.6}}>{user.bio}</div>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
