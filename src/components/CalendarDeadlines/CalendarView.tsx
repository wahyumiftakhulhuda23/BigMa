import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ProjectDeadline, PlatformAccount } from '../../types';
import { exportToExcel, exportTableToPdf } from '../../utils/exportUtils';
import { formatCurrency, formatDateIndo, getDeadlineUrgency } from '../../utils/formatters';
import { ConfirmModal } from '../ConfirmModal';
import { 
  Calendar as CalendarIcon, 
  Plus, 
  Search, 
  FileSpreadsheet, 
  FileText, 
  ChevronLeft, 
  ChevronRight, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  ListFilter, 
  Grid3X3, 
  Edit3, 
  Trash2,
  Check,
  Bell,
  Sparkles
} from 'lucide-react';

interface CalendarViewProps {
  deadlines: ProjectDeadline[];
  platformAccounts: PlatformAccount[];
  onAddDeadline: (preselectedDate?: string) => void;
  onEditDeadline: (deadline: ProjectDeadline) => void;
  onDeleteDeadline: (id: string) => void;
  onToggleStatus: (id: string, newStatus: 'Belum Selesai' | 'Dalam Proses' | 'Selesai') => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({
  deadlines,
  platformAccounts,
  onAddDeadline,
  onEditDeadline,
  onDeleteDeadline,
  onToggleStatus,
}) => {
  const [viewMode, setViewMode] = useState<'calendar' | 'table'>('calendar');
  const [currentDate, setCurrentDate] = useState<Date>(new Date(2026, 8, 3)); // Current date Sept 3, 2026
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPriority, setFilterPriority] = useState<string>('All');
  const [deadlineToDelete, setDeadlineToDelete] = useState<{ id: string; name: string } | null>(null);

  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth(); // 0-indexed

  // Month navigation
  const prevMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date(2026, 8, 3));
  };

  // Calendar matrix calculations
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
  const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0);

  // Day of week index for Monday start (0: Mon, 1: Tue, ..., 6: Sun)
  let startDayOfWeek = firstDayOfMonth.getDay() - 1;
  if (startDayOfWeek === -1) startDayOfWeek = 6;

  const totalDays = lastDayOfMonth.getDate();

  // Days array for calendar
  const calendarCells: { dateStr: string; dayNumber: number; isCurrentMonth: boolean }[] = [];

  // Previous month filler days
  const prevMonthLastDay = new Date(currentYear, currentMonth, 0).getDate();
  for (let i = startDayOfWeek - 1; i >= 0; i--) {
    const day = prevMonthLastDay - i;
    const prevDate = new Date(currentYear, currentMonth - 1, day);
    const dateStr = prevDate.toISOString().split('T')[0];
    calendarCells.push({ dateStr, dayNumber: day, isCurrentMonth: false });
  }

  // Current month days
  for (let day = 1; day <= totalDays; day++) {
    const d = new Date(currentYear, currentMonth, day);
    const mStr = String(currentMonth + 1).padStart(2, '0');
    const dStr = String(day).padStart(2, '0');
    const dateStr = `${currentYear}-${mStr}-${dStr}`;
    calendarCells.push({ dateStr, dayNumber: day, isCurrentMonth: true });
  }

  // Next month filler days to complete 35 or 42 grid cells
  const remainingCells = (7 - (calendarCells.length % 7)) % 7;
  for (let day = 1; day <= remainingCells; day++) {
    const nextDate = new Date(currentYear, currentMonth + 1, day);
    const dateStr = nextDate.toISOString().split('T')[0];
    calendarCells.push({ dateStr, dayNumber: day, isCurrentMonth: false });
  }

  // Active / Urgent Deadlines
  const urgentItems = deadlines
    .filter(d => d.status !== 'Selesai')
    .map(d => ({ ...d, urgency: getDeadlineUrgency(d.dueDate, d.status) }))
    .filter(d => d.urgency.daysRemaining <= 3)
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate));

  // Filtered Deadlines for Table View
  const filteredDeadlines = deadlines.filter(d => {
    if (filterPriority !== 'All' && d.priority !== filterPriority) return false;

    const plat = d.platformAccountId ? platformAccounts.find(p => p.id === d.platformAccountId) : null;
    const term = searchTerm.toLowerCase();

    return (
      d.title.toLowerCase().includes(term) ||
      (d.targetQuantity && d.targetQuantity.toLowerCase().includes(term)) ||
      (d.notes && d.notes.toLowerCase().includes(term)) ||
      (plat && plat.accountName.toLowerCase().includes(term)) ||
      (plat && plat.platform.toLowerCase().includes(term))
    );
  });

  const monthName = currentDate.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
  const todayStr = '2026-09-03';

  // Export handlers
  const handleExportExcel = () => {
    const rows = filteredDeadlines.map((d, idx) => {
      const plat = d.platformAccountId ? platformAccounts.find(p => p.id === d.platformAccountId) : null;
      return {
        No: idx + 1,
        'Judul Proyek / Tugas': d.title,
        Platform: plat?.platform || 'Umum',
        'Akun Terkait': plat?.accountName || '-',
        'Tenggat Waktu': d.dueDate,
        Prioritas: d.priority,
        Status: d.status,
        'Target Kuantitas': d.targetQuantity || '-',
        Catatan: d.notes || '-',
      };
    });
    exportToExcel(rows, `Jadwal_Tenggat_Waktu_BigMA_${new Date().toISOString().split('T')[0]}`, 'Tenggat Waktu');
  };

  const handleExportPdf = () => {
    const headers = ['No', 'Judul Proyek', 'Platform', 'Tenggat Waktu', 'Prioritas', 'Status', 'Target'];
    const rows = filteredDeadlines.map((d, idx) => {
      const plat = d.platformAccountId ? platformAccounts.find(p => p.id === d.platformAccountId) : null;
      return [
        idx + 1,
        d.title,
        plat ? `${plat.platform} (${plat.accountName})` : 'Umum',
        formatDateIndo(d.dueDate),
        d.priority,
        d.status,
        d.targetQuantity || '-',
      ];
    });

    exportTableToPdf({
      title: 'Jadwal Tenggat Waktu Proyek - BigMA',
      subtitle: `Target & Kalender Konten (Total: ${deadlines.length} Tugas, Selesai: ${deadlines.filter(x => x.status === 'Selesai').length})`,
      filename: `Jadwal_Tenggat_Waktu_BigMA_${new Date().toISOString().split('T')[0]}`,
      headers,
      rows,
      orientation: 'landscape',
    });
  };

  return (
    <div className="space-y-6" id="calendar-deadlines-root">
      {/* Header & Main Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-2xl font-sans font-extrabold text-white tracking-tight">Kalender &amp; Tenggat Waktu</h2>
            <span className="px-2 py-0.5 rounded text-[10px] font-sans font-bold uppercase tracking-wider bg-purple-500/15 text-purple-300 border border-purple-500/30">
              Schedule &amp; Tasks
            </span>
          </div>
          <p className="text-xs text-neutral-400 mt-1 max-w-2xl">
            Atur jadwal upload video YouTube, batch submission aset microstock, target kuantitas konten, dan pengingat deadline mendesak.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* View Toggle (Grid vs Table) */}
          <div className="bg-neutral-900/80 p-1 rounded-lg border border-[#262626] flex items-center gap-1">
            <button
              onClick={() => setViewMode('calendar')}
              className={`px-3 py-1.5 rounded-md text-xs font-sans font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === 'calendar'
                  ? 'bg-amber-400 text-neutral-950 shadow-xs'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-800/50'
              }`}
            >
              <Grid3X3 className="w-3.5 h-3.5" />
              <span>Kalender</span>
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`px-3 py-1.5 rounded-md text-xs font-sans font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-amber-400 text-neutral-950 shadow-xs'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-800/50'
              }`}
            >
              <ListFilter className="w-3.5 h-3.5" />
              <span>Daftar Tabel</span>
            </button>
          </div>

          {deadlines.length > 0 && (
            <>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleExportExcel}
                className="px-3 py-2 bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-neutral-300 hover:text-white rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                id="export-excel-calendar-btn"
                title="Ekspor Jadwal ke Excel"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                <span>Excel</span>
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleExportPdf}
                className="px-3 py-2 bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-neutral-300 hover:text-white rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                id="export-pdf-calendar-btn"
                title="Ekspor Jadwal ke PDF"
              >
                <FileText className="w-3.5 h-3.5 text-rose-400" />
                <span>PDF</span>
              </motion.button>
            </>
          )}

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onAddDeadline()}
            className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-neutral-950 rounded-lg text-xs font-sans font-bold flex items-center gap-1.5 transition-all shadow-md shadow-amber-500/20 cursor-pointer"
            id="add-deadline-btn"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Tambah Tenggat Waktu</span>
          </motion.button>
        </div>
      </div>

      {/* Summary KPI Cards with Motion */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        <motion.div 
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="p-4 bg-neutral-900/80 border border-[#262626] rounded-xl shadow-xs hover:border-neutral-700 transition-colors"
        >
          <div className="text-[10px] uppercase tracking-wider font-sans font-bold text-neutral-400">Total Tugas Terjadwal</div>
          <div className="text-2xl font-mono font-bold text-white mt-1">{deadlines.length}</div>
          <div className="text-[11px] text-neutral-400 mt-1">
            Target produksi &amp; batch upload
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="p-4 bg-neutral-900/80 border border-[#262626] rounded-xl shadow-xs hover:border-neutral-700 transition-colors"
        >
          <div className="text-[10px] uppercase tracking-wider font-sans font-bold text-neutral-400">Dalam Pengerjaan</div>
          <div className="text-2xl font-mono font-bold text-sky-400 mt-1">
            {deadlines.filter(d => d.status === 'Dalam Proses').length}
          </div>
          <div className="text-[11px] text-sky-400 mt-1">
            Sedang diproses studio
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="p-4 bg-neutral-900/80 border border-[#262626] rounded-xl shadow-xs hover:border-neutral-700 transition-colors"
        >
          <div className="text-[10px] uppercase tracking-wider font-sans font-bold text-neutral-400">Mendesak / Lewat Batas</div>
          <div className="text-2xl font-mono font-bold text-rose-400 mt-1">
            {urgentItems.length}
          </div>
          <div className="text-[11px] text-rose-400 mt-1 flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" /> Memerlukan aksi segera
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="p-4 bg-neutral-900/80 border border-[#262626] rounded-xl shadow-xs hover:border-neutral-700 transition-colors"
        >
          <div className="text-[10px] uppercase tracking-wider font-sans font-bold text-neutral-400">Selesai (Done)</div>
          <div className="text-2xl font-mono font-bold text-emerald-400 mt-1">
            {deadlines.filter(d => d.status === 'Selesai').length}
          </div>
          <div className="text-[11px] text-emerald-400 mt-1 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> Target terpenuhi
          </div>
        </motion.div>
      </div>

      {/* Urgent Warning Banner */}
      {urgentItems.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-start gap-3"
        >
          <Bell className="w-5 h-5 text-rose-400 shrink-0 mt-0.5 animate-bounce" />
          <div className="flex-1">
            <h4 className="text-xs font-sans font-bold text-rose-300">
              Perhatian: Terdapat {urgentItems.length} target deadline mendesak atau terlewat!
            </h4>
            <p className="text-xs text-neutral-400 mt-0.5">
              Segera selesaikan target proyek BigMA berikut:
            </p>
            <div className="flex flex-wrap gap-2 mt-2">
              {urgentItems.map(item => {
                const urgency = getDeadlineUrgency(item.dueDate, item.status);
                return (
                  <div
                    key={item.id}
                    className="px-2.5 py-1 rounded bg-neutral-900 border border-[#333] text-xs font-medium text-neutral-200 flex items-center gap-2 shadow-xs"
                  >
                    <span className="font-medium">{item.title}</span>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono font-semibold ${urgency.badgeColor}`}>
                      {urgency.label}
                    </span>
                    <button
                      onClick={() => onToggleStatus(item.id, 'Selesai')}
                      className="text-emerald-400 hover:text-emerald-300 text-[11px] font-medium underline cursor-pointer"
                    >
                      Selesai
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </motion.div>
      )}

      {/* 1. INTERACTIVE MONTHLY CALENDAR VIEW */}
      {viewMode === 'calendar' && (
        <div className="bg-neutral-900/70 border border-[#262626] rounded-xl shadow-xl overflow-hidden">
          {/* Calendar Month Navigation Header */}
          <div className="p-3.5 bg-neutral-950/80 border-b border-[#262626] text-white flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CalendarIcon className="w-4 h-4 text-amber-400" />
              <h3 className="font-sans font-bold text-base capitalize tracking-wide text-neutral-100">{monthName}</h3>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                onClick={goToToday}
                className="px-3 py-1 bg-neutral-900 hover:bg-neutral-800 text-xs font-sans font-semibold rounded-lg text-neutral-300 border border-[#333] transition-colors cursor-pointer"
              >
                Hari Ini
              </button>
              <button
                onClick={prevMonth}
                className="p-1.5 rounded-lg hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors cursor-pointer"
                title="Bulan Sebelumnya"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={nextMonth}
                className="p-1.5 rounded-lg hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors cursor-pointer"
                title="Bulan Berikutnya"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Days of week header */}
          <div className="grid grid-cols-7 border-b border-[#262626] bg-neutral-950/50 text-neutral-400 text-[11px] font-sans font-bold uppercase tracking-wider text-center py-2.5">
            <div>Senin</div>
            <div>Selasa</div>
            <div>Rabu</div>
            <div>Kamis</div>
            <div>Jumat</div>
            <div>Sabtu</div>
            <div>Minggu</div>
          </div>

          {/* Calendar Day Cells Grid */}
          <div className="grid grid-cols-7 divide-x divide-y divide-[#262626] bg-[#262626]">
            {calendarCells.map((cell, idx) => {
              const dayDeadlines = deadlines.filter(d => d.dueDate === cell.dateStr);
              const isToday = cell.dateStr === todayStr;

              return (
                <div
                  key={idx}
                  className={`min-h-[110px] p-2 bg-neutral-950/90 flex flex-col justify-between transition-colors group relative ${
                    !cell.isCurrentMonth ? 'bg-neutral-950/40 text-neutral-600' : ''
                  }`}
                  id={`cal-cell-${cell.dateStr}`}
                >
                  {/* Cell Top: Day number & Quick add trigger */}
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs font-mono font-bold w-6 h-6 flex items-center justify-center rounded-full ${
                        isToday
                          ? 'bg-amber-400 text-neutral-950 font-bold shadow-xs'
                          : cell.isCurrentMonth
                          ? 'text-neutral-200'
                          : 'text-neutral-600'
                      }`}
                    >
                      {cell.dayNumber}
                    </span>

                    <button
                      onClick={() => onAddDeadline(cell.dateStr)}
                      className="opacity-0 group-hover:opacity-100 p-0.5 rounded text-neutral-500 hover:text-amber-400 hover:bg-neutral-800 transition-all cursor-pointer"
                      title="Tambah deadline di tanggal ini"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Deadline badges in day cell */}
                  <div className="space-y-1 my-1 overflow-y-auto max-h-[85px] scrollbar-none">
                    {dayDeadlines.map(item => {
                      const urgency = getDeadlineUrgency(item.dueDate, item.status);
                      const isComplete = item.status === 'Selesai';
                      const plat = item.platformAccountId ? platformAccounts.find(p => p.id === item.platformAccountId) : null;

                      return (
                        <div
                          key={item.id}
                          onClick={() => onEditDeadline(item)}
                          className={`p-1.5 rounded text-[10px] font-medium border cursor-pointer transition shadow-xs hover:border-amber-500/50 ${
                            isComplete
                              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400/70 line-through'
                              : urgency.isOverdue
                              ? 'bg-rose-500/15 border-rose-500/30 text-rose-300'
                              : urgency.daysRemaining === 0
                              ? 'bg-amber-500/20 border-amber-500/50 text-amber-300 font-bold'
                              : 'bg-neutral-900 border-[#333] text-neutral-200'
                          }`}
                          title={`${item.title} (${item.priority})`}
                        >
                          <div className="truncate font-medium leading-tight">{item.title}</div>
                          {plat && (
                            <div className="text-[9px] text-amber-400/80 truncate font-mono">{plat.platform}</div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Cell Bottom Empty Spacer */}
                  <div />
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 2. DETAILED LIST / TABLE VIEW */}
      {viewMode === 'table' && (
        <div className="space-y-4">
          {/* Table Search and Filter */}
          <div className="bg-neutral-900/70 p-2.5 rounded-xl border border-[#262626] shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs text-neutral-400 font-medium">Filter Prioritas:</span>
              <select
                value={filterPriority}
                onChange={(e) => setFilterPriority(e.target.value)}
                className="px-2.5 py-1.5 text-xs bg-neutral-950 border border-[#262626] rounded-lg focus:outline-hidden font-medium text-neutral-300"
              >
                <option value="All">Semua Prioritas</option>
                <option value="Rendah">Rendah</option>
                <option value="Sedang">Sedang</option>
                <option value="Tinggi">Tinggi</option>
                <option value="Mendesak">Mendesak</option>
              </select>
            </div>

            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-neutral-500" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Cari judul proyek, target kuantitas, platform..."
                className="w-full pl-9 pr-4 py-1.5 text-xs bg-neutral-950 text-neutral-200 placeholder:text-neutral-600 border border-[#262626] rounded-lg focus:outline-hidden focus:border-amber-500/60 transition-colors"
                id="search-calendar-input"
              />
            </div>
          </div>

          {/* Table */}
          <div className="bg-neutral-900/70 border border-[#262626] rounded-xl shadow-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse" id="table-deadlines-schedule">
                <thead>
                  <tr className="bg-neutral-950/80 text-neutral-400 uppercase tracking-wider text-[10px] font-sans font-bold border-b border-[#262626]">
                    <th className="py-3 px-3.5 w-12 text-center">No</th>
                    <th className="py-3 px-3.5 min-w-[220px]">Judul Tugas / Proyek</th>
                    <th className="py-3 px-3.5 min-w-[170px]">Platform &amp; Akun</th>
                    <th className="py-3 px-3.5 min-w-[150px]">Tenggat Waktu</th>
                    <th className="py-3 px-3.5 min-w-[110px]">Prioritas</th>
                    <th className="py-3 px-3.5 min-w-[150px]">Status</th>
                    <th className="py-3 px-3.5 min-w-[130px]">Target Kuantitas</th>
                    <th className="py-3 px-3.5 w-24 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#262626]/70">
                  {filteredDeadlines.map((dl, index) => {
                    const plat = dl.platformAccountId ? platformAccounts.find(p => p.id === dl.platformAccountId) : null;
                    const urgency = getDeadlineUrgency(dl.dueDate, dl.status);

                    return (
                      <tr key={dl.id} className="hover:bg-neutral-900/60 transition-colors" id={`row-deadline-${dl.id}`}>
                        {/* No */}
                        <td className="py-3 px-3.5 text-center font-mono text-neutral-500">
                          {index + 1}
                        </td>

                        {/* Title */}
                        <td className="py-3 px-3.5">
                          <div className={`font-semibold text-neutral-100 text-sm ${dl.status === 'Selesai' ? 'line-through text-neutral-500' : ''}`}>
                            {dl.title}
                          </div>
                          {dl.notes && (
                            <p className="text-[10px] text-neutral-400 mt-0.5 line-clamp-1">{dl.notes}</p>
                          )}
                        </td>

                        {/* Platform & Account */}
                        <td className="py-3 px-3.5">
                          {plat ? (
                            <div>
                              <div className="font-semibold text-amber-400 text-[11px]">{plat.platform}</div>
                              <div className="text-[10px] text-neutral-400 font-mono">{plat.accountName}</div>
                            </div>
                          ) : (
                            <span className="text-neutral-500 text-[11px] italic">Umum BigMA</span>
                          )}
                        </td>

                        {/* Tenggat Waktu & Urgensi */}
                        <td className="py-3 px-3.5 space-y-1">
                          <div className="font-mono text-neutral-300 font-medium">{formatDateIndo(dl.dueDate)}</div>
                          <span className={`inline-block px-2 py-0.5 rounded text-[10px] border font-mono ${urgency.badgeColor}`}>
                            {urgency.label}
                          </span>
                        </td>

                        {/* Prioritas */}
                        <td className="py-3 px-3.5">
                          <span className={`inline-block px-2.5 py-1 rounded text-[10px] font-mono font-semibold uppercase tracking-wider border ${
                            dl.priority === 'Mendesak'
                              ? 'bg-rose-500/15 text-rose-400 border-rose-500/30'
                              : dl.priority === 'Tinggi'
                              ? 'bg-orange-500/15 text-orange-400 border-orange-500/30'
                              : dl.priority === 'Sedang'
                              ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                              : 'bg-neutral-800 text-neutral-300 border-neutral-700'
                          }`}>
                            {dl.priority}
                          </span>
                        </td>

                        {/* Status dropdown */}
                        <td className="py-3 px-3.5">
                          <select
                            value={dl.status}
                            onChange={(e) => onToggleStatus(dl.id, e.target.value as any)}
                            className={`px-2 py-1 text-xs font-semibold rounded-lg border focus:outline-hidden ${
                              dl.status === 'Selesai'
                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                                : dl.status === 'Dalam Proses'
                                ? 'bg-sky-500/10 text-sky-400 border-sky-500/30'
                                : 'bg-neutral-950 text-neutral-300 border-[#333]'
                            }`}
                          >
                            <option value="Belum Selesai" className="bg-neutral-900 text-neutral-200">Belum Selesai</option>
                            <option value="Dalam Proses" className="bg-neutral-900 text-neutral-200">Dalam Proses</option>
                            <option value="Selesai" className="bg-neutral-900 text-neutral-200">Selesai</option>
                          </select>
                        </td>

                        {/* Target Kuantitas */}
                        <td className="py-3 px-3.5 font-mono text-neutral-300 text-xs">
                          {dl.targetQuantity || '-'}
                        </td>

                        {/* Aksi */}
                        <td className="py-3 px-3.5 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              type="button"
                              onClick={() => onEditDeadline(dl)}
                              className="p-1.5 text-sky-400 hover:bg-neutral-800 rounded-lg transition-colors cursor-pointer"
                              title="Edit Tenggat Waktu"
                              id={`edit-deadline-${dl.id}`}
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeadlineToDelete({ id: dl.id, name: `${dl.title} (${formatDateIndo(dl.dueDate)})` })}
                              className="p-1.5 text-rose-400 hover:bg-neutral-800 rounded-lg transition-colors cursor-pointer"
                              title="Hapus Tenggat Waktu"
                              id={`del-deadline-${dl.id}`}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}

                  {filteredDeadlines.length === 0 && (
                    <tr>
                      <td colSpan={8} className="py-16 text-center text-neutral-400">
                        <motion.div 
                          initial={{ scale: 0.9, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ duration: 0.3 }}
                          className="max-w-sm mx-auto flex flex-col items-center"
                        >
                          <div className="w-14 h-14 rounded-2xl bg-neutral-900 border border-neutral-800 flex items-center justify-center mb-3 shadow-inner">
                            <Clock className="w-7 h-7 text-purple-400" />
                          </div>
                          <p className="font-sans font-bold text-base text-neutral-200">
                            {deadlines.length === 0 ? 'Belum Ada Jadwal Tenggat Waktu' : 'Tidak Ada Tugas yang Cocok'}
                          </p>
                          <p className="text-xs text-neutral-400 mt-1 max-w-xs leading-relaxed">
                            {deadlines.length === 0 
                              ? 'Tambahkan jadwal deadline proyek, batch submission aset, atau target upload konten.'
                              : 'Coba sesuaikan filter prioritas atau kata kunci pencarian.'}
                          </p>
                          <motion.button
                            whileHover={{ scale: 1.03 }}
                            whileTap={{ scale: 0.97 }}
                            onClick={() => onAddDeadline()}
                            className="mt-4 px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 text-neutral-950 rounded-lg text-xs font-sans font-bold flex items-center gap-1.5 shadow-md shadow-amber-500/20 cursor-pointer"
                          >
                            <Plus className="w-4 h-4 stroke-[3]" />
                            <span>Tambah Tenggat Waktu Pertama</span>
                          </motion.button>
                        </motion.div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal for Deleting Deadline */}
      <ConfirmModal
        isOpen={!!deadlineToDelete}
        onClose={() => setDeadlineToDelete(null)}
        onConfirm={() => {
          if (deadlineToDelete) {
            onDeleteDeadline(deadlineToDelete.id);
          }
        }}
        title="Hapus Tenggat Waktu Proyek"
        message="Apakah Anda yakin ingin menghapus jadwal tenggat waktu ini dari kalender dan database target?"
        itemName={deadlineToDelete?.name}
        confirmLabel="Ya, Hapus Tenggat"
      />
    </div>
  );
};
