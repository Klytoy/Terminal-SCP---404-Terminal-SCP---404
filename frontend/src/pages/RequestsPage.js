import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { requestClearance } from '../utils/api';

export default function RequestsPage() {
  const { user } = useAuth();
  const [form, setForm] = useState({ requestedLevel: user?.clearanceLevel + 1 || 1, reason: '', extensions: '' });
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMsg(''); setError('');
    try {
      await requestClearance({
        requestedLevel: parseInt(form.requestedLevel),
        requestedExtensions: form.extensions ? form.extensions.split(',').map(s => s.trim()).filter(Boolean) : [],
        reason: form.reason
      });
      setMsg('Запрос отправлен. Ожидайте решения администрации.');
    } catch (e) {
      setError(e.response?.data?.message || 'Ошибка');
    }
  };

  return (
    <div className="page">
      <div className="page-title">ЗАПРОСЫ</div>

      <div className="alert alert-info" style={{ marginBottom: 24 }}>
        Здесь вы можете запросить повышение уровня допуска или предоставление расширений.
        Запросы на доступ к конкретным документам доступны прямо на странице документации (нажмите на заблокированный документ).
      </div>

      <div style={{ maxWidth: 480 }}>
        <div className="card">
          <div className="card-title">ЗАПРОС НА ПОВЫШЕНИЕ УД</div>

          <div style={{ marginBottom: 16, padding: '12px 16px', background: 'var(--bg3)', borderRadius: 4, border: '1px solid var(--border)' }}>
            <span className="id-card-label">ТЕКУЩИЙ УД: </span>
            <span className={`cl-${user?.clearanceLevel}`} style={{ fontFamily: 'var(--font-head)', fontWeight: 900, fontSize: 20 }}>
              {user?.clearanceLevel}
            </span>
          </div>

          {msg && <div className="alert alert-success">{msg}</div>}
          {error && <div className="alert alert-error">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Запрашиваемый уровень допуска</label>
              <select className="form-select" value={form.requestedLevel} onChange={e => setForm(p => ({...p, requestedLevel: e.target.value}))}>
                {[1,2,3,4,5,6].filter(l => l > user?.clearanceLevel).map(l => (
                  <option key={l} value={l}>УД-{l}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Запрашиваемые расширения (через запятую, необязательно)</label>
              <input className="form-input" value={form.extensions} onChange={e => setForm(p => ({...p, extensions: e.target.value}))} placeholder="ET, M, R4..." />
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-dim)', marginTop: 4 }}>
                Доступные: A, M, SI, I, T, O, H, P, ET, S, R4, T4, O5
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Обоснование запроса *</label>
              <textarea className="form-textarea" value={form.reason} onChange={e => setForm(p => ({...p, reason: e.target.value}))} required rows={4} placeholder="Опишите причину необходимости повышения УД..." />
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
              ОТПРАВИТЬ ЗАПРОС
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
