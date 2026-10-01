import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { DevProjectItem, DevItemType } from '../../types';
import { 
  Code2, 
  Plus, 
  Search, 
  Bug, 
  Lightbulb, 
  Wrench, 
  Calendar, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  Terminal, 
  Filter, 
  Edit, 
  Trash2, 
  Copy, 
  ExternalLink,
  Layers,
  Sparkles,
  RefreshCw,
  Server
} from 'lucide-react';
import { getDeadlineUrgency } from '../../utils/formatters';

interface ProjectDevViewProps {
  items: DevProjectItem[];
  onAddItem: (type?: DevItemType) => void;
  onEditItem: (item: DevProjectItem) => void;
  onDeleteItem: (id: string) => void;
  onUpdateItem: (item: DevProjectItem) => void;
}

export const ProjectDevView: React.FC<ProjectDevViewProps> = ({
  items = [],
  onAddItem,
  onEditItem,
  onDeleteItem,
  onUpdateItem,
}) => {
  const [activeFilter, setActiveFilter] = useState<'Semua' | 'Bug' | 'Ide' | 'Maintenance'>('Semua');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedApp, setSelectedApp] = useState<string>('Semua');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('Semua');
  const [selectedStatus, setSelectedStatus] = useState<string>('Semua');

  // Stats calculation
  const stats = useMemo(() => {
    let activeBugs = 0;
    let criticalBugs = 0;
    let ideasCount = 0;
    let upcomingMaintenance = 0;
    let resolvedCount = 0;

    items.forEach(item => {
      if (item.status === 'Selesai') {
        resolvedCount++;
      } else {
        if (item.type === 'Bug') {
          activeBugs++;
          if (item.severity === 'Kritis') criticalBugs++;
        } else if (item.type === 'Ide') {
          ideasCount++;
        } else if (item.type === 'Maintenance') {
          upcomingMaintenance++;
        }
      }
    });

    return {
      total: items.length,
      activeBugs,
      criticalBugs,
      ideasCount,
      upcomingMaintenance,
      resolvedCount,
    };
  }, [items]);

  // Unique apps for dropdown
  const appList = useMemo(() => {
    const set = new Set<string>();
    items.forEach(i => {
      if (i.appName) set.add(i.appName);
    });
    return ['Semua', ...Array.from(set)];
  }, [items]);

  // Filtered items
  const filteredItems = useMemo(() => {
    return items.filter(item => {
      // Type
      if (activeFilter !== 'Semua' && item.type !== activeFilter) return false;

      // App
      if (selectedApp !== 'Semua' && item.appName !== selectedApp) return false;

      // Severity
      if (selectedSeverity !== 'Semua' && item.severity !== selectedSeverity) return false;

      // Status
      if (selectedStatus !== 'Semua' && item.status !== selectedStatus) return false;

      // Search
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchTitle = item.title.toLowerCase().includes(q);
        const matchApp = item.appName.toLowerCase().includes(q);
        const matchDesc = (item.description || '').toLowerCase().includes(q);
        const matchTech = (item.stackOrTech || '').toLowerCase().includes(q);
        const matchSteps = (item.stepsToReproduce || '').toLowerCase().includes(q);
        return matchTitle || matchApp || matchDesc || matchTech || matchSteps;
      }

      return true;
    });
  }, [items, activeFilter, selectedApp, selectedSeverity, selectedStatus, searchTerm]);

  const getSeverityBadge = (sev: DevProjectItem['severity']) => {
    switch (sev) {
      case 'Kritis':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/50 flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-ping" /> Kritis</span>;
      case 'Tinggi':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/50">Tinggi</span>;
      case 'Sedang':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-sky-500/20 text-sky-300 border border-sky-500/50">Sedang</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-neutral-800 text-neutral-400 border border-neutral-700">Rendah</span>;
    }
  };

  const getTypeIcon = (type: DevItemType) => {
    switch (type) {
      case 'Bug':
        return <Bug className="w-3.5 h-3.5 text-rose-400" />;
      case 'Ide':
        return <Lightbulb className="w-3.5 h-3.5 text-amber-400" />;
      case 'Maintenance':
        return <Wrench className="w-3.5 h-3.5 text-cyan-400" />;
    }
  };

  return (
    <div className="space-y-6 pb-12 font-sans select-none">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-purple-950/70 via-neutral-900 to-indigo-950/60 p-6 rounded-2xl border border-purple-500/30 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40 text-[10px] font-mono font-bold uppercase tracking-wider flex items-center gap-1.5">
                <Code2 className="w-3.5 h-3.5 text-purple-400" />
                Project Dev Studio
              </span>
              <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold">
                Developer Space
              </span>
            </div>
            <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
              Bug Tracker, Ide Baru &amp; Maintenance Aplikasi
            </h2>
            <p className="text-xs text-neutral-400 mt-1 max-w-xl">
              Pusat kendali pengembang: tangani laporan bug, tuangkan konsep ide baru, dan jadwalkan pemeliharaan sistem secara sistematis.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => onAddItem('Bug')}
              className="px-3.5 py-2.5 bg-rose-600/90 hover:bg-rose-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-rose-600/20 flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Bug className="w-3.5 h-3.5" />
              <span>+ Lapor Bug</span>
            </button>
            <button
              onClick={() => onAddItem('Ide')}
              className="px-3.5 py-2.5 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs rounded-xl shadow-lg shadow-amber-500/20 flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Lightbulb className="w-3.5 h-3.5" />
              <span>+ Konsep Ide</span>
            </button>
            <button
              onClick={() => onAddItem('Maintenance')}
              className="px-3.5 py-2.5 bg-cyan-600/90 hover:bg-cyan-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-cyan-600/20 flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Wrench className="w-3.5 h-3.5" />
              <span>+ Maintenance</span>
            </button>
          </div>
        </div>

        {/* Tickers */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
          <div className="p-3.5 bg-neutral-950/70 rounded-xl border border-[#262626] flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Bug Aktif</p>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className="text-xl font-black text-rose-400 font-mono">{stats.activeBugs}</span>
                {stats.criticalBugs > 0 && (
                  <span className="text-[10px] font-bold text-rose-300 bg-rose-500/20 px-1.5 py-0.2 rounded border border-rose-500/40">
                    {stats.criticalBugs} Kritis
                  </span>
                )}
              </div>
            </div>
            <div className="p-2.5 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20">
              <Bug className="w-4 h-4" />
            </div>
          </div>

          <div className="p-3.5 bg-neutral-950/70 rounded-xl border border-[#262626] flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Ide &amp; Konsep</p>
              <p className="text-xl font-black text-amber-400 font-mono mt-0.5">{stats.ideasCount} Ide</p>
            </div>
            <div className="p-2.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Lightbulb className="w-4 h-4" />
            </div>
          </div>

          <div className="p-3.5 bg-neutral-950/70 rounded-xl border border-[#262626] flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Jadwal Maintenance</p>
              <p className="text-xl font-black text-cyan-400 font-mono mt-0.5">{stats.upcomingMaintenance} Tugas</p>
            </div>
            <div className="p-2.5 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <Wrench className="w-4 h-4" />
            </div>
          </div>

          <div className="p-3.5 bg-neutral-950/70 rounded-xl border border-[#262626] flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Fixed / Selesai</p>
              <p className="text-xl font-black text-emerald-400 font-mono mt-0.5">{stats.resolvedCount}</p>
            </div>
            <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
        </div>
      </div>

      {/* Mode Sub-Tabs Filter */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <button
          onClick={() => setActiveFilter('Semua')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeFilter === 'Semua'
              ? 'bg-purple-600 text-white shadow-md'
              : 'bg-neutral-900 border border-[#262626] text-neutral-400 hover:text-white'
          }`}
        >
          Semua Item ({items.length})
        </button>

        <button
          onClick={() => setActiveFilter('Bug')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
            activeFilter === 'Bug'
              ? 'bg-rose-600 text-white shadow-md'
              : 'bg-neutral-900 border border-[#262626] text-neutral-400 hover:text-rose-300'
          }`}
        >
          <Bug className="w-3.5 h-3.5" />
          <span>Bug Tracker ({items.filter(i => i.type === 'Bug').length})</span>
        </button>

        <button
          onClick={() => setActiveFilter('Ide')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
            activeFilter === 'Ide'
              ? 'bg-amber-500 text-neutral-950 shadow-md'
              : 'bg-neutral-900 border border-[#262626] text-neutral-400 hover:text-amber-300'
          }`}
        >
          <Lightbulb className="w-3.5 h-3.5" />
          <span>Ide &amp; Konsep Baru ({items.filter(i => i.type === 'Ide').length})</span>
        </button>

        <button
          onClick={() => setActiveFilter('Maintenance')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
            activeFilter === 'Maintenance'
              ? 'bg-cyan-600 text-white shadow-md'
              : 'bg-neutral-900 border border-[#262626] text-neutral-400 hover:text-cyan-300'
          }`}
        >
          <Wrench className="w-3.5 h-3.5" />
          <span>Maintenance &amp; Perbaikan ({items.filter(i => i.type === 'Maintenance').length})</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 bg-neutral-900 rounded-xl border border-[#262626] flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cari bug, ide, stack, langkah..."
            className="w-full bg-neutral-950 border border-[#262626] focus:border-purple-400 rounded-lg py-2 pl-9 pr-3 text-xs text-white placeholder-neutral-500 focus:outline-none"
            id="dev-search-input"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* App filter */}
          <select
            value={selectedApp}
            onChange={(e) => setSelectedApp(e.target.value)}
            className="bg-neutral-950 border border-[#262626] text-white rounded-lg px-2.5 py-1.5 text-xs focus:outline-none"
          >
            {appList.map(app => (
              <option key={app} value={app}>Aplikasi: {app}</option>
            ))}
          </select>

          {/* Severity filter */}
          <select
            value={selectedSeverity}
            onChange={(e) => setSelectedSeverity(e.target.value)}
            className="bg-neutral-950 border border-[#262626] text-white rounded-lg px-2.5 py-1.5 text-xs focus:outline-none"
          >
            <option value="Semua">Severity: Semua</option>
            <option value="Kritis">Kritis</option>
            <option value="Tinggi">Tinggi</option>
            <option value="Sedang">Sedang</option>
            <option value="Rendah">Rendah</option>
          </select>

          {/* Status filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="bg-neutral-950 border border-[#262626] text-white rounded-lg px-2.5 py-1.5 text-xs focus:outline-none"
          >
            <option value="Semua">Status: Semua</option>
            <option value="Open">Open</option>
            <option value="Konsep">Konsep</option>
            <option value="Investigasi">Investigasi</option>
            <option value="Terjadwal">Terjadwal</option>
            <option value="Dikerjakan">Dikerjakan</option>
            <option value="Selesai">Selesai</option>
          </select>
        </div>
      </div>

      {/* Main Table View */}
      <div className="bg-neutral-900 rounded-xl border border-[#262626] overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-neutral-950 border-b border-[#262626] text-neutral-400 uppercase font-mono text-[10px]">
              <tr>
                <th className="py-3 px-4">Tipe &amp; Judul Item</th>
                <th className="py-3 px-4">Aplikasi &amp; Tech Stack</th>
                <th className="py-3 px-4">Severity</th>
                <th className="py-3 px-4">Jadwal / Target</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#262626]/60">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-neutral-500">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Code2 className="w-8 h-8 text-neutral-700" />
                      <p className="text-xs font-semibold">Belum ada data project dev di kategori ini</p>
                      <button
                        onClick={() => onAddItem()}
                        className="mt-1 text-xs text-purple-400 hover:underline font-bold"
                      >
                        + Tambah Catatan Project Dev Pertama
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredItems.map(item => {
                  const urgency = item.scheduledDate ? getDeadlineUrgency(item.scheduledDate, item.status) : null;
                  return (
                    <tr
                      key={item.id}
                      className={`hover:bg-neutral-800/50 transition-colors ${
                        item.status === 'Selesai' ? 'opacity-60 bg-neutral-950/30' : ''
                      }`}
                    >
                      {/* Title & Type */}
                      <td className="py-3 px-4 max-w-sm">
                        <div className="flex items-center gap-2">
                          <div className={`p-1.5 rounded-md border ${
                            item.type === 'Bug' 
                              ? 'bg-rose-500/10 border-rose-500/30 text-rose-400' 
                              : item.type === 'Ide' 
                              ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' 
                              : 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400'
                          }`}>
                            {getTypeIcon(item.type)}
                          </div>
                          <div>
                            <div className="font-bold text-white text-xs leading-snug">
                              {item.title}
                            </div>
                            <span className="text-[10px] font-mono text-neutral-400">
                              [{item.type}]
                            </span>
                          </div>
                        </div>

                        {item.description && (
                          <p className="text-[11px] text-neutral-400 mt-1 line-clamp-1">
                            {item.description}
                          </p>
                        )}

                        {item.stepsToReproduce && (
                          <div className="text-[10px] text-rose-300/90 font-mono bg-rose-950/30 p-1.5 rounded mt-1 border border-rose-500/20 line-clamp-1">
                            Reproduksi: {item.stepsToReproduce}
                          </div>
                        )}
                      </td>

                      {/* App & Tech Stack */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-neutral-950 border border-[#262626] text-neutral-200 font-bold">
                          <span>{item.appName}</span>
                        </div>
                        {item.stackOrTech && (
                          <div className="text-[10px] text-purple-300 font-mono mt-1 flex items-center gap-1">
                            <Terminal className="w-3 h-3 text-purple-400" />
                            <span>{item.stackOrTech}</span>
                          </div>
                        )}
                      </td>

                      {/* Severity */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        {getSeverityBadge(item.severity)}
                      </td>

                      {/* Scheduled Date */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        {item.scheduledDate ? (
                          <div>
                            <div className="font-mono font-bold text-xs text-white flex items-center gap-1">
                              <Calendar className="w-3 h-3 text-neutral-400" />
                              <span>{item.scheduledDate} {item.scheduledTime ? `(${item.scheduledTime})` : ''}</span>
                            </div>
                            {urgency && item.status !== 'Selesai' && (
                              <div className="mt-1">
                                {urgency.isOverdue ? (
                                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40">
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
                          </div>
                        ) : (
                          <span className="text-neutral-500 text-[11px]">-</span>
                        )}
                      </td>

                      {/* Status Dropdown */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <select
                          value={item.status}
                          onChange={(e) => onUpdateItem({ ...item, status: e.target.value as any })}
                          className="bg-neutral-950 border border-[#262626] text-white rounded-lg px-2 py-1 text-xs focus:outline-none cursor-pointer"
                        >
                          <option value="Open">Open</option>
                          <option value="Konsep">Konsep</option>
                          <option value="Investigasi">Investigasi</option>
                          <option value="Terjadwal">Terjadwal</option>
                          <option value="Dikerjakan">Dikerjakan</option>
                          <option value="Selesai">Fixed / Selesai</option>
                        </select>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => onEditItem(item)}
                            className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
                            title="Edit"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              const dup: DevProjectItem = {
                                ...item,
                                id: `dev-${Date.now()}`,
                                title: `${item.title} (Salinan)`,
                                createdAt: new Date().toISOString().split('T')[0],
                              };
                              onUpdateItem(dup);
                            }}
                            className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
                            title="Duplikat"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onDeleteItem(item.id)}
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
