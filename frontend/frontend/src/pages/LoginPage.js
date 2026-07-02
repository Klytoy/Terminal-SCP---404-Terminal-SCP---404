import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const [form, setForm] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(form.username, form.password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Ошибка входа');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      {/* Background pattern */}
      <div style={{
        position: 'fixed', inset: 0,
        backgroundImage: `
          radial-gradient(circle at 20% 50%, rgba(0,180,216,0.03) 0%, transparent 50%),
          radial-gradient(circle at 80% 20%, rgba(0,119,182,0.05) 0%, transparent 50%)
        `,
        pointerEvents: 'none'
      }} />

      <div style={{ width: '100%', maxWidth: 420, position: 'relative' }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{
            fontFamily: 'var(--font-head)',
            fontSize: 32,
            color: 'var(--accent)',
            letterSpacing: 6,
            textShadow: '0 0 30px var(--accent-glow)',
            marginBottom: 8
          }}>SCP</div>
          <div style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 11,
            color: 'var(--text-dim)',
            letterSpacing: 4
          }}>SECURE CONTAIN PROTECT</div>
          <div style={{
            width: 60,
            height: 1,
            background: 'var(--accent)',
            margin: '16px auto',
            opacity: 0.5
          }} />
          <div style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 11,
            color: 'var(--text-dim)',
            letterSpacing: 2
          }}>ВНУТРЕННИЙ ПОРТАЛ ФОНДА</div>
        </div>

        <div className="card">
          <div className="card-title">ИДЕНТИФИКАЦИЯ</div>

          {error && <div className="alert alert-error">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Логин</label>
              <input
                className="form-input"
                value={form.username}
                onChange={e => setForm(p => ({ ...p, username: e.target.value }))}
                required
                autoComplete="username"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Пароль</label>
              <input
                type="password"
                className="form-input"
                value={form.password}
                onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                required
                autoComplete="current-password"
              />
            </div>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
              style={{ width: '100%', marginTop: 8 }}
            >
              {loading ? 'ИДЕНТИФИКАЦИЯ...' : 'ВОЙТИ В СИСТЕМУ'}
            </button>
          </form>

          <div style={{ marginTop: 20, textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: 12 }}>
            <span style={{ color: 'var(--text-dim)' }}>Нет доступа? </span>
            <Link to="/register" style={{ color: 'var(--accent)', textDecoration: 'none' }}>
              ПОДАТЬ ЗАЯВКУ
            </Link>
          </div>
        </div>

        <div style={{ marginTop: 20, textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-dim)', letterSpacing: 1 }}>
          НЕСАНКЦИОНИРОВАННЫЙ ДОСТУП ЗАПРЕЩЁН<br />
          ВСЕ ДЕЙСТВИЯ РЕГИСТРИРУЮТСЯ
        </div>
      </div>
    </div>
  );
}
