import React, { useEffect, useState } from 'react';
import { api } from '../api/client';
import { Panel, ErrorBanner, Loading, CmdInput } from '../components/UI';

export default function Logs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState({ action: '', objectType: '' });

  async function load(params = {}) {
    setLoading(true);
    setError('');
    try {
      const { logs } = await api.get('/logs', params);
      setLogs(logs || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <>
      <h2 className="font-headline-md text-headline-md text-primary uppercase crt-glow mb-2">Журнал действий (АпАИБ)</h2>
      <ErrorBanner message={error} />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-2">
        <CmdInput
          placeholder="ФИЛЬТР ПО ACTION..."
          value={filter.action}
          onChange={(e) => setFilter({ ...filter, action: e.target.value })}
          onKeyDown={(e) => e.key === 'Enter' && load(filter)}
        />
        <CmdInput
          placeholder="ФИЛЬТР ПО OBJECT_TYPE..."
          value={filter.objectType}
          onChange={(e) => setFilter({ ...filter, objectType: e.target.value })}
          onKeyDown={(e) => e.key === 'Enter' && load(filter)}
        />
      </div>

      {loading ? (
        <Loading />
      ) : (
        <Panel>
          <div className="overflow-x-auto -m-4">
            <table className="w-full text-left border-collapse text-xs font-code-sm">
              <thead>
                <tr className="uppercase text-on-surface-variant border-b border-outline-variant">
                  <th className="p-3">Время</th>
                  <th className="p-3">Пользователь</th>
                  <th className="p-3">Action</th>
                  <th className="p-3">Object</th>
                  <th className="p-3">Детали</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((l) => (
                  <tr key={l._id} className="border-b border-outline-variant hover:bg-surface-variant">
                    <td className="p-3 whitespace-nowrap">{new Date(l.at).toLocaleString('ru-RU')}</td>
                    <td className="p-3 text-primary">{l.userCallsign}</td>
                    <td className="p-3">{l.action}</td>
                    <td className="p-3 text-on-surface-variant">{l.objectType}</td>
                    <td className="p-3 text-on-surface-variant">{l.details}</td>
                  </tr>
                ))}
                {logs.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-4 text-center text-on-surface-variant">
                      Записей не найдено
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Panel>
      )}
    </>
  );
}
