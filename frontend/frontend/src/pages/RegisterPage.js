import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { register } from '../utils/api';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const DEFAULT_FRACTIONS = [
  'SCP Foundation', 'MTF Alpha-1', 'MTF Epsilon-11', 'AMTF Nu-7',
  'Internal Security Department', 'Ethics Committee', 'RAISA',
  'Medical Department', 'Research Department', 'Security Department',
  'Administrative Service', 'O5 Council'
];

export default function RegisterPage() {
  const [factionsList, setFactionsList] = useState(DEFAULT_FRACTIONS);

  useEffect(() => {
    // Try to load factions from DB (no auth needed for names)
    axios.get(`${API_URL}/factions/public`).then(res => {
      const names = res.data.map(f => f.name);
      if (names.length > 0) setFactionsList([...names]);
    }).catch(() => {}); // Fallback to defaults
  }, []);
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    username: '',
    password: '',
    passwordConfirm: '',
    discordNick: '',
    fio: '',
    callsign: '',
    fraction: '',
    fractionCustom: '',
    fractionType: 'civilian',
    position: '',
    clearanceLevel: '1',
    suggestion: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const set = (key, val) => setForm(p => ({ ...p, [key]: val }));

  const validateStep1 = () => {
    if (!form.username || !form.password || !form.discordNick) return 'Заполните все поля';
    if (form.password !== form.passwordConfirm) return 'Пароли не совпадают';
    if (form.password.length < 6) return 'Пароль минимум 6 символов';
    if (!form.discordNick.startsWith('@')) return 'Discord ник должен начинаться с @';
    return null;
  };

  const validateStep2 = () => {
    if (!form.fio || !form.callsign || !form.position) return 'Заполните все поля';
    const fraction = form.fraction === 'Другое' ? form.fractionCustom : form.fraction;
    if (!fraction) return 'Укажите фракцию';
    return null;
  };

  const nextStep = () => {
    const err = step === 1 ? validateStep1() : validateStep2();
    if (err) { setError(err); return; }
    setError('');
    setStep(s => s + 1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const fraction = form.fraction === 'Другое' ? form.fractionCustom : form.fraction;
      await register({
        username: form.username,
        password: form.password,
        discordNick: form.discordNick.startsWith('@') ? form.discordNick : '@' + form.discordNick,
        fio: form.fio,
        callsign: form.callsign,
        fraction,
        fractionType: form.fractionType,
        position: form.position,
        clearanceLevel: parseInt(form.clearanceLevel),
        suggestion: form.suggestion
      });
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Ошибка регистрации');
    } finally {
      setLoading(false);
    }
  };

  if (success) return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div className="card" style={{ maxWidth: 480, textAlign: 'center' }}>
        <div style={{ fontFamily: 'var(--font-head)', fontSize: 32, color: 'var(--green)', marginBottom: 16, textShadow: '0 0 20px rgba(46,204,113,0.5)' }}>✓</div>
        <div className="card-title">ЗАЯВКА ОТПРАВЛЕНА</div>
        <p style={{ color: 'var(--text-dim)', fontFamily: 'var(--font-mono)', fontSize: 13, lineHeight: 1.8 }}>
          Ваша заявка на регистрацию принята.<br/>
          Ожидайте решения суперадмина.<br/>
          После одобрения вы получите доступ к системе.
        </p>
        <button className="btn btn-ghost" onClick={() => navigate('/login')} style={{ marginTop: 20 }}>
          НА СТРАНИЦУ ВХОДА
        </button>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ width: '100%', maxWidth: 520 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontFamily: 'var(--font-head)', fontSize: 24, color: 'var(--accent)', letterSpacing: 4, textShadow: '0 0 20px var(--accent-glow)' }}>
            ЗАПРОС ДОСТУПА
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-dim)', letterSpacing: 2, marginTop: 8 }}>
            АНКЕТА СОТРУДНИКА — ШАГ {step}/3
          </div>
        </div>

        {/* Steps indicator */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
          {[1,2,3].map(s => (
            <div key={s} style={{
              flex: 1, height: 3,
              background: s <= step ? 'var(--accent)' : 'var(--border)',
              borderRadius: 2,
              transition: 'background 0.3s'
            }} />
          ))}
        </div>

        <div className="card">
          {error && <div className="alert alert-error">{error}</div>}

          {step === 1 && (
            <div>
              <div className="card-title">АВТОРИЗАЦИОННЫЕ ДАННЫЕ</div>
              <div className="form-group">
                <label className="form-label">Логин *</label>
                <input className="form-input" value={form.username} onChange={e => set('username', e.target.value)} placeholder="username" />
              </div>
              <div className="form-group">
                <label className="form-label">Пароль * (мин. 6 символов)</label>
                <input type="password" className="form-input" value={form.password} onChange={e => set('password', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Повтор пароля *</label>
                <input type="password" className="form-input" value={form.passwordConfirm} onChange={e => set('passwordConfirm', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Discord ник * (формат: @nickname)</label>
                <input className="form-input" value={form.discordNick} onChange={e => set('discordNick', e.target.value)} placeholder="@ваш_ник" />
              </div>
              <button className="btn btn-primary" onClick={nextStep} style={{ width: '100%' }}>
                ДАЛЕЕ →
              </button>
            </div>
          )}

          {step === 2 && (
            <div>
              <div className="card-title">ЛИЧНЫЕ ДАННЫЕ</div>
              <div className="form-group">
                <label className="form-label">ФИО *</label>
                <input className="form-input" value={form.fio} onChange={e => set('fio', e.target.value)} placeholder="Иванов Иван Иванович" />
              </div>
              <div className="form-group">
                <label className="form-label">Позывной *</label>
                <input className="form-input" value={form.callsign} onChange={e => set('callsign', e.target.value)} placeholder="Ваш позывной" />
              </div>
              <div className="form-group">
                <label className="form-label">Фракция *</label>
                <select className="form-select" value={form.fraction} onChange={e => set('fraction', e.target.value)}>
                  <option value="">Выберите фракцию</option>
                  {[...factionsList, "Другое"].map(f => <option key={f} value={f}>{f}</option>)}
                </select>
              </div>
              {form.fraction === 'Другое' && (
                <div className="form-group">
                  <label className="form-label">Введите название фракции *</label>
                  <input className="form-input" value={form.fractionCustom} onChange={e => set('fractionCustom', e.target.value)} />
                </div>
              )}
              <div className="form-group">
                <label className="form-label">Тип фракции *</label>
                <select className="form-select" value={form.fractionType} onChange={e => set('fractionType', e.target.value)}>
                  <option value="civilian">Гражданская</option>
                  <option value="combat">Боевая</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Должность *</label>
                <input className="form-input" value={form.position} onChange={e => set('position', e.target.value)} placeholder="Ваша должность" />
              </div>
              <div className="form-group">
                <label className="form-label">Уровень допуска (0-6) *</label>
                <select className="form-select" value={form.clearanceLevel} onChange={e => set('clearanceLevel', e.target.value)}>
                  {[0,1,2,3,4,5,6].map(l => <option key={l} value={l}>УД-{l}</option>)}
                </select>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn btn-ghost" onClick={() => setStep(1)} style={{ flex: 1 }}>← НАЗАД</button>
                <button className="btn btn-primary" onClick={nextStep} style={{ flex: 2 }}>ДАЛЕЕ →</button>
              </div>
            </div>
          )}

          {step === 3 && (
            <form onSubmit={handleSubmit}>
              <div className="card-title">ДОПОЛНИТЕЛЬНО</div>
              <div className="form-group">
                <label className="form-label">Предложения по улучшению сайта (необязательно)</label>
                <textarea
                  className="form-textarea"
                  value={form.suggestion}
                  onChange={e => set('suggestion', e.target.value)}
                  placeholder="Ваши предложения..."
                  rows={4}
                />
              </div>
              <div className="alert alert-info" style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>
                Отправляя заявку, вы подтверждаете что являетесь сотрудником Фонда и принимаете внутренний регламент.
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                <button type="button" className="btn btn-ghost" onClick={() => setStep(2)} style={{ flex: 1 }}>← НАЗАД</button>
                <button type="submit" className="btn btn-primary" disabled={loading} style={{ flex: 2 }}>
                  {loading ? 'ОТПРАВКА...' : 'ОТПРАВИТЬ ЗАЯВКУ'}
                </button>
              </div>
            </form>
          )}
        </div>

        <div style={{ marginTop: 16, textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: 12 }}>
          <span style={{ color: 'var(--text-dim)' }}>Уже есть аккаунт? </span>
          <Link to="/login" style={{ color: 'var(--accent)', textDecoration: 'none' }}>ВОЙТИ</Link>
        </div>
      </div>
    </div>
  );
}
