import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ErrorBanner } from '../components/UI';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ login: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await login(form.login, form.password);
      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-surface-container-lowest relative overflow-hidden">
      <div className="scanlines" />
      <form
        onSubmit={handleSubmit}
        className="relative z-10 w-full max-w-md bg-surface-container-low border-2 border-primary p-8 bracket-corner shadow-[0_0_25px_rgba(0,230,57,0.15)]"
      >
        <h1 className="font-headline-md text-headline-md text-primary uppercase crt-glow mb-1">SITE-81</h1>
        <p className="font-label-caps text-label-caps text-on-surface-variant tracking-widest mb-6">
          TERMINAL_CORE // AUTH_REQUIRED
        </p>

        <ErrorBanner message={error} />

        <div className="mt-4 space-y-4">
          <div>
            <label className="text-[10px] uppercase text-on-surface-variant tracking-widest">Логин / позывной</label>
            <div className="flex items-center border border-outline-variant bg-surface-container-lowest px-3 py-2 mt-1">
              <span className="text-primary font-bold mr-2">&gt;</span>
              <input
                autoFocus
                className="cmd-input"
                value={form.login}
                onChange={(e) => setForm({ ...form, login: e.target.value })}
              />
            </div>
          </div>
          <div>
            <label className="text-[10px] uppercase text-on-surface-variant tracking-widest">Пароль</label>
            <div className="flex items-center border border-outline-variant bg-surface-container-lowest px-3 py-2 mt-1">
              <span className="text-primary font-bold mr-2">&gt;</span>
              <input
                type="password"
                className="cmd-input"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={busy}
          className="w-full mt-6 border-2 border-primary text-primary hover:bg-primary hover:text-on-primary transition-colors p-2 font-label-caps text-label-caps tracking-widest disabled:opacity-40"
        >
          {busy ? 'ПОДКЛЮЧЕНИЕ...' : 'ВОЙТИ В ТЕРМИНАЛ'}
        </button>

        <p className="text-[10px] text-on-surface-variant text-center mt-4 uppercase tracking-widest opacity-60">
          Несанкционированный доступ преследуется по протоколам Фонда
        </p>
      </form>
    </div>
  );
}
