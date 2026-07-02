import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../api/client';
import { Panel, Chip, CmdInput, Loading } from '../components/UI';
import { STATUS_LABELS, STATUS_CHIP_TONE } from '../utils/status';

export default function Personnel() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [params, setParams] = useSearchParams();
  const [query, setQuery] = useState(params.get('q') || '');
  const navigate = useNavigate();

  useEffect(() => {
    api
      .get('/users')
      .then((d) => setUsers(d.users || []))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return users;
    return users.filter(
      (u) =>
        u.fio?.toLowerCase().includes(q) ||
        u.callsign?.toLowerCase().includes(q) ||
        u.fraction?.toLowerCase().includes(q) ||
        u.employeeId?.toLowerCase().includes(q)
    );
  }, [users, query]);

  return (
    <>
      <h2 className="font-headline-md text-headline-md text-primary uppercase crt-glow mb-2">Личные дела персонала</h2>
      <CmdInput
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="ПОИСК ПО ФИО / ПОЗЫВНОМУ / ФРАКЦИИ..."
      />

      {loading ? (
        <Loading />
      ) : (
        <Panel>
          <div className="overflow-x-auto -m-4">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="text-[10px] uppercase text-on-surface-variant border-b border-outline-variant">
                  <th className="p-4 font-bold">ФИО / Позывной</th>
                  <th className="p-4 font-bold">Фракция</th>
                  <th className="p-4 font-bold">УД</th>
                  <th className="p-4 font-bold">Статус</th>
                  <th className="p-4 font-bold text-right">ID</th>
                </tr>
              </thead>
              <tbody className="text-sm font-code-sm">
                {filtered.map((u) => (
                  <tr
                    key={u._id}
                    onClick={() => navigate(`/personnel/${u._id}`)}
                    className="border-b border-outline-variant hover:bg-surface-variant transition-colors cursor-pointer"
                  >
                    <td className="p-4 text-primary font-bold">
                      {u.fio}
                      {u.callsign && <span className="text-on-surface-variant font-normal"> «{u.callsign}»</span>}
                    </td>
                    <td className="p-4 text-on-surface-variant">{u.fraction || '—'}</td>
                    <td className="p-4">
                      <Chip>УД_{u.clearanceLevel}</Chip>
                    </td>
                    <td className="p-4">
                      <Chip tone={STATUS_CHIP_TONE[u.personnelStatus] || 'default'}>{STATUS_LABELS[u.personnelStatus] || u.personnelStatus}</Chip>
                    </td>
                    <td className="p-4 text-right text-xs">{u.employeeId}</td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-4 text-on-surface-variant text-center">
                      Совпадений не найдено
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
