import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AccountNote, PlatformAccount } from '../../types';
import { exportToExcel, exportTableToPdf } from '../../utils/exportUtils';
import { formatDateIndo, getDeadlineUrgency } from '../../utils/formatters';
import { ConfirmModal } from '../ConfirmModal';
import {
  StickyNote,
  Plus,
  Search,
  FileSpreadsheet,
  FileText,
  Bell,
  Calendar,
  Tag,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Edit3,
  Trash2,
  Layers,
  Filter,
  Check,
  Sparkles,
  ExternalLink,
  ChevronRight,
  ShieldAlert
} from 'lucide-react';

interface AccountNotesViewProps {
  notes: AccountNote[];
  platformAccounts: PlatformAccount[];
  onAddNote: (preselectedPlatformAccountId?: string) => void;
  onEditNote: (note: AccountNote) => void;
  onDeleteNote: (id: string) => void;
  onToggleReminderStatus: (id: string) => void;
  onNavigateCalendar?: (date?: string) => void;
}

export const AccountNotesView: React.FC<AccountNotesViewProps> = ({
  notes,
  platformAccounts,
  onAddNote,
  onEditNote,
  onDeleteNote,
  onToggleReminderStatus,
  onNavigateCalendar,
}) => {
  const [selectedPlatform, setSelectedPlatform] = useState<string>('All');
  const [selectedAccountId, setSelectedAccountId] = useState<string>('All');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedPriority, setSelectedPriority] = useState<string>('All');
  const [reminderFilter, setReminderFilter] = useState<'All' | 'active_reminder' | 'completed_reminder' | 'no_reminder'>('All');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [noteToDelete, setNoteToDelete] = useState<{ id: string; title: string } | null>(null);

  // Extract distinct platforms for top filter pills
  const platformsList = useMemo(() => {
    const list = Array.from(new Set(platformAccounts.map(p => p.platform)));
    return ['All', ...list];
  }, [platformAccounts]);

  // Accounts list based on selected platform
  const availableAccounts = useMemo(() => {
    if (selectedPlatform === 'All') return platformAccounts;
    return platformAccounts.filter(p => p.platform === selectedPlatform);
  }, [platformAccounts, selectedPlatform]);

  // Filtered Notes
  const filteredNotes = useMemo(() => {
    return notes.filter(note => {
      // 1. Platform Filter
      if (selectedPlatform !== 'All') {
        const plat = platformAccounts.find(p => p.id === note.platformAccountId);
        if (!plat || plat.platform !== selectedPlatform) return false;
      }

      // 2. Account Filter
      if (selectedAccountId !== 'All' && note.platformAccountId !== selectedAccountId) {
        return false;
      }

      // 3. Category Filter
      if (selectedCategory !== 'All' && note.category !== selectedCategory) {
        return false;
      }

      // 4. Priority Filter
      if (selectedPriority !== 'All' && note.priority !== selectedPriority) {
        return false;
      }

      // 5. Reminder Filter
      if (reminderFilter === 'active_reminder') {
        if (!note.hasReminder || note.reminderStatus === 'Selesai') return false;
      } else if (reminderFilter === 'completed_reminder') {
        if (!note.hasReminder || note.reminderStatus !== 'Selesai') return false;
      } else if (reminderFilter === 'no_reminder') {
        if (note.hasReminder) return false;
      }

      // 6. Search Term
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const plat = platformAccounts.find(p => p.id === note.platformAccountId);
        const matchTitle = note.title.toLowerCase().includes(term);
        const matchContent = note.content.toLowerCase().includes(term);
        const matchPlatform = plat ? plat.platform.toLowerCase().includes(term) : false;
        const matchAccount = plat ? plat.accountName.toLowerCase().includes(term) : false;
        const matchTags = note.tags?.some(t => t.toLowerCase().includes(term)) || false;

        if (!matchTitle && !matchContent && !matchPlatform && !matchAccount && !matchTags) {
          return false;
        }
      }

      return true;
    });
  }, [notes, platformAccounts, selectedPlatform, selectedAccountId, selectedCategory, selectedPriority, reminderFilter, searchTerm]);

  // Metrics
  const activeRemindersCount = useMemo(() => {
    return notes.filter(n => n.hasReminder && n.reminderStatus !== 'Selesai').length;
  }, [notes]);

  const urgentNotesCount = useMemo(() => {
    return notes.filter(n => n.priority === 'Mendesak' || n.priority === 'Tinggi').length;
  }, [notes]);

  // Export to Excel
  const handleExportExcel = () => {
    const rows = filteredNotes.map((n, idx) => {
      const plat = platformAccounts.find(p => p.id === n.platformAccountId);
      return {
        No: idx + 1,
        'Judul Catatan': n.title,
        Platform: plat ? plat.platform : 'Umum / Master',
        'Nama Akun': plat ? plat.accountName : '-',
        Kategori: n.category,
        Prioritas: n.priority,
        'Isi Catatan': n.content,
        'Pengingat Aktif': n.hasReminder ? 'Ya' : 'Tidak',
        'Tanggal Pengingat': n.reminderDate || '-',
        'Waktu Pengingat': n.reminderTime || '-',
        'Status Pengingat': n.reminderStatus || '-',
        Tags: n.tags ? n.tags.join(', ') : '-',
        'Tanggal Dibuat': n.createdAt.split('T')[0],
      };
    });
    exportToExcel(rows, `Catatan_Akun_BigMA_${new Date().toISOString().split('T')[0]}`, 'Catatan Akun');
  };

  // Export to PDF
  const handleExportPdf = () => {
    const headers = ['No', 'Judul Catatan', 'Platform & Akun', 'Kategori', 'Prioritas', 'Pengingat', 'Ringkasan Catatan'];
    const rows = filteredNotes.map((n, idx) => {
      const plat = platformAccounts.find(p => p.id === n.platformAccountId);
      const reminderText = n.hasReminder 
        ? `${n.reminderDate || ''} (${n.reminderStatus || 'Pending'})` 
        : '-';
      return [
        idx + 1,
        n.title,
        plat ? `${plat.platform} (${plat.accountName})` : 'Umum',
        n.category,
        n.priority,
        reminderText,
        n.content.length > 80 ? `${n.content.substring(0, 80)}...` : n.content,
      ];
    });

    exportTableToPdf({
      title: 'Daftar Catatan & Pengingat Akun - BigMA',
      subtitle: `Total: ${filteredNotes.length} Catatan Terkategori`,
      filename: `Catatan_Akun_BigMA_${new Date().toISOString().split('T')[0]}`,
      headers,
      rows,
      orientation: 'landscape',
    });
  };

  return (
    <div className="space-y-6" id="account-notes-view-root">
      {/* Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-2xl font-sans font-extrabold text-white tracking-tight">Catatan &amp; Pengingat Akun</h2>
            <span className="px-2 py-0.5 rounded text-[10px] font-sans font-bold uppercase tracking-wider bg-amber-500/15 text-amber-300 border border-amber-500/30">
              Account Notes &amp; Reminders
            </span>
          </div>
          <p className="text-xs text-neutral-400 mt-1 max-w-2xl">
            Catatan teknis, memo kredensial, panduan upload, dan pengingat tanggal yang tersinkronisasi otomatis dengan kalender platform.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* View Toggle */}
          <div className="bg-neutral-900/80 p-1 rounded-lg border border-[#262626] flex items-center gap-1">
            <button
              onClick={() => setViewMode('cards')}
              className={`px-3 py-1.5 rounded-md text-xs font-sans font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === 'cards'
                  ? 'bg-amber-400 text-neutral-950 shadow-xs'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-800/50'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Kartu</span>
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`px-3 py-1.5 rounded-md text-xs font-sans font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-amber-400 text-neutral-950 shadow-xs'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-800/50'
              }`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Tabel</span>
            </button>
          </div>

          {notes.length > 0 && (
            <>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleExportExcel}
                className="px-3 py-2 bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-neutral-300 hover:text-white rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                id="export-excel-notes-btn"
                title="Ekspor Catatan ke Excel"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                <span>Excel</span>
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleExportPdf}
                className="px-3 py-2 bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-neutral-300 hover:text-white rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                id="export-pdf-notes-btn"
                title="Ekspor Catatan ke PDF"
              >
                <FileText className="w-3.5 h-3.5 text-rose-400" />
                <span>PDF</span>
              </motion.button>
            </>
          )}

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onAddNote(selectedAccountId !== 'All' ? selectedAccountId : undefined)}
            className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-neutral-950 rounded-lg text-xs font-sans font-bold flex items-center gap-1.5 transition-all shadow-md shadow-amber-500/20 cursor-pointer"
            id="add-account-note-btn"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Tambah Catatan Akun</span>
          </motion.button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-neutral-900/80 border border-[#262626] rounded-xl shadow-xs"
        >
          <div className="text-[10px] uppercase tracking-wider font-sans font-bold text-neutral-400">Total Catatan</div>
          <div className="text-2xl font-mono font-bold text-white mt-1">{notes.length}</div>
          <div className="text-[11px] text-neutral-400 mt-1">Dokumen &amp; instruksi tersimpan</div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="p-4 bg-neutral-900/80 border border-[#262626] rounded-xl shadow-xs"
        >
          <div className="text-[10px] uppercase tracking-wider font-sans font-bold text-neutral-400">Pengingat Kalender Aktif</div>
          <div className="text-2xl font-mono font-bold text-amber-400 mt-1">{activeRemindersCount}</div>
          <div className="text-[11px] text-amber-400/90 mt-1 flex items-center gap-1">
            <Bell className="w-3 h-3" /> Tersinkron ke kalender
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="p-4 bg-neutral-900/80 border border-[#262626] rounded-xl shadow-xs"
        >
          <div className="text-[10px] uppercase tracking-wider font-sans font-bold text-neutral-400">Prioritas Mendesak</div>
          <div className="text-2xl font-mono font-bold text-rose-400 mt-1">{urgentNotesCount}</div>
          <div className="text-[11px] text-rose-400/90 mt-1 flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" /> Memerlukan perhatian
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="p-4 bg-neutral-900/80 border border-[#262626] rounded-xl shadow-xs"
        >
          <div className="text-[10px] uppercase tracking-wider font-sans font-bold text-neutral-400">Akun Terkelola</div>
          <div className="text-2xl font-mono font-bold text-sky-400 mt-1">{platformAccounts.length}</div>
          <div className="text-[11px] text-sky-400/90 mt-1">Platform microstock &amp; konten</div>
        </motion.div>
      </div>

      {/* 1. Categorization by Platform: Horizontal Pills */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider font-sans">
            Kategori Per Platform:
          </span>
          <span className="text-[11px] text-neutral-500">
            {filteredNotes.length} catatan ditampilkan
          </span>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1.5 scrollbar-none">
          {platformsList.map((plat) => {
            const isSelected = selectedPlatform === plat;
            const count = plat === 'All' 
              ? notes.length 
              : notes.filter(n => {
                  const p = platformAccounts.find(x => x.id === n.platformAccountId);
                  return p && p.platform === plat;
                }).length;

            return (
              <button
                key={plat}
                type="button"
                onClick={() => {
                  setSelectedPlatform(plat);
                  setSelectedAccountId('All');
                }}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-sans font-bold whitespace-nowrap transition-all flex items-center gap-2 border cursor-pointer ${
                  isSelected
                    ? 'bg-amber-400 text-neutral-950 border-amber-400 shadow-sm shadow-amber-400/20'
                    : 'bg-neutral-900/80 text-neutral-300 border-[#262626] hover:border-neutral-700 hover:text-white'
                }`}
              >
                <span>{plat === 'All' ? 'Semua Platform' : plat}</span>
                <span className={`px-1.5 py-0.2 rounded text-[10px] font-mono ${
                  isSelected ? 'bg-neutral-950/20 text-neutral-950 font-bold' : 'bg-neutral-950 text-neutral-400 border border-[#333]'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Sub-filters & Search Bar */}
      <div className="p-3 bg-neutral-900/70 border border-[#262626] rounded-xl flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Sub-account selector */}
          <div className="flex items-center gap-1.5 text-xs text-neutral-400">
            <span className="text-[11px] font-medium">Akun:</span>
            <select
              value={selectedAccountId}
              onChange={(e) => setSelectedAccountId(e.target.value)}
              className="px-2.5 py-1.5 text-xs bg-neutral-950 border border-[#262626] rounded-lg text-neutral-200 focus:outline-hidden focus:border-amber-500/60"
            >
              <option value="All">Semua Akun ({selectedPlatform})</option>
              {availableAccounts.map(acc => (
                <option key={acc.id} value={acc.id}>
                  {acc.accountName} ({acc.usernameOrHandle})
                </option>
              ))}
            </select>
          </div>

          {/* Category Filter */}
          <div className="flex items-center gap-1.5 text-xs text-neutral-400">
            <span className="text-[11px] font-medium">Kategori:</span>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-2.5 py-1.5 text-xs bg-neutral-950 border border-[#262626] rounded-lg text-neutral-200 focus:outline-hidden focus:border-amber-500/60"
            >
              <option value="All">Semua Kategori</option>
              <option value="Strategi & Niche">Strategi &amp; Niche</option>
              <option value="Jadwal Konten">Jadwal Konten</option>
              <option value="Kredensial & PIN">Kredensial &amp; PIN</option>
              <option value="Peringatan & Rule">Peringatan &amp; Rule</option>
              <option value="Log Update">Log Update</option>
              <option value="Umum">Umum</option>
            </select>
          </div>

          {/* Reminder Status Filter */}
          <div className="flex items-center gap-1.5 text-xs text-neutral-400">
            <span className="text-[11px] font-medium">Pengingat:</span>
            <select
              value={reminderFilter}
              onChange={(e) => setReminderFilter(e.target.value as any)}
              className="px-2.5 py-1.5 text-xs bg-neutral-950 border border-[#262626] rounded-lg text-neutral-200 focus:outline-hidden focus:border-amber-500/60"
            >
              <option value="All">Semua Pengingat</option>
              <option value="active_reminder">Pengingat Aktif (Pending)</option>
              <option value="completed_reminder">Pengingat Selesai</option>
              <option value="no_reminder">Tanpa Pengingat</option>
            </select>
          </div>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-neutral-500" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cari judul, kata kunci, tag, atau isi..."
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-neutral-950 text-neutral-200 placeholder:text-neutral-600 border border-[#262626] rounded-lg focus:outline-hidden focus:border-amber-500/60"
          />
        </div>
      </div>

      {/* 3. Notes Display (Cards Mode) */}
      {viewMode === 'cards' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredNotes.map((note) => {
            const plat = platformAccounts.find(p => p.id === note.platformAccountId);
            const isReminderActive = note.hasReminder && note.reminderStatus !== 'Selesai';
            const urgency = note.reminderDate ? getDeadlineUrgency(note.reminderDate, note.reminderStatus === 'Selesai' ? 'Selesai' : 'Belum Selesai') : null;

            return (
              <motion.div
                key={note.id}
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-neutral-900/80 border border-[#262626] hover:border-neutral-700 rounded-xl p-4 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group relative"
                id={`note-card-${note.id}`}
              >
                <div>
                  {/* Card Header: Platform & Account Badge + Priority */}
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="px-2 py-0.5 rounded text-[10px] font-sans font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                        {plat ? plat.platform : 'Umum'}
                      </span>
                      {plat && (
                        <span className="text-[10px] text-neutral-400 font-mono">
                          {plat.accountName}
                        </span>
                      )}
                    </div>

                    <span className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase tracking-wider border ${
                      note.priority === 'Mendesak'
                        ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                        : note.priority === 'Tinggi'
                        ? 'bg-orange-500/20 text-orange-300 border-orange-500/40'
                        : note.priority === 'Sedang'
                        ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                        : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                    }`}>
                      {note.priority}
                    </span>
                  </div>

                  {/* Title */}
                  <h3 className="text-sm font-sans font-bold text-white leading-snug group-hover:text-amber-400 transition-colors">
                    {note.title}
                  </h3>

                  {/* Category Pill */}
                  <div className="text-[10px] text-neutral-400 font-medium mt-1">
                    Kategori: <span className="text-neutral-300">{note.category}</span>
                  </div>

                  {/* Body Content */}
                  <p className="text-xs text-neutral-300 mt-2.5 whitespace-pre-line line-clamp-4 leading-relaxed font-sans bg-neutral-950/60 p-2.5 rounded-lg border border-[#262626]/80">
                    {note.content}
                  </p>

                  {/* Tags */}
                  {note.tags && note.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2.5">
                      {note.tags.map((t, idx) => (
                        <span key={idx} className="px-1.5 py-0.5 rounded bg-neutral-950 text-[10px] text-neutral-400 border border-[#262626]">
                          #{t}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Card Footer: Reminder status & Actions */}
                <div className="mt-4 pt-3 border-t border-[#262626] flex items-center justify-between gap-2">
                  {/* Reminder Badge */}
                  {note.hasReminder && note.reminderDate ? (
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => onToggleReminderStatus(note.id)}
                        className={`p-1 rounded-md text-[11px] font-sans font-bold flex items-center gap-1 transition-colors cursor-pointer border ${
                          note.reminderStatus === 'Selesai'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 line-through'
                            : 'bg-amber-500/15 text-amber-300 border-amber-500/40 hover:bg-amber-500/25'
                        }`}
                        title={note.reminderStatus === 'Selesai' ? 'Pengingat selesai (klik untuk aktifkan kembali)' : 'Klik untuk tandai selesai'}
                      >
                        {note.reminderStatus === 'Selesai' ? (
                          <Check className="w-3.5 h-3.5" />
                        ) : (
                          <Bell className="w-3.5 h-3.5 animate-pulse" />
                        )}
                        <span>{formatDateIndo(note.reminderDate)}</span>
                      </button>

                      {onNavigateCalendar && (
                        <button
                          type="button"
                          onClick={() => onNavigateCalendar(note.reminderDate)}
                          className="p-1 text-neutral-400 hover:text-amber-400 transition-colors"
                          title="Lihat di Kalender"
                        >
                          <ExternalLink className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  ) : (
                    <span className="text-[10px] text-neutral-500 font-mono">Tanpa pengingat</span>
                  )}

                  {/* Actions */}
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => onEditNote(note)}
                      className="p-1.5 text-sky-400 hover:bg-neutral-800 rounded-lg transition-colors cursor-pointer"
                      title="Edit Catatan"
                      id={`edit-note-${note.id}`}
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setNoteToDelete({ id: note.id, title: note.title })}
                      className="p-1.5 text-rose-400 hover:bg-neutral-800 rounded-lg transition-colors cursor-pointer"
                      title="Hapus Catatan"
                      id={`del-note-${note.id}`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}

          {filteredNotes.length === 0 && (
            <div className="col-span-full py-16 text-center text-neutral-400">
              <div className="max-w-sm mx-auto flex flex-col items-center">
                <div className="w-14 h-14 rounded-2xl bg-neutral-900 border border-neutral-800 flex items-center justify-center mb-3 shadow-inner">
                  <StickyNote className="w-7 h-7 text-amber-400" />
                </div>
                <p className="font-sans font-bold text-base text-neutral-200">
                  {notes.length === 0 ? 'Belum Ada Catatan Akun' : 'Tidak Ada Catatan yang Cocok'}
                </p>
                <p className="text-xs text-neutral-400 mt-1 max-w-xs leading-relaxed">
                  {notes.length === 0
                    ? 'Tambahkan catatan kredensial, strategi niche, atau pengingat jadwal upload per platform.'
                    : 'Coba sesuaikan filter platform, kategori, atau kata kunci pencarian.'}
                </p>
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => onAddNote(selectedAccountId !== 'All' ? selectedAccountId : undefined)}
                  className="mt-4 px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 text-neutral-950 rounded-lg text-xs font-sans font-bold flex items-center gap-1.5 shadow-md shadow-amber-500/20 cursor-pointer"
                >
                  <Plus className="w-4 h-4 stroke-[3]" />
                  <span>Tambah Catatan Pertama</span>
                </motion.button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 4. Notes Display (Table Mode) */}
      {viewMode === 'table' && (
        <div className="bg-neutral-900/70 border border-[#262626] rounded-xl shadow-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-neutral-950/80 text-neutral-400 uppercase tracking-wider text-[10px] font-sans font-bold border-b border-[#262626]">
                  <th className="py-3 px-3.5 w-12 text-center">No</th>
                  <th className="py-3 px-3.5 min-w-[200px]">Judul Catatan</th>
                  <th className="py-3 px-3.5 min-w-[160px]">Platform &amp; Akun</th>
                  <th className="py-3 px-3.5 min-w-[130px]">Kategori</th>
                  <th className="py-3 px-3.5 min-w-[110px]">Prioritas</th>
                  <th className="py-3 px-3.5 min-w-[160px]">Pengingat Kalender</th>
                  <th className="py-3 px-3.5 min-w-[220px]">Ringkasan Isi</th>
                  <th className="py-3 px-3.5 w-24 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#262626]/70">
                {filteredNotes.map((note, index) => {
                  const plat = platformAccounts.find(p => p.id === note.platformAccountId);

                  return (
                    <tr key={note.id} className="hover:bg-neutral-900/60 transition-colors">
                      <td className="py-3 px-3.5 text-center font-mono text-neutral-500">
                        {index + 1}
                      </td>

                      <td className="py-3 px-3.5 font-semibold text-neutral-100">
                        <div>{note.title}</div>
                        {note.tags && note.tags.length > 0 && (
                          <div className="text-[10px] text-neutral-500 mt-0.5">
                            {note.tags.join(', ')}
                          </div>
                        )}
                      </td>

                      <td className="py-3 px-3.5">
                        {plat ? (
                          <div>
                            <div className="font-semibold text-amber-400 text-[11px]">{plat.platform}</div>
                            <div className="text-[10px] text-neutral-400 font-mono">{plat.accountName}</div>
                          </div>
                        ) : (
                          <span className="text-neutral-500 italic text-[11px]">Umum Master</span>
                        )}
                      </td>

                      <td className="py-3 px-3.5 text-neutral-300">
                        {note.category}
                      </td>

                      <td className="py-3 px-3.5">
                        <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider border ${
                          note.priority === 'Mendesak'
                            ? 'bg-rose-500/15 text-rose-400 border-rose-500/30'
                            : note.priority === 'Tinggi'
                            ? 'bg-orange-500/15 text-orange-400 border-orange-500/30'
                            : note.priority === 'Sedang'
                            ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                            : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                        }`}>
                          {note.priority}
                        </span>
                      </td>

                      <td className="py-3 px-3.5">
                        {note.hasReminder && note.reminderDate ? (
                          <button
                            type="button"
                            onClick={() => onToggleReminderStatus(note.id)}
                            className={`px-2 py-1 rounded text-[10px] font-sans font-bold flex items-center gap-1.5 border cursor-pointer ${
                              note.reminderStatus === 'Selesai'
                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 line-through'
                                : 'bg-amber-500/15 text-amber-300 border-amber-500/40'
                            }`}
                          >
                            <Bell className="w-3 h-3" />
                            <span>{formatDateIndo(note.reminderDate)}</span>
                          </button>
                        ) : (
                          <span className="text-neutral-500 text-[11px]">-</span>
                        )}
                      </td>

                      <td className="py-3 px-3.5 text-neutral-300">
                        <p className="line-clamp-2">{note.content}</p>
                      </td>

                      <td className="py-3 px-3.5 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            type="button"
                            onClick={() => onEditNote(note)}
                            className="p-1.5 text-sky-400 hover:bg-neutral-800 rounded-lg transition-colors cursor-pointer"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setNoteToDelete({ id: note.id, title: note.title })}
                            className="p-1.5 text-rose-400 hover:bg-neutral-800 rounded-lg transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={!!noteToDelete}
        onClose={() => setNoteToDelete(null)}
        onConfirm={() => {
          if (noteToDelete) {
            onDeleteNote(noteToDelete.id);
          }
        }}
        title="Hapus Catatan Akun"
        message="Apakah Anda yakin ingin menghapus catatan akun ini beserta jadwal pengingatnya?"
        itemName={noteToDelete?.title}
        confirmLabel="Ya, Hapus Catatan"
      />
    </div>
  );
};
