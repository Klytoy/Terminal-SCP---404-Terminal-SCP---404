import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { AnimatedPage } from '../components/Animated';
import axios from 'axios';

const API = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
const h = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });

export default function TerminalPage() {
  const { user } = useAuth();
  const [lines, setLines] = useState([]);
  const [input, setInput] = useState('');
  const [keys, setKeys] = useState([]);
  const [allKeys, setAllKeys] = useState([]);
  const bottomRef = useRef(null);
  const isAdmin = ['superadmin', 'admin'].includes(user?.role);
  const isSO = user?.clearanceExtensions?.includes('СО');
  const isApaib = user?.clearanceExtensions?.includes('АпАИБ');

  const print = (text, color = 'var(--text)') => {
    setLines(p => [...p, { text, color, ts: Date.now() + Math.random() }]);
  };

  useEffect(() => {
    print('╔══════════════════════════════════════════╗', 'var(--accent)');
    print('║   ТЕРМИНАЛ ФОНДА SCP · ВЕРСИЯ 4.0        ║', 'var(--accent)');
    print('║   ДОСТУП АВТОРИЗОВАН                     ║', 'var(--accent)');
    print('╚══════════════════════════════════════════╝', 'var(--accent)');
    print('');
    print(`Добро пожаловать, ${user?.callsign}. УД-${user?.clearanceLevel}`, 'var(--green)');
    print('Введите HELP для списка команд.', 'var(--text-dim)');
    print('');
    loadKeys();
  }, []);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [lines]);

  const loadKeys = async () => {
    try {
      const r = await axios.get(`${API}/terminal/keys`, h());
      setKeys(r.data);
      if (isApaib || isAdmin) {
        const r2 = await axios.get(`${API}/terminal/keys/all`, h());
        setAllKeys(r2.data);
      }
    } catch (e) {}
  };

  const handleCommand = async (cmd) => {
    const parts = cmd.trim().split(' ');
    const command = parts[0].toUpperCase();
    print(`> ${cmd}`, 'var(--text-dim)');

    switch (command) {
      case 'HELP':
        print('ДОСТУПНЫЕ КОМАНДЫ:', 'var(--accent)');
        print('  HELP              — список команд');
        print('  KEYS              — ваши ключи доступа');
        print('  ACCESS <key_code> — получить доступ по ключу');
        print('  STATUS            — ваш статус в системе');
        if (isSO) print('  STEAL <key_code>  — [СО] получить ключ внедрения', 'var(--orange)');
        if (isApaib || isAdmin) {
          print('  ALLKEYS           — [АпАИБ] все ключи в системе', 'var(--purple)');
          print('  VIOLATIONS        — [АпАИБ] нарушители', 'var(--red)');
        }
        if (isAdmin) print('  CREATEKEY <code> <name> <fraction> — создать ключ', 'var(--yellow)');
        print('  CLEAR             — очистить терминал');
        break;

      case 'STATUS':
        print('');
        print('═══ СТАТУС СОТРУДНИКА ═══', 'var(--accent)');
        print(`  Позывной:  ${user?.callsign}`);
        print(`  ФИО:       ${user?.fio}`);
        print(`  Фракция:   ${user?.fraction}`);
        print(`  Должность: ${user?.position}`);
        print(`  УД:        УД-${user?.clearanceLevel}`, 'var(--green)');
        if (user?.clearanceExtensions?.length > 0)
          print(`  Расш.:     [${user.clearanceExtensions.join('] [')}]`, 'var(--yellow)');
        print(`  Баланс:    ₽${user?.balance || 0}`, 'var(--yellow)');
        break;

      case 'KEYS':
        if (keys.length === 0) {
          print('Ключи доступа не обнаружены.', 'var(--text-dim)');
        } else {
          print('═══ ВАШИ КЛЮЧИ ДОСТУПА ═══', 'var(--accent)');
          keys.forEach(k => {
            print(`  [${k.keyCode}] ${k.name}`, k.isCompromised ? 'var(--red)' : 'var(--green)');
            print(`         Фракция: ${k.ownerFraction} · Уровень: УД-${k.accessLevel}`, 'var(--text-dim)');
          });
        }
        break;

      case 'ACCESS':
        if (!parts[1]) { print('Укажите код ключа. Пример: ACCESS KEY-001', 'var(--red)'); break; }
        try {
          const key = keys.find(k => k.keyCode.toUpperCase() === parts[1].toUpperCase());
          if (!key) { print(`Ключ ${parts[1]} не найден или у вас нет доступа.`, 'var(--red)'); break; }
          const r = await axios.post(`${API}/terminal/keys/${key._id}/access`, {}, h());
          print(`✓ Ключ [${key.keyCode}] активирован. Доступ открыт.`, 'var(--green)');
          print(`  Доступных документов: ${r.data.documents.length}`, 'var(--accent)');
          r.data.documents.forEach(d => print(`  · [УД-${d.clearanceLevel}] ${d.title}`, 'var(--text-dim)'));
        } catch (e) { print(e.response?.data?.message || 'Ошибка доступа', 'var(--red)'); }
        break;

      case 'STEAL':
        if (!isSO && !isAdmin) { print('ОТКАЗАНО. Команда доступна только СО.', 'var(--red)'); break; }
        if (!parts[1]) { print('Укажите код ключа.', 'var(--red)'); break; }
        try {
          const all = await axios.get(`${API}/terminal/keys/all`, h());
          const target = all.data.find(k => k.keyCode.toUpperCase() === parts[1].toUpperCase());
          if (!target) { print(`Ключ ${parts[1]} не найден в системе.`, 'var(--red)'); break; }
          await axios.post(`${API}/terminal/keys/${target._id}/steal`, {}, h());
          print(`✓ Ключ [${target.keyCode}] получен. Внедрение успешно.`, 'var(--orange)');
          print(`  Фракция-владелец: ${target.ownerFraction}`, 'var(--text-dim)');
          loadKeys();
        } catch (e) { print(e.response?.data?.message || 'Ошибка', 'var(--red)'); }
        break;

      case 'ALLKEYS':
        if (!isApaib && !isAdmin) { print('ОТКАЗАНО.', 'var(--red)'); break; }
        print('═══ ВСЕ КЛЮЧИ В СИСТЕМЕ ═══', 'var(--purple)');
        allKeys.forEach(k => {
          const status = k.isCompromised ? '⚠ СКОМПРОМЕТИРОВАН' : '✓ АКТИВЕН';
          const color = k.isCompromised ? 'var(--red)' : 'var(--green)';
          print(`  [${k.keyCode}] ${k.name} — ${k.ownerFraction}`, color);
          print(`         Статус: ${status} · Носителей: ${k.holders.length}`, 'var(--text-dim)');
        });
        break;

      case 'VIOLATIONS':
        if (!isApaib && !isAdmin) { print('ОТКАЗАНО.', 'var(--red)'); break; }
        try {
          const r = await axios.get(`${API}/terminal/violations`, h());
          if (r.data.length === 0) { print('Нарушителей не обнаружено.', 'var(--green)'); break; }
          print('═══ НАРУШИТЕЛИ ═══', 'var(--red)');
          r.data.forEach(k => {
            print(`  Ключ: [${k.keyCode}] ${k.name}`, 'var(--red)');
            if (k.compromisedBy) print(`  Похитил: ${k.compromisedBy.callsign} (${k.compromisedBy.fraction})`, 'var(--orange)');
          });
        } catch (e) { print('Ошибка запроса.', 'var(--red)'); }
        break;

      case 'CREATEKEY':
        if (!isAdmin) { print('ОТКАЗАНО.', 'var(--red)'); break; }
        if (parts.length < 4) { print('Формат: CREATEKEY <код> <название> <фракция>', 'var(--red)'); break; }
        try {
          await axios.post(`${API}/terminal/keys`, { keyCode: parts[1], name: parts[2], ownerFraction: parts.slice(3).join(' ') }, h());
          print(`✓ Ключ [${parts[1]}] создан.`, 'var(--green)');
          loadKeys();
        } catch (e) { print(e.response?.data?.message || 'Ошибка', 'var(--red)'); }
        break;

      case 'CLEAR':
        setLines([]);
        break;

      default:
        print(`Неизвестная команда: ${command}. Введите HELP.`, 'var(--red)');
    }
    print('');
  };

  const onKeyDown = (e) => {
    if (e.key === 'Enter' && input.trim()) {
      handleCommand(input);
      setInput('');
    }
  };

  return (
    <AnimatedPage>
      <div className="page">
        <div className="page-title">▶ ТЕРМИНАЛ ДОСТУПА</div>
        <div style={{ background: '#050508', border: '1px solid var(--border)', borderRadius: 8, padding: '16px', fontFamily: 'var(--font-mono)', fontSize: 13, height: 'calc(100vh - 200px)', display: 'flex', flexDirection: 'column' }}>
          <div style={{ flex: 1, overflowY: 'auto', marginBottom: 12 }}>
            {lines.map(l => (
              <div key={l.ts} style={{ color: l.color, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{l.text}</div>
            ))}
            <div ref={bottomRef} />
          </div>
          <div style={{ display: 'flex', gap: 8, borderTop: '1px solid var(--border)', paddingTop: 12 }}>
            <span style={{ color: 'var(--accent)' }}>{'>'}</span>
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={onKeyDown}
              style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: 'var(--text)', fontFamily: 'var(--font-mono)', fontSize: 13 }}
              placeholder="Введите команду..."
              autoFocus
            />
          </div>
        </div>
      </div>
    </AnimatedPage>
  );
}
