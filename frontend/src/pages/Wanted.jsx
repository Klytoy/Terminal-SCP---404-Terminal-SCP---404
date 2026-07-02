import React, { useEffect, useState } from 'react';
import { api } from '../api/client';
import { Panel, Chip, Loading } from '../components/UI';

const DANGER_TONE = { 'низкий': 'default', 'средний': 'amber', 'высокий': 'red', 'критический': 'red' };

export default function Wanted() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get('/wanted')
      .then((d) => setList(d.wanted || []))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Loading />;

  return (
    <>
      <h2 className="font-headline-md text-headline-md text-primary uppercase crt-glow mb-2">Розыск</h2>
      <Panel>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-gutter">
          {list.map((w) => (
            <div key={w._id} className="border border-outline-variant p-4 relative">
              {w.nrpVisibility && <span className="absolute top-2 right-2 text-[9px] text-secondary uppercase">НРП</span>}
              <div className="flex justify-between items-start mb-2">
                <div className="text-primary font-bold uppercase">{w.fio}</div>
                <Chip tone={DANGER_TONE[w.dangerLevel] || 'default'}>{w.dangerLevel}</Chip>
              </div>
              {w.aliases?.length > 0 && (
                <div className="text-[10px] text-on-surface-variant mb-1">Псевдонимы: {w.aliases.join(', ')}</div>
              )}
              <p className="text-xs text-on-surface-variant mb-2">{w.description}</p>
              <div className="text-[10px] text-on-surface-variant uppercase flex justify-between">
                <span>Статус: {w.status}</span>
                <span>{w.lastSeen}</span>
              </div>
            </div>
          ))}
          {list.length === 0 && <p className="text-on-surface-variant text-sm">Записей в розыске нет.</p>}
        </div>
      </Panel>
    </>
  );
}
