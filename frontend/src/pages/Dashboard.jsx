import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import { Panel, Chip, Loading } from '../components/UI';
import { OBJECT_CLASS_TONE } from '../utils/status';

const BOOT_LINES = [
  '[ OK ] INITIALIZING CORE_KERNEL v4.2.0...',
  '[ OK ] MOUNTING ENCRYPTED_VOLUMES...',
  '[ OK ] ESTABLISHING NEURAL_LINK...',
];

const PHRASES = [
  '> SCANNING SITE-81 PERIMETER...',
  '> DATA INTEGRITY CHECK: 100%',
  '[ INFO ] O5-COUNCIL OVERRIDE ENABLED',
  '> UPDATING CONTAINMENT_CELL_12_PARAMETERS...',
  '[ OK ] RE-ENCRYPTING LOCAL_CACHE...',
  '> ATTEMPTING HANDSHAKE WITH RAISA...',
];

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lines, setLines] = useState(BOOT_LINES);

  useEffect(() => {
    api
      .get('/documents')
      .then((d) => setDocs(d.documents || []))
      .catch(() => setDocs([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    let i = 0;
    const t = setInterval(() => {
      setLines((prev) => {
        const next = [...prev, PHRASES[i % PHRASES.length]];
        i += 1;
        return next.length > 12 ? next.slice(next.length - 12) : next;
      });
    }, 4000);
    return () => clearInterval(t);
  }, []);

  function handleSearch(e) {
    if (e.key === 'Enter' && query.trim()) {
      navigate(`/personnel?q=${encodeURIComponent(query.trim())}`);
    }
  }

  return (
    <>
      {/* Background decoration */}
      <div className="classified-stamp top-24 right-10 text-6xl hidden lg:block">CLASSIFIED</div>
      <div className="classified-stamp bottom-24 left-20 text-4xl opacity-10 hidden lg:block">TOP SECRET</div>

      {/* Search */}
      <section className="relative bg-surface-container-low border-2 border-outline-variant p-6 bracket-corner">
        <div className="flex items-center space-x-4">
          <span className="text-primary font-bold text-2xl crt-glow">&gt;</span>
          <input
            className="flex-1 bg-transparent border-none focus:ring-0 text-primary-fixed-dim font-headline-md placeholder:text-outline-variant uppercase blinking-cursor outline-none"
            placeholder="SEARCH DATABASE (OBJECT_ID / KEYWORD)..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleSearch}
          />
        </div>
      </section>

      {/* Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter">
        <div className="lg:col-span-4 flex flex-col space-y-gutter">
          <div className="bg-surface-container-low border border-outline-variant p-4 relative overflow-hidden h-full">
            <div className="flex justify-between items-start mb-4">
              <h3 className="font-label-caps text-label-caps tracking-widest text-on-surface-variant">CONTAINMENT_STATUS</h3>
              <span className="material-symbols-outlined text-primary">verified_user</span>
            </div>
            <div className="text-center py-6">
              <div className="text-primary font-bold text-4xl mb-2 crt-glow">GREEN</div>
              <div className="text-xs text-on-surface-variant tracking-widest uppercase">SITE_STABLE // NO_BREACH_DETECTED</div>
            </div>
            <div className="w-full bg-outline-variant h-1 mt-4">
              <div className="bg-primary h-full w-[100%] shadow-[0_0_8px_#00e639]" />
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2 text-[10px] text-on-surface-variant">
              <div className="border border-outline-variant p-2">SENSORS: 100%</div>
              <div className="border border-outline-variant p-2">GUARDS: ACTIVE</div>
            </div>
          </div>

          <div className="bg-surface-container-low border border-outline-variant p-4 flex items-center space-x-4">
            <div className="w-16 h-16 border border-primary relative bg-surface-container-high flex items-center justify-center">
              <span className="material-symbols-outlined text-primary text-3xl">badge</span>
            </div>
            <div>
              <div className="font-bold text-primary text-sm uppercase">Auth_User: {user?.callsign || user?.fio}</div>
              <div className="text-[10px] text-on-surface-variant uppercase">DEPT: {user?.fraction || '—'}</div>
              <div className="text-[10px] text-primary mt-1">УД: {user?.clearanceLevel ?? 0}</div>
            </div>
          </div>
        </div>

        {/* System health log */}
        <div className="lg:col-span-8 bg-surface-container-lowest border border-outline-variant relative overflow-hidden flex flex-col min-h-[400px]">
          <div className="bg-surface-container-high px-4 py-1 border-b border-outline-variant flex justify-between items-center">
            <span className="font-label-caps text-label-caps text-on-surface-variant">SYSTEM_HEALTH_LOGS</span>
            <div className="flex space-x-1">
              <div className="w-2 h-2 rounded-full bg-primary/20" />
              <div className="w-2 h-2 rounded-full bg-primary/20" />
              <div className="w-2 h-2 rounded-full bg-primary" />
            </div>
          </div>
          <div className="flex-1 p-4 font-code-sm text-code-sm text-primary-fixed-dim terminal-scroll overflow-y-auto leading-relaxed">
            {lines.map((l, i) => (
              <p key={i} className={l.startsWith('>') ? '' : ''}>
                {l}
              </p>
            ))}
            <p className="text-on-surface-variant opacity-50">------------------------------------------</p>
            <p>&gt; SITE_81 NETWORK STATUS: NOMINAL</p>
            <p>&gt; SCRANTON_LATCH_STABILITY: 99.82%</p>
            <p>&gt; COGNITOHAZARD_FILTER: ACTIVE</p>
            <p className="blinking-cursor">&gt;</p>
          </div>
        </div>

        {/* Recent documents */}
        <div className="lg:col-span-12">
          <Panel title="RECENTLY_ACCESSED_FILES">
            {loading ? (
              <Loading />
            ) : docs.length === 0 ? (
              <p className="text-on-surface-variant text-sm">Нет доступных документов для вашего уровня допуска.</p>
            ) : (
              <div className="overflow-x-auto -m-4">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="text-[10px] uppercase text-on-surface-variant border-b border-outline-variant">
                      <th className="p-4 font-bold">File_ID</th>
                      <th className="p-4 font-bold">Class</th>
                      <th className="p-4 font-bold">Категория</th>
                      <th className="p-4 font-bold text-right">Обновлено</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm font-code-sm">
                    {docs.slice(0, 8).map((d) => (
                      <tr key={d._id} className="border-b border-outline-variant hover:bg-surface-variant transition-colors cursor-pointer">
                        <td className="p-4 text-primary font-bold">{d.title}</td>
                        <td className="p-4">
                          {d.objectClass ? <Chip tone={OBJECT_CLASS_TONE[d.objectClass] || 'default'}>[{d.objectClass}]</Chip> : <span className="text-on-surface-variant text-xs">—</span>}
                        </td>
                        <td className="p-4 text-on-surface-variant">{d.category}</td>
                        <td className="p-4 text-right text-xs">{new Date(d.createdAt).toLocaleString('ru-RU')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Panel>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-gutter pt-4 pb-8">
        <div className="space-y-2">
          <div className="text-[10px] uppercase text-on-surface-variant">CPU_LOAD</div>
          <div className="text-primary font-bold text-sm">[████░░░░░░] 42%</div>
        </div>
        <div className="space-y-2">
          <div className="text-[10px] uppercase text-on-surface-variant">MEM_BUFFER</div>
          <div className="text-primary font-bold text-sm">[███████░░░] 78%</div>
        </div>
        <div className="space-y-2">
          <div className="text-[10px] uppercase text-on-surface-variant">UPLINK_SPEED</div>
          <div className="text-primary font-bold text-sm">1.2 GB/S</div>
        </div>
        <div className="space-y-2">
          <div className="text-[10px] uppercase text-on-surface-variant">ENCRYPTION</div>
          <div className="text-primary font-bold text-sm">QUANTUM_AES_2048</div>
        </div>
      </div>
    </>
  );
}
