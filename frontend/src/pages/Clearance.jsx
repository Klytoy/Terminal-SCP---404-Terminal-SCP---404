import React, { useEffect, useState } from 'react';
import { api } from '../api/client';
import { Panel, Loading } from '../components/UI';

export default function Clearance() {
  const [levels, setLevels] = useState([]);
  const [extensions, setExtensions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get('/clearance/reference')
      .then((d) => {
        setLevels(d.levels || []);
        setExtensions(d.extensions || []);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Loading />;

  return (
    <>
      <h2 className="font-headline-md text-headline-md text-primary uppercase crt-glow mb-2">Допуски и расширения</h2>

      <Panel title="УРОВНИ ДОПУСКА (0–6)">
        <div className="space-y-2">
          {levels.map((l) => (
            <div key={l.level} className="border border-outline-variant p-3 flex items-start gap-4">
              <div className="text-primary font-bold text-xl w-10 shrink-0">{l.level}</div>
              <div>
                <div className="text-on-surface font-bold uppercase text-sm">{l.name}</div>
                <div className="text-on-surface-variant text-xs mt-1">{l.description}</div>
              </div>
            </div>
          ))}
        </div>
      </Panel>

      <Panel title="РАСШИРЕНИЯ ДОПУСКА">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {extensions.map((ext) => (
            <div key={ext.code} className="border border-outline-variant p-3">
              <div className="flex items-baseline gap-2">
                <span className="text-primary font-bold font-code-sm">{ext.code}</span>
                <span className="text-on-surface text-sm">{ext.fullName}</span>
              </div>
              <p className="text-on-surface-variant text-xs mt-1">{ext.description}</p>
            </div>
          ))}
        </div>
      </Panel>
    </>
  );
}
