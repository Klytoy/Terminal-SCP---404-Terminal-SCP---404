import React, { useEffect, useState } from 'react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { Panel, Chip, Btn, Loading, ErrorBanner } from '../components/UI';

const CATEGORY_LABELS = { info: 'ИНФОРМАЦИЯ', access: 'ДОСТУП', item: 'ПРЕДМЕТ', service: 'УСЛУГА', key: 'КЛЮЧ', other: 'ПРОЧЕЕ' };

export default function BlackMarket() {
  const { user, refresh } = useAuth();
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ title: '', description: '', category: 'info', price: 0, minClearance: 0, anonymous: false });

  async function load() {
    setLoading(true);
    try {
      const { listings } = await api.get('/blackmarket');
      setListings(listings || []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function createListing(e) {
    e.preventDefault();
    setError('');
    try {
      await api.post('/blackmarket', form);
      setForm({ title: '', description: '', category: 'info', price: 0, minClearance: 0, anonymous: false });
      load();
    } catch (e) {
      setError(e.message);
    }
  }

  async function buy(id) {
    setError('');
    try {
      await api.post(`/blackmarket/${id}/buy`);
      load();
      refresh();
    } catch (e) {
      setError(e.message);
    }
  }

  if (loading) return <Loading />;

  return (
    <>
      <h2 className="font-headline-md text-headline-md text-primary uppercase crt-glow mb-2">Чёрный рынок</h2>
      <ErrorBanner message={error} />

      <div className="text-xs text-on-surface-variant mb-2">Баланс: <span className="text-primary font-bold">{user?.balance ?? 0}</span> кредитов</div>

      <Panel title="СОЗДАТЬ ЛОТ">
        <form onSubmit={createListing} className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <input
            className="bg-surface-container-lowest border border-outline-variant p-2 text-sm outline-none focus:border-primary"
            placeholder="Название лота"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
          />
          <select
            className="bg-surface-container-lowest border border-outline-variant p-2 text-sm outline-none focus:border-primary"
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
          >
            {Object.entries(CATEGORY_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
          <input
            type="number"
            className="bg-surface-container-lowest border border-outline-variant p-2 text-sm outline-none focus:border-primary"
            placeholder="Цена"
            value={form.price}
            onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
          />
          <input
            type="number"
            min={0}
            max={6}
            className="bg-surface-container-lowest border border-outline-variant p-2 text-sm outline-none focus:border-primary"
            placeholder="Мин. УД"
            value={form.minClearance}
            onChange={(e) => setForm({ ...form, minClearance: Number(e.target.value) })}
          />
          <textarea
            className="md:col-span-2 bg-surface-container-lowest border border-outline-variant p-2 text-sm outline-none focus:border-primary"
            placeholder="Описание"
            rows={2}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
          <label className="flex items-center gap-2 text-xs text-on-surface-variant">
            <input type="checkbox" checked={form.anonymous} onChange={(e) => setForm({ ...form, anonymous: e.target.checked })} />
            Анонимный продавец
          </label>
          <Btn type="submit">ВЫСТАВИТЬ НА ПРОДАЖУ</Btn>
        </form>
      </Panel>

      <Panel title="АКТИВНЫЕ ЛОТЫ">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-gutter">
          {listings.map((l) => (
            <div key={l._id} className="border border-outline-variant p-4">
              <div className="flex justify-between items-start mb-2">
                <div className="text-primary font-bold uppercase">{l.title}</div>
                <Chip>{CATEGORY_LABELS[l.category]}</Chip>
              </div>
              <p className="text-xs text-on-surface-variant mb-2">{l.description}</p>
              <div className="flex justify-between items-center text-xs">
                <span className="text-on-surface-variant">Продавец: {l.sellerCallsign}</span>
                <span className="text-primary font-bold">{l.price} кредитов</span>
              </div>
              <Btn className="w-full mt-2" onClick={() => buy(l._id)}>
                КУПИТЬ
              </Btn>
            </div>
          ))}
          {listings.length === 0 && <p className="text-on-surface-variant text-sm">Лотов не найдено.</p>}
        </div>
      </Panel>
    </>
  );
}
