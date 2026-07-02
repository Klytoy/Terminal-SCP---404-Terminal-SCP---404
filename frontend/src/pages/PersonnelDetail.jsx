import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { Panel, Chip, Btn, Loading, ErrorBanner } from '../components/UI';
import { STATUS_LABELS, STATUS_CHIP_TONE, NOTE_TYPE_LABELS, NOTE_TYPE_TONE } from '../utils/status';

export default function PersonnelDetail() {
  const { id } = useParams();
  const { user: me } = useAuth();
  const [target, setTarget] = useState(null);
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [noteForm, setNoteForm] = useState({ type: 'note', text: '' });
  const [busy, setBusy] = useState(false);

  const canEdit = me && (me.role === 'admin' || me.role === 'superadmin' || me.clearanceExtensions?.includes('АпАИБ'));

  async function load() {
    setLoading(true);
    try {
      const { user } = await api.get(`/users/${id}`);
      setTarget(user);
      try {
        const { notes } = await api.get(`/users/${id}/notes`);
        setNotes(notes || []);
      } catch (e) {
        setNotes([]);
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
  }, [id]);

  async function addNote(e) {
    e.preventDefault();
    if (!noteForm.text.trim()) return;
    setBusy(true);
    setError('');
    try {
      const { notes } = await api.post(`/users/${id}/notes`, noteForm);
      setNotes(notes);
      setNoteForm({ type: 'note', text: '' });
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function removeNote(noteId) {
    try {
      const { notes } = await api.delete(`/users/${id}/notes/${noteId}`);
      setNotes(notes);
    } catch (e) {
      setError(e.message);
    }
  }

  if (loading) return <Loading />;
  if (!target) return <ErrorBanner message="Сотрудник не найден" />;

  return (
    <>
      <ErrorBanner message={error} />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-gutter">
        <div className="lg:col-span-1 space-y-gutter">
          <Panel title="ДОСЬЕ">
            <div className="w-full aspect-square border border-primary bg-surface-container-high flex items-center justify-center mb-4">
              <span className="material-symbols-outlined text-primary text-6xl">badge</span>
            </div>
            <div className="space-y-2 text-sm">
              <div className="text-primary font-bold text-lg uppercase">{target.fio}</div>
              {target.callsign && <div className="text-on-surface-variant">Позывной: «{target.callsign}»</div>}
              <div className="text-on-surface-variant">Фракция: {target.fraction || '—'}</div>
              <div className="text-on-surface-variant">Должность: {target.position || '—'}</div>
              <div className="text-on-surface-variant">ID: {target.employeeId}</div>
              <div className="flex items-center gap-2 pt-2">
                <Chip>УД_{target.clearanceLevel}</Chip>
                <Chip tone={STATUS_CHIP_TONE[target.personnelStatus]}>{STATUS_LABELS[target.personnelStatus]}</Chip>
              </div>
              {target.clearanceExtensions?.length > 0 && (
                <div className="pt-2 flex flex-wrap gap-1">
                  {target.clearanceExtensions.map((ext) => (
                    <Chip key={ext} tone="amber">{ext}</Chip>
                  ))}
                </div>
              )}
              {target.isTwin && <div className="text-xs text-on-surface-variant pt-2 uppercase">⚠ Твинк-аккаунт</div>}
            </div>
          </Panel>
        </div>

        <div className="lg:col-span-2">
          <Panel title="ЛИЧНОЕ ДЕЛО // NOTES_&_VIOLATIONS">
            {canEdit && (
              <form onSubmit={addNote} className="mb-4 space-y-2 border border-outline-variant p-3">
                <div className="flex gap-2 flex-wrap">
                  {['note', 'commendation', 'warning', 'violation'].map((t) => (
                    <button
                      type="button"
                      key={t}
                      onClick={() => setNoteForm({ ...noteForm, type: t })}
                      className={`px-2 py-1 text-[10px] uppercase border ${
                        noteForm.type === t ? 'bg-primary text-on-primary border-primary' : 'border-outline-variant text-on-surface-variant'
                      }`}
                    >
                      {NOTE_TYPE_LABELS[t]}
                    </button>
                  ))}
                </div>
                <textarea
                  className="w-full bg-surface-container-lowest border border-outline-variant p-2 text-sm text-on-surface outline-none focus:border-primary"
                  rows={2}
                  placeholder="Текст записи..."
                  value={noteForm.text}
                  onChange={(e) => setNoteForm({ ...noteForm, text: e.target.value })}
                />
                <Btn type="submit" disabled={busy}>
                  {busy ? 'СОХРАНЕНИЕ...' : 'ДОБАВИТЬ ЗАПИСЬ'}
                </Btn>
              </form>
            )}

            <div className="space-y-2">
              {notes.length === 0 && <p className="text-on-surface-variant text-sm">Записей не найдено.</p>}
              {notes
                .slice()
                .reverse()
                .map((n) => (
                  <div key={n._id} className="border border-outline-variant p-3 flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Chip tone={NOTE_TYPE_TONE[n.type]}>{NOTE_TYPE_LABELS[n.type]}</Chip>
                        <span className="text-[10px] text-on-surface-variant">
                          {n.authorName} · {new Date(n.createdAt).toLocaleString('ru-RU')}
                        </span>
                      </div>
                      <p className="text-sm">{n.text}</p>
                    </div>
                    {me?.role === 'superadmin' && (
                      <button onClick={() => removeNote(n._id)} className="text-error text-xs hover:underline ml-2 shrink-0">
                        удалить
                      </button>
                    )}
                  </div>
                ))}
            </div>
          </Panel>
        </div>
      </div>
    </>
  );
}
