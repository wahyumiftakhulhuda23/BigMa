import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { DevProjectItem, DevItemType } from '../../types';
import { 
  X, 
  Bug, 
  Lightbulb, 
  Wrench, 
  Code2, 
  Calendar, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  Terminal, 
  Layers,
  Bell
} from 'lucide-react';

interface ProjectDevModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (item: DevProjectItem) => void;
  editingItem?: DevProjectItem | null;
  defaultType?: DevItemType;
}

export const ProjectDevModal: React.FC<ProjectDevModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingItem,
  defaultType = 'Bug',
}) => {
  const [type, setType] = useState<DevItemType>(defaultType);
  const [title, setTitle] = useState('');
  const [appName, setAppName] = useState('');
  const [severity, setSeverity] = useState<DevProjectItem['severity']>('Sedang');
  const [status, setStatus] = useState<DevProjectItem['status']>('Open');
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('10:00');
  const [description, setDescription] = useState('');
  const [stackOrTech, setStackOrTech] = useState('');
  const [stepsToReproduce, setStepsToReproduce] = useState('');
  const [reminderActive, setReminderActive] = useState(true);

  useEffect(() => {
    if (editingItem) {
      setType(editingItem.type);
      setTitle(editingItem.title);
      setAppName(editingItem.appName || '');
      setSeverity(editingItem.severity);
      setStatus(editingItem.status);
      setScheduledDate(editingItem.scheduledDate || '');
      setScheduledTime(editingItem.scheduledTime || '10:00');
      setDescription(editingItem.description || '');
      setStackOrTech(editingItem.stackOrTech || '');
      setStepsToReproduce(editingItem.stepsToReproduce || '');
      setReminderActive(editingItem.reminderActive ?? true);
    } else {
      setType(defaultType);
      setTitle('');
      setAppName('BigMA Studio Vault');
      setSeverity('Sedang');
      setStatus(defaultType === 'Bug' ? 'Open' : defaultType === 'Ide' ? 'Konsep' : 'Terjadwal');
      const today = new Date().toISOString().split('T')[0];
      setScheduledDate(today);
      setScheduledTime('10:00');
      setDescription('');
      setStackOrTech('React, TypeScript, Tailwind');
      setStepsToReproduce('');
      setReminderActive(true);
    }
  }, [editingItem, defaultType, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const item: DevProjectItem = {
      id: editingItem?.id || `dev-${Date.now()}`,
      title: title.trim(),
      type,
      appName: appName.trim() || 'Aplikasi Developer',
      severity,
      status,
      scheduledDate: scheduledDate || undefined,
      scheduledTime: scheduledTime || undefined,
      description: description.trim(),
      stackOrTech: stackOrTech.trim(),
      stepsToReproduce: type === 'Bug' ? stepsToReproduce.trim() : undefined,
      reminderActive,
      createdAt: editingItem?.createdAt || new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0],
    };

    onSave(item);
    onClose();
  };

  const getTypeColor = (t: DevItemType) => {
    switch (t) {
      case 'Bug':
        return 'text-rose-400 bg-rose-500/10 border-rose-500/30';
      case 'Ide':
        return 'text-amber-400 bg-amber-500/10 border-amber-500/30';
      case 'Maintenance':
        return 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30';
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs select-none"
          onClick={(e) => {
            if (e.target === e.currentTarget) onClose();
          }}
          id="project-dev-modal-overlay"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="bg-neutral-900 rounded-xl max-w-xl w-full shadow-2xl border border-[#262626] overflow-hidden flex flex-col text-[#E5E5E5]"
            id="project-dev-modal-card"
          >
            {/* Header */}
            <div className="p-4 bg-neutral-950 border-b border-[#262626] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={`p-2 rounded-lg border ${getTypeColor(type)}`}>
                  {type === 'Bug' ? <Bug className="w-4 h-4" /> : type === 'Ide' ? <Lightbulb className="w-4 h-4" /> : <Wrench className="w-4 h-4" />}
                </div>
                <div>
                  <h3 className="font-sans font-bold text-base text-white">
                    {editingItem ? 'Edit Project Dev' : 'Tambah Catatan Project Dev'}
                  </h3>
                  <p className="text-xs text-neutral-400">Manajemen Bug, Ide Baru &amp; Maintenance</p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
              {/* Type Switcher */}
              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1.5">Tipe Kategori Dev</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setType('Bug');
                      if (status === 'Konsep' || status === 'Terjadwal') setStatus('Open');
                    }}
                    className={`py-2 px-3 rounded-lg text-xs font-bold border flex items-center justify-center gap-1.5 transition-all ${
                      type === 'Bug'
                        ? 'bg-rose-500/20 text-rose-300 border-rose-500/50 shadow-md ring-1 ring-rose-400/40'
                        : 'bg-neutral-950 border-[#262626] text-neutral-400 hover:text-white'
                    }`}
                  >
                    <Bug className="w-3.5 h-3.5" />
                    <span>1. Bug Report</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setType('Ide');
                      if (status === 'Open' || status === 'Terjadwal') setStatus('Konsep');
                    }}
                    className={`py-2 px-3 rounded-lg text-xs font-bold border flex items-center justify-center gap-1.5 transition-all ${
                      type === 'Ide'
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-md ring-1 ring-amber-400/40'
                        : 'bg-neutral-950 border-[#262626] text-neutral-400 hover:text-white'
                    }`}
                  >
                    <Lightbulb className="w-3.5 h-3.5" />
                    <span>2. Ide &amp; Konsep</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setType('Maintenance');
                      if (status === 'Open' || status === 'Konsep') setStatus('Terjadwal');
                    }}
                    className={`py-2 px-3 rounded-lg text-xs font-bold border flex items-center justify-center gap-1.5 transition-all ${
                      type === 'Maintenance'
                        ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50 shadow-md ring-1 ring-cyan-400/40'
                        : 'bg-neutral-950 border-[#262626] text-neutral-400 hover:text-white'
                    }`}
                  >
                    <Wrench className="w-3.5 h-3.5" />
                    <span>3. Maintenance</span>
                  </button>
                </div>
              </div>

              {/* Title Input */}
              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1">
                  {type === 'Bug' ? 'Judul Kendala / Bug' : type === 'Ide' ? 'Nama Ide / Konsep Fitur' : 'Rencana Maintenance / Perbaikan'} <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={
                    type === 'Bug' 
                      ? 'Misal: Error 500 saat refresh token session' 
                      : type === 'Ide' 
                      ? 'Misal: Fitur ekspor otomatis ke format PDF laporan mingguan' 
                      : 'Misal: Upgrade Node.js ke v22 & update dependensi keamanan'
                  }
                  className="w-full bg-neutral-950 border border-[#262626] focus:border-purple-400 rounded-lg px-3 py-2 text-xs text-white placeholder-neutral-600 focus:outline-none"
                  id="dev-title-input"
                />
              </div>

              {/* App Name & Tech Stack */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1">Nama Aplikasi / Repo</label>
                  <input
                    type="text"
                    value={appName}
                    onChange={(e) => setAppName(e.target.value)}
                    placeholder="Misal: BigMA Vault / Kasir Pro"
                    className="w-full bg-neutral-950 border border-[#262626] focus:border-purple-400 rounded-lg px-3 py-2 text-xs text-white placeholder-neutral-600 focus:outline-none"
                    id="dev-app-name-input"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1">Tech Stack / Komponen</label>
                  <input
                    type="text"
                    value={stackOrTech}
                    onChange={(e) => setStackOrTech(e.target.value)}
                    placeholder="React, TypeScript, Tailwind, API"
                    className="w-full bg-neutral-950 border border-[#262626] focus:border-purple-400 rounded-lg px-3 py-2 text-xs text-white placeholder-neutral-600 focus:outline-none font-mono"
                    id="dev-tech-input"
                  />
                </div>
              </div>

              {/* Priority & Status */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1">Tingkat Urgensi / Severity</label>
                  <select
                    value={severity}
                    onChange={(e) => setSeverity(e.target.value as any)}
                    className="w-full bg-neutral-950 border border-[#262626] focus:border-purple-400 rounded-lg px-3 py-2 text-xs text-white focus:outline-none"
                    id="dev-severity-select"
                  >
                    <option value="Kritis">🔴 Kritis (Blocker / Down)</option>
                    <option value="Tinggi">🟠 Tinggi (Major)</option>
                    <option value="Sedang">🟡 Sedang (Normal)</option>
                    <option value="Rendah">🔵 Rendah (Minor / Trivial)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1">Status Pengerjaan</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="w-full bg-neutral-950 border border-[#262626] focus:border-purple-400 rounded-lg px-3 py-2 text-xs text-white focus:outline-none"
                    id="dev-status-select"
                  >
                    {type === 'Bug' && (
                      <>
                        <option value="Open">Open (Baru Ditemukan)</option>
                        <option value="Investigasi">Investigasi / Debugging</option>
                        <option value="Dikerjakan">Sedang Diperbaiki</option>
                        <option value="Selesai">Fixed / Selesai</option>
                      </>
                    )}
                    {type === 'Ide' && (
                      <>
                        <option value="Konsep">Konsep / Ide Awal</option>
                        <option value="Investigasi">Riset &amp; Wireframe</option>
                        <option value="Dikerjakan">Mulai Dikoding</option>
                        <option value="Selesai">Rilis / Siap</option>
                      </>
                    )}
                    {type === 'Maintenance' && (
                      <>
                        <option value="Terjadwal">Terjadwal</option>
                        <option value="Dikerjakan">Sedang Berlangsung</option>
                        <option value="Selesai">Selesai Normal</option>
                      </>
                    )}
                  </select>
                </div>
              </div>

              {/* Date & Time for Scheduled Maintenance or Bug Fix Target */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1">
                    {type === 'Maintenance' ? 'Tanggal Rencana Maintenance' : 'Target Penyelesaian / Tanggal'}
                  </label>
                  <input
                    type="date"
                    value={scheduledDate}
                    onChange={(e) => setScheduledDate(e.target.value)}
                    className="w-full bg-neutral-950 border border-[#262626] focus:border-purple-400 rounded-lg px-3 py-2 text-xs text-white focus:outline-none font-mono"
                    id="dev-date-input"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1">Waktu / Jam Target</label>
                  <input
                    type="time"
                    value={scheduledTime}
                    onChange={(e) => setScheduledTime(e.target.value)}
                    className="w-full bg-neutral-950 border border-[#262626] focus:border-purple-400 rounded-lg px-3 py-2 text-xs text-white focus:outline-none font-mono"
                    id="dev-time-input"
                  />
                </div>
              </div>

              {/* Description / Concept */}
              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1">
                  {type === 'Bug' ? 'Deskripsi Kendala & Dampak' : type === 'Ide' ? 'Uraian Konsep & Alur Fitur' : 'Rincian Perbaikan & Downtime'}
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Tuliskan catatan penting, link task, atau alur kerja..."
                  className="w-full bg-neutral-950 border border-[#262626] focus:border-purple-400 rounded-lg p-3 text-xs text-white placeholder-neutral-600 focus:outline-none"
                  id="dev-desc-input"
                />
              </div>

              {/* Steps to Reproduce for Bug */}
              {type === 'Bug' && (
                <div>
                  <label className="block text-xs font-semibold text-rose-300 mb-1 flex items-center gap-1">
                    <Terminal className="w-3.5 h-3.5" />
                    <span>Langkah Reproduksi Bug / Error Logs</span>
                  </label>
                  <textarea
                    rows={2}
                    value={stepsToReproduce}
                    onChange={(e) => setStepsToReproduce(e.target.value)}
                    placeholder="1. Masuk menu X&#10;2. Klik tombol Y&#10;3. Muncul TypeError..."
                    className="w-full bg-neutral-950 border border-rose-500/30 focus:border-rose-400 rounded-lg p-3 text-xs text-white placeholder-neutral-600 focus:outline-none font-mono"
                    id="dev-steps-input"
                  />
                </div>
              )}

              {/* Reminder Toggle */}
              <div className="flex items-center justify-between p-3 bg-neutral-950 rounded-lg border border-[#262626]">
                <div className="flex items-center gap-2">
                  <Bell className="w-4 h-4 text-purple-400" />
                  <div>
                    <p className="text-xs font-semibold text-white">Pengingat Jadwal Dev</p>
                    <p className="text-[11px] text-neutral-400">Peringatkan saat mendekati tanggal target</p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={reminderActive}
                  onChange={(e) => setReminderActive(e.target.checked)}
                  className="w-4 h-4 rounded border-neutral-700 text-purple-500 focus:ring-0 cursor-pointer"
                  id="dev-reminder-checkbox"
                />
              </div>

              {/* Buttons */}
              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-xs font-bold text-neutral-300 transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-xs font-bold text-white transition-colors cursor-pointer shadow-lg shadow-purple-600/20"
                  id="save-dev-item-btn"
                >
                  {editingItem ? 'Simpan Perubahan' : 'Tambah ke Project Dev'}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
