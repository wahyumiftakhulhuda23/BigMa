import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { OfficeTask } from '../../types';
import { 
  Building2, 
  Plus, 
  Search, 
  Calendar, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  UserCheck, 
  Filter, 
  Edit, 
  Trash2, 
  Bell, 
  Copy, 
  Briefcase,
  ChevronRight,
  Layers,
  Sparkles,
  ArrowUpDown
} from 'lucide-react';
import { getDeadlineUrgency } from '../../utils/formatters';

interface OfficeViewProps {
  tasks: OfficeTask[];
  onAddTask: () => void;
  onEditTask: (task: OfficeTask) => void;
  onDeleteTask: (id: string) => void;
  onUpdateTask: (task: OfficeTask) => void;
}

export const OfficeView: React.FC<OfficeViewProps> = ({
  tasks = [],
  onAddTask,
  onEditTask,
  onDeleteTask,
  onUpdateTask,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDept, setSelectedDept] = useState<string>('Semua');
  const [selectedPriority, setSelectedPriority] = useState<string>('Semua');
  const [selectedStatus, setSelectedStatus] = useState<string>('Semua');

  // Compute stats
  const stats = useMemo(() => {
    let pending = 0;
    let completed = 0;
    let urgent = 0;
    let overdue = 0;

    tasks.forEach(t => {
      if (t.status === 'Selesai') {
        completed++;
      } else {
        pending++;
        const urgency = getDeadlineUrgency(t.dueDate, t.status);
        if (urgency.isOverdue) {
          overdue++;
        }
        if (t.priority === 'Mendesak' || urgency.daysRemaining <= 1) {
          urgent++;
        }
      }
    });

    return { total: tasks.length, pending, completed, urgent, overdue };
  }, [tasks]);

  // Filtered tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter(t => {
      // Search
      const q = searchTerm.toLowerCase();
      const matchSearch = 
        !q || 
        t.title.toLowerCase().includes(q) ||
        (t.department || '').toLowerCase().includes(q) ||
        (t.assignee || '').toLowerCase().includes(q) ||
        (t.description || '').toLowerCase().includes(q) ||
        (t.category || '').toLowerCase().includes(q);

      // Department
      const matchDept = selectedDept === 'Semua' || t.department === selectedDept;

      // Priority
      const matchPriority = selectedPriority === 'Semua' || t.priority === selectedPriority;

      // Status
      const matchStatus = selectedStatus === 'Semua' || t.status === selectedStatus;

      return matchSearch && matchDept && matchPriority && matchStatus;
    });
  }, [tasks, searchTerm, selectedDept, selectedPriority, selectedStatus]);

  // Department list for dropdown
  const departments = useMemo(() => {
    const set = new Set<string>();
    tasks.forEach(t => {
      if (t.department) set.add(t.department);
    });
    return ['Semua', ...Array.from(set)];
  }, [tasks]);

  const getPriorityBadge = (priority: OfficeTask['priority']) => {
    switch (priority) {
      case 'Mendesak':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40">🚨 Mendesak</span>;
      case 'Tinggi':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">⚡ Tinggi</span>;
      case 'Sedang':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-sky-500/20 text-sky-300 border border-sky-500/40">📌 Sedang</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-neutral-800 text-neutral-400 border border-neutral-700">☕ Rendah</span>;
    }
  };

  const getStatusBadge = (status: OfficeTask['status']) => {
    switch (status) {
      case 'Selesai':
        return <span className="px-2.5 py-1 rounded-md text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1"><CheckCircle2 className="w-3 h-3 text-emerald-400" /> Selesai</span>;
      case 'Sedang Dikerjakan':
        return <span className="px-2.5 py-1 rounded-md text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1"><Clock className="w-3 h-3 text-amber-400 animate-spin" /> Sedang Dikerjakan</span>;
      case 'Review':
        return <span className="px-2.5 py-1 rounded-md text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center gap-1"><Layers className="w-3 h-3 text-indigo-400" /> Review</span>;
      default:
        return <span className="px-2.5 py-1 rounded-md text-[10px] font-bold bg-neutral-800 text-neutral-400 border border-neutral-700">Belum Mulai</span>;
    }
  };

  return (
    <div className="space-y-6 pb-12 font-sans select-none">
      {/* Top Banner Header */}
      <div className="bg-gradient-to-r from-blue-950/60 via-neutral-900 to-indigo-950/50 p-6 rounded-2xl border border-blue-500/30 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/40 text-[10px] font-mono font-bold uppercase tracking-wider flex items-center gap-1">
                <Building2 className="w-3 h-3 text-blue-400" />
                Daftar Pekerjaan Kantor &amp; Pengingat Dinas
              </span>
              <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/30 text-[10px] font-bold">
                Fitur Lengkap
              </span>
            </div>
            <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
              Office Work Manager
            </h2>
            <p className="text-xs text-neutral-400 mt-1 max-w-xl">
              Pantau seluruh tugas kantor, laporan rutin, agenda rapat, deadline pekerjaan, dan penanggung jawab tim secara terpusat.
            </p>
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onAddTask}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-blue-600/25 flex items-center justify-center gap-2 cursor-pointer transition-all shrink-0"
            id="add-office-task-btn"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Tambah Pekerjaan Kantor</span>
          </motion.button>
        </div>

        {/* Stats Tickers */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
          <div className="p-3.5 bg-neutral-950/70 rounded-xl border border-[#262626] flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Total Pekerjaan</p>
              <p className="text-xl font-black text-white font-mono mt-0.5">{stats.total}</p>
            </div>
            <div className="p-2.5 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <Briefcase className="w-4 h-4" />
            </div>
          </div>

          <div className="p-3.5 bg-neutral-950/70 rounded-xl border border-[#262626] flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Sedang Berjalan</p>
              <p className="text-xl font-black text-amber-400 font-mono mt-0.5">{stats.pending}</p>
            </div>
            <div className="p-2.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Clock className="w-4 h-4" />
            </div>
          </div>

          <div className="p-3.5 bg-neutral-950/70 rounded-xl border border-[#262626] flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Mendesak / Overdue</p>
              <p className="text-xl font-black text-rose-400 font-mono mt-0.5">{stats.overdue > 0 ? `${stats.overdue} Terlewat` : stats.urgent}</p>
            </div>
            <div className={`p-2.5 rounded-lg border ${stats.overdue > 0 ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse' : 'bg-rose-500/10 text-rose-400 border-rose-500/20'}`}>
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>

          <div className="p-3.5 bg-neutral-950/70 rounded-xl border border-[#262626] flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Pekerjaan Selesai</p>
              <p className="text-xl font-black text-emerald-400 font-mono mt-0.5">{stats.completed}</p>
            </div>
            <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="p-4 bg-neutral-900 rounded-xl border border-[#262626] flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cari nama pekerjaan, divisi, penanggung jawab..."
            className="w-full bg-neutral-950 border border-[#262626] focus:border-blue-400 rounded-lg py-2 pl-9 pr-3 text-xs text-white placeholder-neutral-500 focus:outline-none"
            id="office-search-input"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Department Filter */}
          <div className="flex items-center gap-1.5 text-xs text-neutral-400">
            <Filter className="w-3.5 h-3.5 text-neutral-500" />
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="bg-neutral-950 border border-[#262626] text-white rounded-lg px-2.5 py-1.5 text-xs focus:outline-none"
              id="dept-filter-select"
            >
              {departments.map(d => (
                <option key={d} value={d}>Divisi: {d}</option>
              ))}
            </select>
          </div>

          {/* Priority Filter */}
          <select
            value={selectedPriority}
            onChange={(e) => setSelectedPriority(e.target.value)}
            className="bg-neutral-950 border border-[#262626] text-white rounded-lg px-2.5 py-1.5 text-xs focus:outline-none"
            id="priority-filter-select"
          >
            <option value="Semua">Prioritas: Semua</option>
            <option value="Mendesak">Mendesak</option>
            <option value="Tinggi">Tinggi</option>
            <option value="Sedang">Sedang</option>
            <option value="Rendah">Rendah</option>
          </select>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="bg-neutral-950 border border-[#262626] text-white rounded-lg px-2.5 py-1.5 text-xs focus:outline-none"
            id="status-filter-select"
          >
            <option value="Semua">Status: Semua</option>
            <option value="Belum Mulai">Belum Mulai</option>
            <option value="Sedang Dikerjakan">Sedang Dikerjakan</option>
            <option value="Review">Dalam Review</option>
            <option value="Selesai">Selesai</option>
          </select>
        </div>
      </div>

      {/* Task List Table */}
      <div className="bg-neutral-900 rounded-xl border border-[#262626] overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-neutral-950 border-b border-[#262626] text-neutral-400 uppercase font-mono text-[10px]">
              <tr>
                <th className="py-3 px-4">Pekerjaan &amp; Kategori</th>
                <th className="py-3 px-4">Divisi &amp; Tim</th>
                <th className="py-3 px-4">Prioritas</th>
                <th className="py-3 px-4">Tenggat (Deadline)</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#262626]/60">
              {filteredTasks.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-neutral-500">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Building2 className="w-8 h-8 text-neutral-700" />
                      <p className="text-xs font-semibold">Belum ada daftar pekerjaan kantor</p>
                      <button
                        onClick={onAddTask}
                        className="mt-1 text-xs text-blue-400 hover:underline font-bold"
                      >
                        + Tambah Pekerjaan Kantor Pertama
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredTasks.map((t) => {
                  const urgency = getDeadlineUrgency(t.dueDate, t.status);
                  return (
                    <tr 
                      key={t.id} 
                      className={`hover:bg-neutral-800/50 transition-colors ${
                        t.status === 'Selesai' ? 'opacity-60 bg-neutral-950/30' : ''
                      }`}
                    >
                      {/* Title & Category */}
                      <td className="py-3 px-4 max-w-xs">
                        <div className="font-bold text-white text-xs leading-snug">
                          {t.title}
                        </div>
                        {t.category && (
                          <div className="text-[10px] text-neutral-400 mt-0.5 font-mono">
                            {t.category}
                          </div>
                        )}
                        {t.description && (
                          <p className="text-[11px] text-neutral-400 line-clamp-1 mt-1 font-sans">
                            {t.description}
                          </p>
                        )}
                      </td>

                      {/* Department & Assignee */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-neutral-950 border border-[#262626] text-neutral-300 font-medium">
                          <Building2 className="w-3 h-3 text-blue-400" />
                          <span>{t.department || 'Umum'}</span>
                        </div>
                        {t.assignee && (
                          <div className="text-[10px] text-neutral-400 mt-1 flex items-center gap-1 font-mono">
                            <UserCheck className="w-3 h-3 text-neutral-500" />
                            <span>{t.assignee}</span>
                          </div>
                        )}
                      </td>

                      {/* Priority */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        {getPriorityBadge(t.priority)}
                      </td>

                      {/* Due Date & Urgency Indicator */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="font-mono font-bold text-xs text-white">
                          {t.dueDate} {t.dueTime ? `(${t.dueTime})` : ''}
                        </div>
                        {t.status !== 'Selesai' && (
                          <div className="mt-1">
                            {urgency.isOverdue ? (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse">
                                Terlewat {Math.abs(urgency.daysRemaining)} Hari
                              </span>
                            ) : urgency.daysRemaining === 0 ? (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                                Hari Ini
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-neutral-800 text-neutral-400">
                                {urgency.daysRemaining} Hari Lagi
                              </span>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Status Dropdown */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <select
                          value={t.status}
                          onChange={(e) => onUpdateTask({ ...t, status: e.target.value as any })}
                          className="bg-neutral-950 border border-[#262626] text-white rounded-lg px-2 py-1 text-xs focus:outline-none cursor-pointer"
                        >
                          <option value="Belum Mulai">Belum Mulai</option>
                          <option value="Sedang Dikerjakan">Sedang Dikerjakan</option>
                          <option value="Review">Dalam Review</option>
                          <option value="Selesai">Selesai</option>
                        </select>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => onEditTask(t)}
                            className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
                            title="Edit Pekerjaan"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              // Duplicate task
                              const dup: OfficeTask = {
                                ...t,
                                id: `off-${Date.now()}`,
                                title: `${t.title} (Salinan)`,
                                createdAt: new Date().toISOString().split('T')[0],
                              };
                              onUpdateTask(dup);
                            }}
                            className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
                            title="Duplikat Pekerjaan"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onDeleteTask(t.id)}
                            className="p-1.5 rounded-lg text-neutral-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                            title="Hapus"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
