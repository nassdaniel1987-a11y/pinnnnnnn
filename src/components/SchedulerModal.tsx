import { useAppStore } from '../store/appStore';
import { days } from '../config/config';
import { updateNoteInDB } from '../lib/supabaseClient';
import { stripHtml } from '../utils/utils';

interface SchedulerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SchedulerModal = ({ isOpen, onClose }: SchedulerModalProps) => {
  const { localNotes, currentDayIndex } = useAppStore();

  if (!isOpen) return null;

  const sortedNotes = [...localNotes].sort((a, b) => 
    stripHtml(a.name).localeCompare(stripHtml(b.name))
  );

  const handleTimeChange = async (noteId: number, field: 'closedUntil' | 'closeAt', newTime: string) => {
    await updateNoteInDB(noteId, { [field]: newTime || null });
  };

  const handleToggleLock = async (note: any) => {
    const isLocked = note.closedUntil === 'LOCKED';
    await updateNoteInDB(note.id, { closedUntil: isLocked ? null : 'LOCKED' });
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50 p-5 backdrop-blur-sm"
      onClick={onClose}
    >
      <div 
        className="bg-slate-100/95 backdrop-blur-md border border-white/50 shadow-2xl text-gray-800 rounded-2xl p-7 w-full max-w-4xl max-h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6 pb-4 border-b-2 border-gray-200">
          <h3 className="text-2xl font-bold flex items-center gap-3">
            <i className="fas fa-calendar-alt text-blue-600"></i>
            <span>Zettel-Planer für '{days[currentDayIndex]}'</span>
          </h3>
          <button onClick={onClose} className="bg-gray-200 hover:bg-gray-300 text-gray-700 w-10 h-10 rounded-lg text-2xl transition-all">
            &times;
          </button>
        </div>

        <div className="grid grid-cols-[1fr,140px,140px,80px] gap-4 px-4 py-2 bg-blue-500/10 rounded-lg mb-3 font-semibold text-sm text-gray-600 uppercase tracking-wider text-center">
          <div className="text-left">Zettel</div>
          <div><i className="fas fa-door-open mr-2 text-green-500"></i>Öffnet um</div>
          <div><i className="fas fa-door-closed mr-2 text-red-500"></i>Schließt um</div>
          <div>Sperre</div>
        </div>

        <div className="overflow-y-auto flex-1 pr-2">
          {sortedNotes.length > 0 ? (
            sortedNotes.map((note) => {
              const isLocked = note.closedUntil === 'LOCKED';
              const openTimeValue = (note.closedUntil && !isLocked) ? note.closedUntil : '';
              const closeTimeValue = note.closeAt || '';

              return (
                <div key={note.id} className="grid grid-cols-[1fr,140px,140px,80px] gap-4 items-center px-4 py-3 border-b border-gray-200/80 hover:bg-blue-500/5 rounded-md transition-colors">
                  <div className="text-sm font-medium overflow-hidden text-ellipsis whitespace-nowrap text-gray-800" title={stripHtml(note.name)}>
                    {stripHtml(note.name) || 'Unbenannter Zettel'}
                  </div>
                  
                  <div className="flex justify-center">
                      <input type="time" value={openTimeValue} onChange={(e) => handleTimeChange(note.id, 'closedUntil', e.target.value)} disabled={isLocked} className="bg-gray-700 text-gray-200 border-gray-600 rounded px-2 py-1 text-sm"/>
                  </div>

                  <div className="flex justify-center">
                      <input type="time" value={closeTimeValue} onChange={(e) => handleTimeChange(note.id, 'closeAt', e.target.value)} className="bg-gray-700 text-gray-200 border-gray-600 rounded px-2 py-1 text-sm"/>
                  </div>

                  <div className="flex justify-center">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" checked={isLocked} onChange={() => handleToggleLock(note)} className="sr-only peer" />
                      <div className="w-11 h-6 bg-gray-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-500"></div>
                    </label>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center text-gray-500 py-12 text-base">
              <i className="fas fa-inbox text-5xl mb-4 opacity-30 block"></i>
              Für diesen Tag gibt es keine Zettel.
            </div>
          )}
        </div>

        <div className="mt-5 pt-4 border-t-2 border-gray-200 flex items-center justify-center gap-2 text-xs text-gray-500">
          <i className="fas fa-info-circle text-blue-600"></i>
          <p className="m-0">Änderungen werden automatisch gespeichert</p>
        </div>
      </div>
    </div>
  );
};