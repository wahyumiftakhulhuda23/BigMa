import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ProjectDeadline, PlatformAccount } from '../../types';
import { X, Save, Calendar, Clock, AlertTriangle, Layers } from 'lucide-react';

interface DeadlineModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (deadline: ProjectDeadline) => void;
  platformAccounts: PlatformAccount[];
  initialData?: ProjectDeadline | null;
  preselectedDate?: string;
}

export const DeadlineModal: React.FC<DeadlineModalProps> = ({
  isOpen,
  onClose,
  onSave,
  platformAccounts,
  initialData,
  preselectedDate,
}) => {
  const [title, setTitle] = useState('');
  const [platformAccountId, setPlatformAccountId] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [priority, setPriority] = useState<'Rendah' | 'Sedang' | 'Tinggi' | 'Mendesak'>('Sedang');
  const [status, setStatus] = useState<'Belum Selesai' | 'Dalam Proses' | 'Selesai'>('Belum Selesai');
  const [targetQuantity, setTargetQuantity] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title);
      setPlatformAccountId(initialData.platformAccountId || '');
      setDueDate(initialData.dueDate);
      setPriority(initialData.priority);
      setStatus(initialData.status);
      setTargetQuantity(initialData.targetQuantity || '');
      setNotes(initialData.notes || '');
    } else {
      setTitle('');
      setPlatformAccountId('');
      setDueDate(preselectedDate || new Date().toISOString().split('T')[0]);
      setPriority('Sedang');
      setStatus('Belum Selesai');
      setTargetQuantity('');
      setNotes('');
    }
  }, [initialData, preselectedDate, isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !dueDate) return;

    const newOrUpdated: ProjectDeadline = {
      id: initialData ? initialData.id : `dl-${Date.now()}`,
      title: title.trim(),
      platformAccountId: platformAccountId || undefined,
      dueDate,
      priority,
      status,
      targetQuantity: targetQuantity.trim(),
      notes: notes.trim(),
      createdAt: initialData ? initialData.createdAt : new Date().toISOString().split('T')[0],
    };

    onSave(newOrUpdated);
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
            if (e.target === e.currentTarget) {
              onClose();
            }
          }}
          id="deadline-modal-overlay"
        >
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
            className="bg-neutral-900 rounded-xl max-w-xl w-full shadow-2xl border border-[#262626] overflow-hidden flex flex-col text-[#E5E5E5]"
            id="deadline-modal-container"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-4 bg-neutral-950 border-b border-[#262626] text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-amber-500/10 text-amber-400 rounded-lg border border-amber-500/20">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-sans font-bold text-base tracking-tight text-neutral-100">
                    {initialData ? 'Edit Tenggat Waktu Proyek' : 'Tambah Tenggat Waktu Proyek Baru'}
                  </h3>
                  <p className="text-xs text-neutral-400">
                    Jadwal deadline operasional, target upload microstock &amp; rilis channel BigMA
                  </p>
                </div>
              </div>
              <button 
                type="button"
                onClick={onClose} 
                className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
                id="close-deadline-modal-btn"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto max-h-[80vh]">
              {/* Title */}
              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1">
                  Judul Proyek / Target Tugas <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="misal: Upload Batch 100 Vector Ramadan 2026, Edit Video YouTube #12..."
                  className="w-full px-3 py-2 text-xs bg-neutral-950 text-neutral-100 placeholder:text-neutral-600 border border-[#262626] rounded-lg focus:outline-hidden focus:border-amber-500/60 transition-colors"
                  id="deadline-input-title"
                />
              </div>

              {/* Linked Platform Account */}
              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1">
                  Tautkan ke Akun Platform (Opsional)
                </label>
                <select
                  value={platformAccountId}
                  onChange={(e) => setPlatformAccountId(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-neutral-950 text-neutral-100 border border-[#262626] rounded-lg focus:outline-hidden focus:border-amber-500/60 font-medium"
                  id="deadline-select-platform-account"
                >
                  <option value="">Tugas Umum / Global BigMA</option>
                  {platformAccounts.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.platform}: {p.accountName}
                    </option>
                  ))}
                </select>
              </div>

              {/* Due Date & Priority */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1">
                    Batas Tenggat Waktu (Due Date) <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-neutral-950 text-neutral-100 border border-[#262626] rounded-lg font-mono focus:outline-hidden focus:border-amber-500/60"
                    id="deadline-input-due-date"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1">
                    Tingkat Prioritas <span className="text-rose-400">*</span>
                  </label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs bg-neutral-950 text-neutral-100 border border-[#262626] rounded-lg focus:outline-hidden focus:border-amber-500/60 font-medium"
                    id="deadline-select-priority"
                  >
                    <option value="Rendah">Rendah (Fleksibel)</option>
                    <option value="Sedang">Sedang (Standar)</option>
                    <option value="Tinggi">Tinggi (Penting)</option>
                    <option value="Mendesak">Mendesak (Critical / Segera)</option>
                  </select>
                </div>
              </div>

              {/* Status & Target Quantity */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1">
                    Status Pengerjaan <span className="text-rose-400">*</span>
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs bg-neutral-950 text-neutral-100 border border-[#262626] rounded-lg focus:outline-hidden focus:border-amber-500/60 font-medium"
                    id="deadline-select-status"
                  >
                    <option value="Belum Selesai">Belum Selesai</option>
                    <option value="Dalam Proses">Dalam Proses Pengerjaan</option>
                    <option value="Selesai">Selesai (Done)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1">
                    Target Kuantitas Aset / File
                  </label>
                  <input
                    type="text"
                    value={targetQuantity}
                    onChange={(e) => setTargetQuantity(e.target.value)}
                    placeholder="misal: 50 Asset Vector, 1 Video 4K, 100 Icon..."
                    className="w-full px-3 py-2 text-xs bg-neutral-950 text-neutral-100 placeholder:text-neutral-600 border border-[#262626] rounded-lg focus:outline-hidden focus:border-amber-500/60 font-mono transition-colors"
                    id="deadline-input-quantity"
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1">
                  Catatan Proyek &amp; Brief Singkat
                </label>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Gunakan keyword seasonal, format EPS 10 + JPEG preview 5000px, tambahkan tags..."
                  className="w-full px-3 py-2 text-xs bg-neutral-950 text-neutral-100 placeholder:text-neutral-600 border border-[#262626] rounded-lg focus:outline-hidden focus:border-amber-500/60 transition-colors"
                  id="deadline-input-notes"
                />
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-[#262626] flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-medium text-neutral-300 bg-neutral-800 hover:bg-neutral-700 rounded-lg transition-colors cursor-pointer"
                  id="cancel-deadline-btn"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-sans font-bold text-neutral-950 bg-amber-400 hover:bg-amber-300 rounded-lg flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
                  id="save-deadline-btn"
                >
                  <Save className="w-4 h-4 stroke-[2.5]" />
                  <span>Simpan Tenggat Waktu</span>
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
