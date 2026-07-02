import React, { useEffect, useState } from 'react';
import { api } from '../api/client';
import { Panel, Chip, Loading } from '../components/UI';

const SPEC_LABELS = {
  'штурм': 'ШТУРМ',
  'зачистка аномалий': 'ЗАЧИСТКА АНОМАЛИЙ',
  'эскорт': 'ЭСКОРТ',
  'разведка': 'РАЗВЕДКА',
  'логистика': 'ЛОГИСТИКА',
  'администрирование': 'АДМИНИСТРИРОВАНИЕ',
  'иное': 'ИНОЕ',
};

export default function Factions() {
  const [factions, setFactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get('/factions')
      .then((d) => setFactions(d.factions || []))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Loading />;

  const combat = factions.filter((f) => f.type === 'combat');
  const civilian = factions.filter((f) => f.type === 'civilian');

  return (
    <>
      <h2 className="font-headline-md text-headline-md text-primary uppercase crt-glow mb-2">Фракции и МОГ-отряды</h2>

      <Panel title="БОЕВЫЕ ОТРЯДЫ (МОГ)">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-gutter">
          {combat.map((f) => (
            <div key={f._id} className="border border-outline-variant p-4 relative bracket-corner">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <div className="text-primary font-bold uppercase">{f.callsignPrefix}</div>
                  <div className="text-on-surface text-sm">{f.name}</div>
                </div>
                <Chip tone={f.status === 'classified' ? 'red' : f.status === 'disbanded' ? 'default' : 'green'}>
                  {f.status === 'active' ? 'ACTIVE' : f.status === 'classified' ? 'CLASSIFIED' : 'DISBANDED'}
                </Chip>
              </div>
              <p className="text-xs text-on-surface-variant mb-3">{f.description}</p>
              <div className="flex justify-between text-[10px] uppercase text-on-surface-variant">
                <span>Профиль: {SPEC_LABELS[f.specialization] || f.specialization}</span>
                <span>Мин. УД: {f.minClearanceLevel}</span>
              </div>
            </div>
          ))}
        </div>
      </Panel>

      <Panel title="ГРАЖДАНСКИЕ ПОДРАЗДЕЛЕНИЯ">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-gutter">
          {civilian.map((f) => (
            <div key={f._id} className="border border-outline-variant p-4">
              <div className="flex justify-between items-start mb-2">
                <div className="text-primary font-bold uppercase">{f.name}</div>
                <Chip>УД_{f.minClearanceLevel}+</Chip>
              </div>
              <p className="text-xs text-on-surface-variant">{f.description}</p>
              {f.leader && <p className="text-[10px] text-on-surface-variant mt-2 uppercase">Руководитель: {f.leader}</p>}
            </div>
          ))}
        </div>
      </Panel>
    </>
  );
}
