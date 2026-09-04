import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AccountNote, PlatformAccount } from '../../types';
import { X, StickyNote, Bell, Calendar, Clock, Tag, AlertCircle, Save } from 'lucide-react';

interface AccountNoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (note: AccountNote) => void;
  platformAccounts: PlatformAccount[];
  initialData?: AccountNote | null;
  preselectedPlatformAccountId?: string;
}

export const AccountNoteModal: React.FC<AccountNoteModalProps> = ({
  isOpen,
  onClose,
  onSave,
  platformAccounts,
  initialData,
  preselectedPlatformAccountId,
}) => {
  const [platformAccountId, setPlatformAccountId] = useState(
    initialData?.platformAccountId || preselectedPlatformAccountId || ''
  );
  const [title, setTitle] = useState(initialData?.title || '');
  const [content, setContent] = useState(initialData?.content || '');
  const [category, setCategory] = useState<AccountNote['category']>(
    initialData?.category || 'Strategi & Niche'
  );
  const [priority, setPriority] = useState<AccountNote['priority']>(
    initialData?.priority || 'Sedang'
  );
  const [hasReminder, setHasReminder] = useState<boolean>(
    initialData?.hasReminder || false
  );
  const [reminderDate, setReminderDate] = useState(
    initialData?.reminderDate || '2026-09-05'
  );
  const [reminderTime, setReminderTime] = useState(
    initialData?.reminderTime || '09:00'
  );
  const [reminderStatus, setReminderStatus] = useState<AccountNote['reminderStatus']>(
    initialData?.reminderStatus || 'Pending'
  );
  const [tagsInput, setTagsInput] = useState(
    initialData?.tags ? initialData.tags.join(', ') : ''
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (initialData) {
      setPlatformAccountId(initialData.platformAccountId);
      setTitle(initialData.title);
      setContent(initialData.content);
      setCategory(initialData.category);
      setPriority(initialData.priority);
      setHasReminder(initialData.hasReminder);
      setReminderDate(initialData.reminderDate || '2026-09-05');
      setReminderTime(initialData.reminderTime || '09:00');
      setReminderStatus(initialData.reminderStatus || 'Pending');
      setTagsInput(initialData.tags ? initialData.tags.join(', ') : '');
    } else {
      setPlatformAccountId(preselectedPlatformAccountId || (platformAccounts[0]?.id || 'master'));
      setTitle('');
      setContent('');
      setCategory('Strategi & Niche');
      setPriority('Sedang');
      setHasReminder(false);
      setReminderDate('2026-09-05');
      setReminderTime('09:00');
      setReminderStatus('Pending');
      setTagsInput('');
    }
    setErrorMessage(null);
  }, [initialData, preselectedPlatformAccountId, platformAccounts, isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setErrorMessage('Judul catatan wajib diisi.');
      return;
    }
    if (!content.trim()) {
      setErrorMessage('Isi teks catatan wajib diisi.');
      return;
    }
    if (hasReminder && !reminderDate) {
      setErrorMessage('Pilih tanggal pengingat jika fitur pengingat diaktifkan.');
      return;
    }

    const tags = tagsInput
      .split(',')
      .map(t => t.trim())
      .filter(Boolean);

    const nowStr = new Date().toISOString();
    const noteObj: AccountNote = {
      id: initialData?.id || `note-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      platformAccountId: platformAccountId || 'master',
      title: title.trim(),
      content: content.trim(),
      category,
      priority,
      hasReminder,
      reminderDate: hasReminder ? reminderDate : undefined,
      reminderTime: hasReminder ? reminderTime : undefined,
      reminderStatus: hasReminder ? reminderStatus : undefined,
      tags,
      createdAt: initialData?.createdAt || nowStr,
      updatedAt: nowStr,
    };

    onSave(noteObj);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs"
          onClick={(e) => {
            if (e.target === e.currentTarget) onClose();
          }}
          id="account-note-modal-overlay"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
            className="bg-neutral-900 rounded-xl max-w-xl w-full shadow-2xl border border-[#262626] overflow-hidden flex flex-col text-[#E5E5E5]"
            onClick={(e) => e.stopPropagation()}
            id="account-note-modal-container"
          >
            {/* Header */}
            <div className="p-4 bg-neutral-950 border-b border-[#262626] text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-amber-500/10 text-amber-400 rounded-lg border border-amber-500/20">
                  <StickyNote className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-sans font-bold text-base tracking-tight text-neutral-100">
                    {initialData ? 'Edit Catatan Akun' : 'Tambah Catatan & Pengingat Akun'}
                  </h3>
                  <p className="text-xs text-neutral-400">
                    Kategorisasi per platform, akun, dan sinkronisasi ke kalender
                  </p>
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
            <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto max-h-[75vh]">
              {errorMessage && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-lg text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Platform and Account Selection */}
              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1">
                  Pilih Akun Platform Terkait <span className="text-amber-400">*</span>
                </label>
                <select
                  value={platformAccountId}
                  onChange={(e) => setPlatformAccountId(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-neutral-950 text-neutral-200 border border-[#262626] rounded-lg focus:outline-hidden focus:border-amber-500/60"
                >
                  <option value="master">Umum / Master Studio BigMA</option>
                  {platformAccounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      [{acc.platform}] {acc.accountName} ({acc.usernameOrHandle})
                    </option>
                  ))}
                </select>
              </div>

              {/* Title & Category */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-neutral-300 mb-1">
                    Judul Catatan <span className="text-amber-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Contoh: Checklist Batch Upload Vektor Ramadan, Niche 3D Loop"
                    className="w-full px-3 py-2 text-xs bg-neutral-950 text-neutral-200 border border-[#262626] rounded-lg focus:outline-hidden focus:border-amber-500/60"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1">
                    Kategori Catatan
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs bg-neutral-950 text-neutral-200 border border-[#262626] rounded-lg focus:outline-hidden focus:border-amber-500/60"
                  >
                    <option value="Strategi & Niche">Strategi &amp; Niche</option>
                    <option value="Jadwal Konten">Jadwal Konten</option>
                    <option value="Kredensial & PIN">Kredensial &amp; PIN</option>
                    <option value="Peringatan & Rule">Peringatan &amp; Rule</option>
                    <option value="Log Update">Log Update</option>
                    <option value="Umum">Umum</option>
                  </select>
                </div>
              </div>

              {/* Priority */}
              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1">
                  Tingkat Prioritas
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {(['Rendah', 'Sedang', 'Tinggi', 'Mendesak'] as const).map((p) => (
                    <button
                      type="button"
                      key={p}
                      onClick={() => setPriority(p)}
                      className={`py-1.5 px-2 text-xs font-sans font-bold rounded-lg border transition-all cursor-pointer ${
                        priority === p
                          ? p === 'Mendesak'
                            ? 'bg-rose-500/20 text-rose-300 border-rose-500/50'
                            : p === 'Tinggi'
                            ? 'bg-orange-500/20 text-orange-300 border-orange-500/50'
                            : p === 'Sedang'
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                            : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50'
                          : 'bg-neutral-950 text-neutral-400 border-[#262626] hover:border-neutral-700'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              {/* Content / Body Text */}
              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1">
                  Isi Catatan &amp; Instruksi Khusus <span className="text-amber-400">*</span>
                </label>
                <textarea
                  rows={5}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Tuliskan catatan teknis, strategi kata kunci, checklist upload, memo penting, atau panduan khusus akun ini..."
                  className="w-full px-3 py-2 text-xs bg-neutral-950 text-neutral-200 border border-[#262626] rounded-lg focus:outline-hidden focus:border-amber-500/60 font-sans"
                />
              </div>

              {/* Reminder Section (Sync to Calendar) */}
              <div className="p-3.5 bg-neutral-950 border border-[#262626] rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Bell className="w-4 h-4 text-amber-400" />
                    <div>
                      <div className="text-xs font-sans font-bold text-neutral-200">
                        Aktifkan Pengingat Kalender
                      </div>
                      <div className="text-[11px] text-neutral-400">
                        Muncul otomatis di tanggal bersangkutan pada kalender platform
                      </div>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={hasReminder}
                      onChange={(e) => setHasReminder(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-neutral-800 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-400"></div>
                  </label>
                </div>

                {hasReminder && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-[#262626]"
                  >
                    <div>
                      <label className="block text-[11px] font-medium text-neutral-400 mb-1">
                        Tanggal Pengingat
                      </label>
                      <div className="relative">
                        <Calendar className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-neutral-500" />
                        <input
                          type="date"
                          value={reminderDate}
                          onChange={(e) => setReminderDate(e.target.value)}
                          className="w-full pl-8 pr-2.5 py-1.5 text-xs bg-neutral-900 text-neutral-200 border border-[#262626] rounded-lg font-mono focus:outline-hidden focus:border-amber-500/60"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-medium text-neutral-400 mb-1">
                        Waktu (Opsional)
                      </label>
                      <div className="relative">
                        <Clock className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-neutral-500" />
                        <input
                          type="time"
                          value={reminderTime}
                          onChange={(e) => setReminderTime(e.target.value)}
                          className="w-full pl-8 pr-2.5 py-1.5 text-xs bg-neutral-900 text-neutral-200 border border-[#262626] rounded-lg font-mono focus:outline-hidden focus:border-amber-500/60"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-medium text-neutral-400 mb-1">
                        Status Pengingat
                      </label>
                      <select
                        value={reminderStatus}
                        onChange={(e) => setReminderStatus(e.target.value as any)}
                        className="w-full px-2.5 py-1.5 text-xs bg-neutral-900 text-neutral-200 border border-[#262626] rounded-lg focus:outline-hidden focus:border-amber-500/60"
                      >
                        <option value="Pending">Aktif (Pending)</option>
                        <option value="Selesai">Sudah Selesai</option>
                      </select>
                    </div>
                  </motion.div>
                )}
              </div>

              {/* Tags */}
              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1 flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-neutral-400" />
                  <span>Label / Tag (Pisahkan dengan tanda koma)</span>
                </label>
                <input
                  type="text"
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
                  placeholder="vektor, ramadan, youtube-seo, keyword, monetisasi"
                  className="w-full px-3 py-2 text-xs bg-neutral-950 text-neutral-200 border border-[#262626] rounded-lg focus:outline-hidden focus:border-amber-500/60"
                />
              </div>

              {/* Submit Buttons */}
              <div className="pt-2 flex items-center justify-end gap-2 border-t border-[#262626]">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-medium text-neutral-400 hover:text-white bg-neutral-950 hover:bg-neutral-800 rounded-lg border border-[#262626] transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-neutral-950 font-sans font-bold text-xs rounded-lg flex items-center gap-1.5 transition-all shadow-md shadow-amber-500/20 cursor-pointer"
                >
                  <Save className="w-4 h-4 stroke-[2.5]" />
                  <span>{initialData ? 'Simpan Perubahan' : 'Simpan Catatan'}</span>
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
