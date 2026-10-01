import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { OfficeTask } from '../../types';
import { X, Building2, Calendar, Clock, UserCheck, AlertTriangle, FileText, Bell } from 'lucide-react';

interface OfficeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (task: OfficeTask) => void;
  editingTask?: OfficeTask | null;
}

export const OfficeModal: React.FC<OfficeModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingTask,
}) => {
  const [title, setTitle] = useState('');
  const [department, setDepartment] = useState('Administrasi');
  const [category, setCategory] = useState<OfficeTask['category']>('Proyek Kantor');
  const [priority, setPriority] = useState<OfficeTask['priority']>('Sedang');
  const [status, setStatus] = useState<OfficeTask['status']>('Belum Mulai');
  const [dueDate, setDueDate] = useState('');
  const [dueTime, setDueTime] = useState('17:00');
  const [assignee, setAssignee] = useState('');
  const [description, setDescription] = useState('');
  const [reminderActive, setReminderActive] = useState(true);

  useEffect(() => {
    if (editingTask) {
      setTitle(editingTask.title);
      setDepartment(editingTask.department || 'Administrasi');
      setCategory(editingTask.category || 'Proyek Kantor');
      setPriority(editingTask.priority);
      setStatus(editingTask.status);
      setDueDate(editingTask.dueDate);
      setDueTime(editingTask.dueTime || '17:00');
      setAssignee(editingTask.assignee || '');
      setDescription(editingTask.description || '');
      setReminderActive(editingTask.reminderActive ?? true);
    } else {
      setTitle('');
      setDepartment('Administrasi');
      setCategory('Proyek Kantor');
      setPriority('Sedang');
      setStatus('Belum Mulai');
      // Default to today
      const today = new Date().toISOString().split('T')[0];
      setDueDate(today);
      setDueTime('17:00');
      setAssignee('');
      setDescription('');
      setReminderActive(true);
    }
  }, [editingTask, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !dueDate) return;

    const task: OfficeTask = {
      id: editingTask?.id || `off-${Date.now()}`,
      title: title.trim(),
      department: department.trim(),
      category,
      priority,
      status,
      dueDate,
      dueTime: dueTime.trim() || '17:00',
      assignee: assignee.trim(),
      description: description.trim(),
      reminderActive,
      createdAt: editingTask?.createdAt || new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0],
    };

    onSave(task);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs"
          onClick={(e) => {
            if (e.target === e.currentTarget) onClose();
          }}
          id="office-modal-overlay"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="bg-neutral-900 rounded-xl max-w-lg w-full shadow-2xl border border-[#262626] overflow-hidden flex flex-col text-[#E5E5E5]"
            id="office-modal-card"
          >
            {/* Header */}
            <div className="p-4 bg-neutral-950 border-b border-[#262626] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-lg">
                  <Building2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-sans font-bold text-base text-white">
                    {editingTask ? 'Edit Pekerjaan Kantor' : 'Tambah Pekerjaan Kantor Baru'}
                  </h3>
                  <p className="text-xs text-neutral-400">Pengingat Tugas & Project Kantor</p>
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
              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1">
                  Nama Pekerjaan / Tugas Kantor <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Misal: Laporan Rekapitulasi Pajak Bulanan"
                  className="w-full bg-neutral-950 border border-[#262626] focus:border-blue-400 rounded-lg px-3 py-2 text-xs text-white placeholder-neutral-600 focus:outline-none"
                  id="office-title-input"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1">Divisi / Bidang</label>
                  <select
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full bg-neutral-950 border border-[#262626] focus:border-blue-400 rounded-lg px-3 py-2 text-xs text-white focus:outline-none"
                    id="office-dept-select"
                  >
                    <option value="Administrasi">Administrasi</option>
                    <option value="Keuangan">Keuangan</option>
                    <option value="IT & Sistem">IT &amp; Sistem</option>
                    <option value="SDM & HRD">SDM &amp; HRD</option>
                    <option value="Operasional">Operasional</option>
                    <option value="Pemasaran">Pemasaran</option>
                    <option value="Umum & Logistik">Umum &amp; Logistik</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1">Kategori Pekerjaan</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="w-full bg-neutral-950 border border-[#262626] focus:border-blue-400 rounded-lg px-3 py-2 text-xs text-white focus:outline-none"
                    id="office-category-select"
                  >
                    <option value="Pekerjaan Rutin">Pekerjaan Rutin</option>
                    <option value="Proyek Kantor">Proyek Kantor</option>
                    <option value="Rapat / Meeting">Rapat / Meeting</option>
                    <option value="Laporan & Surat">Laporan &amp; Surat</option>
                    <option value="Pengingat Dinas">Pengingat Dinas</option>
                    <option value="Lainnya">Lainnya</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1">Tingkat Prioritas</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as any)}
                    className="w-full bg-neutral-950 border border-[#262626] focus:border-blue-400 rounded-lg px-3 py-2 text-xs text-white focus:outline-none"
                    id="office-priority-select"
                  >
                    <option value="Mendesak">🚨 Mendesak</option>
                    <option value="Tinggi">⚡ Tinggi</option>
                    <option value="Sedang">📌 Sedang</option>
                    <option value="Rendah">☕ Rendah</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1">Status Pekerjaan</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="w-full bg-neutral-950 border border-[#262626] focus:border-blue-400 rounded-lg px-3 py-2 text-xs text-white focus:outline-none"
                    id="office-status-select"
                  >
                    <option value="Belum Mulai">Belum Mulai</option>
                    <option value="Sedang Dikerjakan">Sedang Dikerjakan</option>
                    <option value="Review">Dalam Review</option>
                    <option value="Selesai">Selesai</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1">
                    Tanggal Tenggat (Deadline) <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full bg-neutral-950 border border-[#262626] focus:border-blue-400 rounded-lg px-3 py-2 text-xs text-white focus:outline-none font-mono"
                    id="office-date-input"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1">Jam Tenggat</label>
                  <input
                    type="time"
                    value={dueTime}
                    onChange={(e) => setDueTime(e.target.value)}
                    className="w-full bg-neutral-950 border border-[#262626] focus:border-blue-400 rounded-lg px-3 py-2 text-xs text-white focus:outline-none font-mono"
                    id="office-time-input"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1">
                  Penanggung Jawab / Rekan Tim
                </label>
                <input
                  type="text"
                  value={assignee}
                  onChange={(e) => setAssignee(e.target.value)}
                  placeholder="Misal: Pak Budi / Bu Ani"
                  className="w-full bg-neutral-950 border border-[#262626] focus:border-blue-400 rounded-lg px-3 py-2 text-xs text-white placeholder-neutral-600 focus:outline-none"
                  id="office-assignee-input"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1">
                  Deskripsi / Keterangan Tambahan
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Instruksi tugas, tautan berkas, atau catatan rapat..."
                  className="w-full bg-neutral-950 border border-[#262626] focus:border-blue-400 rounded-lg p-3 text-xs text-white placeholder-neutral-600 focus:outline-none"
                  id="office-desc-input"
                />
              </div>

              <div className="flex items-center justify-between p-3 bg-neutral-950 rounded-lg border border-[#262626]">
                <div className="flex items-center gap-2">
                  <Bell className="w-4 h-4 text-amber-400" />
                  <div>
                    <p className="text-xs font-semibold text-white">Pengingat Notifikasi</p>
                    <p className="text-[11px] text-neutral-400">Aktifkan peringatan untuk tenggat ini</p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={reminderActive}
                  onChange={(e) => setReminderActive(e.target.checked)}
                  className="w-4 h-4 rounded border-neutral-700 text-blue-500 focus:ring-0 cursor-pointer"
                  id="office-reminder-checkbox"
                />
              </div>

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
                  className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-xs font-bold text-white transition-colors cursor-pointer shadow-lg shadow-blue-600/20"
                  id="save-office-task-btn"
                >
                  {editingTask ? 'Simpan Perubahan' : 'Tambah Pekerjaan'}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
