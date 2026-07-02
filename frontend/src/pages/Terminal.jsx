import React, { useEffect, useState } from 'react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { Panel, Chip, Btn, Loading, ErrorBanner } from '../components/UI';

export default function Terminal() {
  const { user } = useAuth();
  const [keys, setKeys] = useState([]);
  const [violations, setViolations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [openDocs, setOpenDocs] = useState({});

  const isPrivileged = user?.role === 'admin' || user?.role === 'superadmin' || user?.clearanceExtensions?.includes('АпАИБ');

  async function load() {
    setLoading(true);
    setError('');
    try {
      const path = isPrivileged ? '/terminal/keys/all' : '/terminal/keys';
      const { keys } = await api.get(path);
      setKeys(keys || []);
      if (isPrivileged) {
        const { keys: v } = await api.get('/terminal/violations');
        setViolations(v || []);
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPrivileged]);

  async function steal(keyId) {
    setError('');
    try {
      await api.post(`/terminal/keys/${keyId}/steal`);
      load();
    } catch (e) {
      setError(e.message);
    }
  }

  async function access(keyId) {
    setError('');
    try {
      const { documents } = await api.post(`/terminal/keys/${keyId}/access`);
      setOpenDocs((prev) => ({ ...prev, [keyId]: documents }));
    } catch (e) {
      setError(e.message);
    }
  }

  async function revoke(keyId) {
    setError('');
    try {
      await api.post(`/terminal/keys/${keyId}/revoke`);
      load();
    } catch (e) {
      setError(e.message);
    }
  }

  if (loading) return <Loading />;

  return (
    <>
      <h2 className="font-headline-md text-headline-md text-primary uppercase crt-glow mb-2">Терминальные ключи доступа</h2>
      <ErrorBanner message={error} />

      <Panel title={isPrivileged ? 'ВСЕ КЛЮЧИ ФРАКЦИЙ' : 'КЛЮЧИ ВАШЕЙ ФРАКЦИИ'}>
        <div className="space-y-3">
          {keys.map((k) => (
            <div key={k._id} className="border border-outline-variant p-4">
              <div className="flex flex-wrap justify-between items-center gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-primary font-bold font-code-sm">{k.code}</span>
                  <span className="text-on-surface-variant text-xs">— {k.ownerFraction}</span>
                  {k.isCompromised && <Chip tone="red">КОМПРОМЕТИРОВАН</Chip>}
                </div>
                <div className="flex gap-2">
                  <Btn variant="ghost" onClick={() => access(k._id)}>
                    ОТКРЫТЬ_ДОКУМЕНТЫ
                  </Btn>
                  {user?.clearanceExtensions?.includes('СО') && (
                    <Btn variant="secondary" onClick={() => steal(k._id)}>
                      УКРАСТЬ
                    </Btn>
                  )}
                  {isPrivileged && k.isCompromised && (
                    <Btn variant="error" onClick={() => revoke(k._id)}>
                      ОТОЗВАТЬ
                    </Btn>
                  )}
                </div>
              </div>
              <div className="text-[10px] text-on-surface-variant uppercase">
                Держатели: {k.holders?.map((h) => h.callsign || h.fio).join(', ') || '—'}
              </div>
              {openDocs[k._id] && (
                <div className="mt-3 border-t border-outline-variant pt-2 space-y-1">
                  {openDocs[k._id].length === 0 && <p className="text-xs text-on-surface-variant">Документы не найдены.</p>}
                  {openDocs[k._id].map((d) => (
                    <div key={d._id} className="text-xs text-on-surface-variant flex justify-between">
                      <span className="text-primary">{d.title}</span>
                      <span>{d.category}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
          {keys.length === 0 && <p className="text-on-surface-variant text-sm">Ключи не найдены.</p>}
        </div>
      </Panel>

      {isPrivileged && (
        <Panel title="⚠ РАССЛЕДОВАНИЯ АпАИБ: СКОМПРОМЕТИРОВАННЫЕ КЛЮЧИ">
          <div className="space-y-2">
            {violations.length === 0 && <p className="text-on-surface-variant text-sm">Нарушений не зафиксировано.</p>}
            {violations.map((v) => (
              <div key={v._id} className="border border-error/50 p-3 text-sm">
                <div className="text-error font-bold">{v.code}</div>
                <div className="text-xs text-on-surface-variant">
                  Похищен: {v.stolenBy?.callsign || v.stolenBy?.fio || '—'} · {v.stolenAt ? new Date(v.stolenAt).toLocaleString('ru-RU') : '—'}
                </div>
              </div>
            ))}
          </div>
        </Panel>
      )}
    </>
  );
}
