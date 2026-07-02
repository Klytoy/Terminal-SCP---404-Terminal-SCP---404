import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { AnimatedPage } from '../components/Animated';
import axios from 'axios';

const API = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
const h = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });

const CATEGORIES = { info: 'ИНФОРМАЦИЯ', access: 'ДОСТУП', item: 'ПРЕДМЕТ', service: 'УСЛУГА', key: 'КЛЮЧ', other: 'ПРОЧЕЕ' };
const CAT_COLORS = { info: 'var(--accent)', access: 'var(--purple)', item: 'var(--yellow)', service: 'var(--green)', key: 'var(--orange)', other: 'var(--text-dim)' };

export default function BlackMarketPage() {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', category: 'other', price: '', minClearance: 0 });
  const [msg, setMsg] = useState('');

  const load = async () => {
    try {
      const r = await axios.get(`${API}/blackmarket`, h());
      setItems(r.data);
    } catch (e) { setMsg('Ошибка загрузки'); }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const create = async () => {
    try {
      await axios.post(`${API}/blackmarket`, { ...form, price: Number(form.price) }, h());
      setShowForm(false);
      setForm({ title: '', description: '', category: 'other', price: '', minClearance: 0 });
      load();
    } catch (e) { setMsg(e.response?.data?.message || 'Ошибка'); }
  };

  const buy = async (id) => {
    if (!window.confirm('Подтвердить покупку?')) return;
    try {
      const r = await axios.post(`${API}/blackmarket/${id}/buy`, {}, h());
      setMsg(`Куплено! Баланс: ₽${r.data.newBalance}`);
      load();
    } catch (e) { setMsg(e.response?.data?.message || 'Ошибка покупки'); }
  };

  const cancel = async (id) => {
    try {
      await axios.delete(`${API}/blackmarket/${id}`, h());
      load();
    } catch (e) { setMsg('Ошибка'); }
  };

  return (
    <AnimatedPage>
      <div className="page">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div className="page-title" style={{ margin: 0 }}>◈ ЧЁРНЫЙ РЫНОК</div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--yellow)' }}>
              БАЛАНС: ₽{user?.balance || 0}
            </div>
            <button className="btn btn-primary btn-sm" onClick={() => setShowForm(!showForm)}>+ РАЗМЕСТИТЬ ЛОТ</button>
          </div>
        </div>

        {msg && <div className="alert alert-error" style={{ marginBottom: 16 }}>{msg}</div>}

        <div className="card" style={{ marginBottom: 16, padding: '12px 16px', background: 'rgba(231,76,60,0.05)', borderColor: 'rgba(231,76,60,0.3)' }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--red)', letterSpacing: 1 }}>
            ⚠ ПРЕДУПРЕЖДЕНИЕ: Данный ресурс работает вне официальных каналов Фонда. Все транзакции анонимны и не отслеживаются официально. Фонд не несёт ответственности за сделки.
          </div>
        </div>

        {showForm && (
          <div className="card" style={{ marginBottom: 20 }}>
            <div className="card-title">РАЗМЕСТИТЬ ЛОТ</div>
            <div className="grid-2" style={{ gap: 12 }}>
              <div className="form-group">
                <label className="form-label">Название</label>
                <input className="form-input" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Категория</label>
                <select className="form-select" value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))}>
                  {Object.entries(CATEGORIES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Цена (₽)</label>
                <input className="form-input" type="number" value={form.price} onChange={e => setForm(p => ({ ...p, price: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Мин. УД для просмотра</label>
                <select className="form-select" value={form.minClearance} onChange={e => setForm(p => ({ ...p, minClearance: e.target.value }))}>
                  {[0,1,2,3,4,5,6].map(l => <option key={l} value={l}>УД-{l}</option>)}
                </select>
              </div>
              <div className="form-group" style={{ gridColumn: '1/-1' }}>
                <label className="form-label">Описание</label>
                <textarea className="form-input" rows={3} value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} style={{ resize: 'vertical' }} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
              <button className="btn btn-primary btn-sm" onClick={create}>РАЗМЕСТИТЬ</button>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowForm(false)}>ОТМЕНА</button>
            </div>
          </div>
        )}

        {loading ? (
          <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>ЗАГРУЗКА ЛОТОВ...</div>
        ) : items.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: 40 }}>
            <div style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-dim)', fontSize: 13 }}>ЛОТЫ ОТСУТСТВУЮТ</div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
            {items.map(item => (
              <div key={item._id} className="card" style={{ display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: CAT_COLORS[item.category], letterSpacing: 1 }}>
                    {CATEGORIES[item.category]}
                  </span>
                  {item.minClearance > 0 && (
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-dim)' }}>УД-{item.minClearance}+</span>
                  )}
                </div>
                <div style={{ fontFamily: 'var(--font-head)', fontSize: 14, color: 'var(--text-bright)', marginBottom: 8, letterSpacing: 1 }}>{item.title}</div>
                {item.description && <div style={{ fontSize: 12, color: 'var(--text-dim)', marginBottom: 12, lineHeight: 1.6, flex: 1 }}>{item.description}</div>}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', paddingTop: 12, borderTop: '1px solid var(--border)' }}>
                  <div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 16, color: 'var(--yellow)', fontWeight: 700 }}>₽{item.price}</div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-dim)' }}>от: {item.sellerCallsign}</div>
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {item.seller === user?._id ? (
                      <button className="btn btn-danger btn-sm" onClick={() => cancel(item._id)}>СНЯТЬ</button>
                    ) : (
                      <button className="btn btn-primary btn-sm" onClick={() => buy(item._id)} disabled={(user?.balance || 0) < item.price}>КУПИТЬ</button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AnimatedPage>
  );
}
