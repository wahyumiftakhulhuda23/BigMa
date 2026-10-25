import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  PlatformAccount, 
  GmailAccount, 
  YoutubeScheduleItem, 
  MonetizationStatus,
  UserRole
} from '../../types';
import { detectScheduleStatus } from '../../utils/scheduleDateDetector';
import { maskEmail, maskIfEmail } from '../../utils/maskUtils';
import { 
  PlaySquare, 
  Calendar, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  Save, 
  Plus, 
  Search, 
  ExternalLink, 
  Filter, 
  Sparkles, 
  Layers, 
  DollarSign, 
  TrendingUp, 
  Film, 
  FileVideo, 
  Check, 
  Edit3, 
  Copy,
  Info,
  ChevronRight,
  Flame,
  ArrowUpDown,
  Shield,
  Eye,
  EyeOff
} from 'lucide-react';

interface YoutubeScheduleViewProps {
  platformAccounts: PlatformAccount[];
  gmails: GmailAccount[];
  schedules: YoutubeScheduleItem[];
  onSaveSchedule: (schedule: YoutubeScheduleItem) => void;
  onSaveAllSchedules?: (schedules: YoutubeScheduleItem[]) => void;
  onAddYoutubeAccount?: () => void;
  onEditPlatformAccount?: (account: PlatformAccount) => void;
  onUpdateAccount?: (account: PlatformAccount) => void;
  userRole?: UserRole;
}

export const YoutubeScheduleView: React.FC<YoutubeScheduleViewProps> = ({
  platformAccounts,
  gmails,
  schedules,
  onSaveSchedule,
  onSaveAllSchedules,
  onAddYoutubeAccount,
  onEditPlatformAccount,
  onUpdateAccount,
  userRole,
}) => {
  // 1. Filter accounts that belong to YouTube
  const youtubeAccounts = useMemo(() => {
    return platformAccounts.filter(p => {
      if (userRole === 'guest' && p.isVisible === false) return false;
      const plat = (p.platform || '').toLowerCase();
      const custom = (p.customPlatformName || '').toLowerCase();
      return plat.includes('youtube') || custom.includes('youtube') || p.platform === 'YouTube';
    });
  }, [platformAccounts, userRole]);

  // 2. Map Gmail dictionary for quick lookup
  const gmailMap = useMemo(() => {
    const map = new Map<string, GmailAccount>();
    gmails.forEach(g => map.set(g.id, g));
    return map;
  }, [gmails]);

  // 3. Local working state for each row to enable inline editing and per-row save
  const [rowStates, setRowStates] = useState<{ [platId: string]: YoutubeScheduleItem }>({});
  const [savedRows, setSavedRows] = useState<{ [platId: string]: boolean }>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Local state for PIC to allow smooth inline editing by Admin without cursor lag
  const [picMap, setPicMap] = useState<Record<string, string>>({});

  useEffect(() => {
    setPicMap(prev => {
      const next: Record<string, string> = { ...prev };
      platformAccounts.forEach(account => {
        if (next[account.id] === undefined) {
          next[account.id] = account.pic || '';
        } else if (account.pic && (prev[account.id] === '' || prev[account.id] === undefined)) {
          next[account.id] = account.pic;
        }
      });
      return next;
    });
  }, [platformAccounts]);

  const handlePicChange = (account: PlatformAccount, newPic: string) => {
    setPicMap(prev => ({ ...prev, [account.id]: newPic }));
  };

  const handlePicBlur = (account: PlatformAccount) => {
    const currentVal = (picMap[account.id] ?? account.pic ?? '').trim();
    if (currentVal !== (account.pic || '')) {
      onUpdateAccount?.({ ...account, pic: currentVal });
    }
  };

  const handleToggleVisibility = (account: PlatformAccount) => {
    const isCurrentlyVisible = account.isVisible !== false;
    const nextVis = !isCurrentlyVisible;
    onUpdateAccount?.({ ...account, isVisible: nextVis });
  };

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'overdue' | 'today' | 'tomorrow' | 'upcoming' | 'none'>('all');
  const [monetFilter, setMonetFilter] = useState<'all' | MonetizationStatus>('all');
  const [picFilter, setPicFilter] = useState<string>('all');
  const [visibilityFilter, setVisibilityFilter] = useState<'all' | 'visible' | 'hidden'>('all');
  const [sortBy, setSortBy] = useState<'default' | 'date-asc' | 'date-desc' | 'draft-desc' | 'siap-desc'>('default');

  // Extract all distinct PICs available in current accounts
  const availablePics = useMemo(() => {
    const pics = new Set<string>();
    youtubeAccounts.forEach(acc => {
      const p = (acc.pic || '').trim();
      if (p) pics.add(p);
    });
    return Array.from(pics).sort((a, b) => a.localeCompare(b));
  }, [youtubeAccounts]);

  // Synchronize schedules into local row states
  useEffect(() => {
    const initialRows: { [platId: string]: YoutubeScheduleItem } = {};
    youtubeAccounts.forEach(account => {
      const existing = schedules.find(s => s.platformAccountId === account.id);
      if (existing) {
        initialRows[account.id] = { ...existing };
      } else {
        initialRows[account.id] = {
          id: `yt_${account.id}`,
          platformAccountId: account.id,
          jadwal: '',
          draft: 0,
          siapUpload: 0,
          monet: 'Tidak',
          jumlahBahan: 0,
          keterangan: '',
          updatedAt: new Date().toISOString(),
        };
      }
    });
    setRowStates(initialRows);
  }, [youtubeAccounts, schedules]);

  // Handle single field change for a row
  const handleFieldChange = <K extends keyof YoutubeScheduleItem>(
    platId: string,
    field: K,
    value: YoutubeScheduleItem[K]
  ) => {
    setRowStates(prev => {
      const current = prev[platId] || {
        id: `yt_${platId}`,
        platformAccountId: platId,
        jadwal: '',
        draft: 0,
        siapUpload: 0,
        monet: 'Tidak',
        jumlahBahan: 0,
        keterangan: '',
        updatedAt: new Date().toISOString(),
      };
      return {
        ...prev,
        [platId]: {
          ...current,
          [field]: value,
          updatedAt: new Date().toISOString(),
        },
      };
    });
    // Reset saved indicator for this row
    setSavedRows(prev => ({ ...prev, [platId]: false }));
  };


  // Save single row to cloud storage (persisting both schedule and PIC)
  const handleSaveRow = (platId: string) => {
    const item = rowStates[platId];
    if (item) {
      onSaveSchedule(item);
    }
    // Also persist PIC if updated
    const account = platformAccounts.find(a => a.id === platId);
    if (account && onUpdateAccount) {
      const currentPic = (picMap[platId] ?? account.pic ?? '').trim();
      if (currentPic !== (account.pic || '')) {
        onUpdateAccount({ ...account, pic: currentPic });
      }
    }
    setSavedRows(prev => ({ ...prev, [platId]: true }));
    setTimeout(() => {
      setSavedRows(prev => ({ ...prev, [platId]: false }));
    }, 2500);
  };

  // Save all modified rows & PICs
  const handleSaveAll = () => {
    const allItems: YoutubeScheduleItem[] = Object.values(rowStates);
    if (onSaveAllSchedules) {
      onSaveAllSchedules(allItems);
    } else {
      allItems.forEach(item => onSaveSchedule(item));
    }
    // Persist all modified PICs
    if (onUpdateAccount) {
      platformAccounts.forEach(account => {
        const currentPic = (picMap[account.id] ?? account.pic ?? '').trim();
        if (currentPic !== (account.pic || '')) {
          onUpdateAccount({ ...account, pic: currentPic });
        }
      });
    }
    const newSaved: { [platId: string]: boolean } = {};
    allItems.forEach(i => {
      newSaved[i.platformAccountId] = true;
    });
    setSavedRows(newSaved);
    setTimeout(() => setSavedRows({}), 2500);
  };

  // Copy email to clipboard
  const handleCopyEmail = (email: string, id: string) => {
    navigator.clipboard.writeText(email);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Calculate summary metrics
  const metrics = useMemo(() => {
    let totalSiap = 0;
    let totalDraft = 0;
    let totalBahan = 0;
    let overdueCount = 0;
    let todayCount = 0;
    let monetCount = 0;

    youtubeAccounts.forEach(acc => {
      const row = rowStates[acc.id];
      if (row) {
        totalSiap += Number(row.siapUpload) || 0;
        totalDraft += Number(row.draft) || 0;
        totalBahan += Number(row.jumlahBahan) || 0;
        if (row.monet === 'Ya') monetCount++;
        const status = detectScheduleStatus(row.jadwal);
        if (status.statusType === 'overdue') overdueCount++;
        if (status.statusType === 'today') todayCount++;
      }
    });

    return {
      totalChannels: youtubeAccounts.length,
      totalSiap,
      totalDraft,
      totalBahan,
      overdueCount,
      todayCount,
      monetCount,
    };
  }, [youtubeAccounts, rowStates]);

  // Filtered and sorted rows
  const filteredAccounts = useMemo(() => {
    return youtubeAccounts.filter(account => {
      const row = rowStates[account.id];
      const gmail = gmailMap.get(account.gmailId);
      const q = searchQuery.toLowerCase();

      // Search match
      const matchSearch = 
        !q ||
        account.accountName.toLowerCase().includes(q) ||
        account.usernameOrHandle.toLowerCase().includes(q) ||
        (gmail?.email || '').toLowerCase().includes(q) ||
        (row?.keterangan || '').toLowerCase().includes(q);

      if (!matchSearch) return false;

      // Status Filter
      if (statusFilter !== 'all') {
        const scheduleStatus = detectScheduleStatus(row?.jadwal);
        if (scheduleStatus.statusType !== statusFilter) return false;
      }

      // Monet Filter
      if (monetFilter !== 'all') {
        const currentMonet = row?.monet || 'Tidak';
        if (currentMonet !== monetFilter) return false;
      }

      // PIC Filter (available in both Admin and Guest modes)
      if (picFilter !== 'all') {
        const currentPic = (account.pic || '').trim().toLowerCase();
        if (picFilter === 'none') {
          if (currentPic !== '') return false;
        } else if (currentPic !== picFilter.toLowerCase()) {
          return false;
        }
      }

      // Visibility Filter (Admin only)
      if (userRole !== 'guest' && visibilityFilter !== 'all') {
        const isVis = account.isVisible !== false;
        if (visibilityFilter === 'visible' && !isVis) return false;
        if (visibilityFilter === 'hidden' && isVis) return false;
      }

      return true;
    }).sort((a, b) => {
      const rowA = rowStates[a.id];
      const rowB = rowStates[b.id];
      if (sortBy === 'draft-desc') {
        return (rowB?.draft || 0) - (rowA?.draft || 0);
      }
      if (sortBy === 'siap-desc') {
        return (rowB?.siapUpload || 0) - (rowA?.siapUpload || 0);
      }
      if (sortBy === 'date-asc') {
        const dateA = rowA?.jadwal || '9999';
        const dateB = rowB?.jadwal || '9999';
        return dateA.localeCompare(dateB);
      }
      if (sortBy === 'date-desc') {
        const dateA = rowA?.jadwal || '0000';
        const dateB = rowB?.jadwal || '0000';
        return dateB.localeCompare(dateA);
      }
      return 0;
    });
  }, [youtubeAccounts, rowStates, gmailMap, searchQuery, statusFilter, monetFilter, picFilter, visibilityFilter, sortBy, userRole]);

  return (
    <div className="space-y-4">
      {/* Header Banner - Clean, Minimal & High Efficiency */}
      <div className="rounded-2xl bg-gradient-to-r from-neutral-900 via-neutral-900 to-red-950/30 border border-neutral-800 p-4 sm:p-5 shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-600/20 border border-red-500/30 flex items-center justify-center text-red-500 shadow-inner">
              <PlaySquare className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-sans font-black text-white tracking-tight">
                  Penjadwalan YouTube
                </h2>
                {userRole === 'guest' && (
                  <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 font-mono text-[10px] font-bold">
                    Mode Guest
                  </span>
                )}
              </div>
              <p className="text-xs text-neutral-400 mt-0.5">
                Kelola jadwal upload, stok draft, status monetisasi, dan penanggung jawab (PIC).
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleSaveAll}
              className="px-3.5 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-neutral-200 border border-neutral-700 hover:border-neutral-500 text-xs font-bold flex items-center gap-2 shadow-sm transition-all cursor-pointer"
              id="yt-save-all-btn"
              title="Simpan seluruh baris ke Cloud"
            >
              <Save className="w-3.5 h-3.5 text-emerald-400" />
              <span>Simpan Semua</span>
            </motion.button>

            {userRole !== 'guest' && onAddYoutubeAccount && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onAddYoutubeAccount}
                className="px-3.5 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-red-900/30 transition-all cursor-pointer"
                id="yt-add-channel-btn"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah Channel</span>
              </motion.button>
            )}
          </div>
        </div>

        {/* Metrics Row - Compact & Informative */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 mt-4 pt-3.5 border-t border-neutral-800/80">
          <div className="p-2.5 rounded-xl bg-neutral-950/70 border border-neutral-800">
            <span className="text-[10px] uppercase font-bold text-neutral-400 block">Total Channel</span>
            <span className="text-lg font-mono font-black text-white mt-0.5 block">{metrics.totalChannels}</span>
          </div>

          <div className="p-2.5 rounded-xl bg-neutral-950/70 border border-neutral-800">
            <span className="text-[10px] uppercase font-bold text-neutral-400 block">Siap Upload</span>
            <span className="text-lg font-mono font-black text-emerald-400 mt-0.5 block flex items-center gap-1">
              <span>{metrics.totalSiap}</span>
              <span className="text-[10px] font-normal text-emerald-500/80">Video</span>
            </span>
          </div>

          <div className="p-2.5 rounded-xl bg-neutral-950/70 border border-neutral-800">
            <span className="text-[10px] uppercase font-bold text-neutral-400 block">Draft Konten</span>
            <span className="text-lg font-mono font-black text-sky-400 mt-0.5 block flex items-center gap-1">
              <span>{metrics.totalDraft}</span>
              <span className="text-[10px] font-normal text-sky-500/80">Draft</span>
            </span>
          </div>

          <div className="p-2.5 rounded-xl bg-neutral-950/70 border border-neutral-800">
            <span className="text-[10px] uppercase font-bold text-neutral-400 block">Total Bahan</span>
            <span className="text-lg font-mono font-black text-purple-400 mt-0.5 block">{metrics.totalBahan}</span>
          </div>

          <div className="p-2.5 rounded-xl bg-neutral-950/70 border border-neutral-800">
            <span className="text-[10px] uppercase font-bold text-neutral-400 block">Peringatan Jadwal</span>
            <span className={`text-lg font-mono font-black mt-0.5 block ${metrics.overdueCount > 0 ? 'text-rose-400' : 'text-neutral-400'}`}>
              {metrics.overdueCount} Terlewat
              {metrics.todayCount > 0 && <span className="text-[10px] text-amber-400 ml-1">({metrics.todayCount} Hari Ini)</span>}
            </span>
          </div>

          <div className="p-2.5 rounded-xl bg-neutral-950/70 border border-neutral-800">
            <span className="text-[10px] uppercase font-bold text-neutral-400 block">Monetisasi (Ya)</span>
            <span className="text-lg font-mono font-black text-amber-400 mt-0.5 block">{metrics.monetCount} Channel</span>
          </div>
        </div>
      </div>

      {/* Control Bar: Search & Compact Filters */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-2.5 p-3 rounded-xl bg-neutral-950/90 border border-neutral-800">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-3.5 h-3.5 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari channel, handle, email master..."
            className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg bg-neutral-900 border border-neutral-700 text-white placeholder-neutral-500 focus:outline-none focus:border-red-500"
            id="yt-search-input"
          />
        </div>

        {/* Filter Bar */}
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-none flex-wrap">
          {/* PIC Filter - BOTH ADMIN & GUEST */}
          <div className="flex items-center gap-1 bg-neutral-900 px-2 py-1 rounded-lg border border-neutral-700 text-xs">
            <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">PIC:</span>
            <select
              value={picFilter}
              onChange={(e) => setPicFilter(e.target.value)}
              className="bg-transparent text-xs text-amber-300 font-semibold focus:outline-none cursor-pointer pr-1"
              id="yt-filter-pic-select"
            >
              <option value="all" className="bg-neutral-900 text-white">Semua PIC</option>
              <option value="none" className="bg-neutral-900 text-neutral-400">Belum Diatur</option>
              {availablePics.map(pic => (
                <option key={pic} value={pic} className="bg-neutral-900 text-amber-300">{pic}</option>
              ))}
            </select>
          </div>

          {/* Visibility Filter - ADMIN ONLY */}
          {userRole !== 'guest' && (
            <div className="flex items-center gap-1 bg-neutral-900 px-2 py-1 rounded-lg border border-neutral-700 text-xs">
              <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">Visibilitas:</span>
              <select
                value={visibilityFilter}
                onChange={(e) => setVisibilityFilter(e.target.value as any)}
                className="bg-transparent text-xs text-emerald-300 font-semibold focus:outline-none cursor-pointer pr-1"
                id="yt-filter-vis-select"
              >
                <option value="all" className="bg-neutral-900 text-white">Semua</option>
                <option value="visible" className="bg-neutral-900 text-emerald-400">Ditampilkan</option>
                <option value="hidden" className="bg-neutral-900 text-neutral-400">Disembunyikan</option>
              </select>
            </div>
          )}

          {/* Status Filter */}
          <div className="flex items-center gap-1 bg-neutral-900 px-2 py-1 rounded-lg border border-neutral-700 text-xs">
            <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Jadwal:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="bg-transparent text-xs text-neutral-200 focus:outline-none cursor-pointer pr-1"
              id="yt-filter-status-select"
            >
              <option value="all" className="bg-neutral-900 text-white">Semua</option>
              <option value="overdue" className="bg-neutral-900 text-rose-400">⚠️ Terlewat</option>
              <option value="today" className="bg-neutral-900 text-amber-300">⚡ Hari Ini</option>
              <option value="tomorrow" className="bg-neutral-900 text-sky-400">⏰ Besok</option>
              <option value="upcoming" className="bg-neutral-900 text-emerald-400">📅 Akan Datang</option>
              <option value="none" className="bg-neutral-900 text-neutral-400">Belum Diatur</option>
            </select>
          </div>

          {/* Monet Filter */}
          <div className="flex items-center gap-1 bg-neutral-900 px-2 py-1 rounded-lg border border-neutral-700 text-xs">
            <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Monet:</span>
            <select
              value={monetFilter}
              onChange={(e) => setMonetFilter(e.target.value as any)}
              className="bg-transparent text-xs text-neutral-200 focus:outline-none cursor-pointer pr-1"
              id="yt-filter-monet-select"
            >
              <option value="all" className="bg-neutral-900 text-white">Semua</option>
              <option value="Ya" className="bg-neutral-900 text-emerald-400">Ya</option>
              <option value="Hampir" className="bg-neutral-900 text-amber-400">Hampir</option>
              <option value="Tidak" className="bg-neutral-900 text-neutral-400">Tidak</option>
            </select>
          </div>

          {/* Sort By */}
          <div className="flex items-center gap-1 bg-neutral-900 px-2 py-1 rounded-lg border border-neutral-700 text-xs">
            <ArrowUpDown className="w-3 h-3 text-neutral-400 ml-0.5" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-transparent text-xs text-neutral-200 focus:outline-none cursor-pointer pr-1"
              id="yt-sort-select"
            >
              <option value="default" className="bg-neutral-900 text-white">Default</option>
              <option value="date-asc" className="bg-neutral-900 text-white">Jadwal Terdekat</option>
              <option value="date-desc" className="bg-neutral-900 text-white">Jadwal Terjauh</option>
              <option value="siap-desc" className="bg-neutral-900 text-white">Siap Upload Terbanyak</option>
              <option value="draft-desc" className="bg-neutral-900 text-white">Draft Terbanyak</option>
            </select>
          </div>
        </div>
      </div>


      {/* Main Table: Editable Per-Row with Rich Date Detection & Badges */}
      <div className="rounded-xl border border-[#262626] bg-[#0E0E0E] shadow-2xl overflow-hidden">
        {filteredAccounts.length === 0 ? (
          <div className="py-16 px-4 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-red-950/40 border border-red-500/30 flex items-center justify-center text-red-500 shadow-inner">
              <PlaySquare className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold text-white mb-1">
              {youtubeAccounts.length === 0 
                ? 'Belum Ada Akun YouTube yang Dikaitkan' 
                : 'Tidak Ada Baris yang Sesuai Filter'}
            </h3>
            <p className="text-xs text-neutral-400 max-w-md mx-auto mb-5 leading-relaxed">
              {youtubeAccounts.length === 0
                ? 'Tambahkan channel YouTube Anda dan tautkan ke salah satu email Master Gmail untuk mengelola jadwal, draft, siap upload, dan monetisasi di menu ini.'
                : 'Coba ubah kata kunci pencarian atau reset filter jadwal dan monetisasi.'}
            </p>
            {youtubeAccounts.length === 0 && (
              <button
                onClick={onAddYoutubeAccount}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold shadow-lg shadow-red-900/30 transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah Channel YouTube Pertama</span>
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-[#E5E5E5] border-collapse">
              <thead>
                <tr className="bg-neutral-950/90 border-b border-[#262626] text-neutral-400 font-mono text-[11px] uppercase tracking-wider">
                  <th className="py-3 px-4 w-72">Channel &amp; Master Gmail</th>
                  <th className="py-3 px-4 min-w-[240px]">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-red-400" />
                      <span>Jadwal Upload &amp; Status</span>
                    </div>
                  </th>
                  <th className="py-3 px-3 w-24 text-center">Draft</th>
                  <th className="py-3 px-3 w-28 text-center">Siap Upload</th>
                  <th className="py-3 px-3 w-32 text-center">Monet</th>
                  <th className="py-3 px-3 w-28 text-center">Jumlah Bahan</th>
                  <th className="py-3 px-4 min-w-[200px]">Keterangan</th>
                  <th className="py-3 px-3 w-28 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#202020]">
                {filteredAccounts.map((account) => {
                  const platId = account.id;
                  const row = rowStates[platId] || {
                    id: `yt_${platId}`,
                    platformAccountId: platId,
                    jadwal: '',
                    draft: 0,
                    siapUpload: 0,
                    monet: 'Tidak',
                    jumlahBahan: 0,
                    keterangan: '',
                    updatedAt: new Date().toISOString(),
                  };

                  const gmail = gmailMap.get(account.gmailId);
                  const isSaved = !!savedRows[platId];
                  const scheduleStatus = detectScheduleStatus(row.jadwal);

                  return (
                    <tr 
                      key={platId}
                      className={`hover:bg-neutral-900/40 transition-colors ${scheduleStatus.badgeClasses.rowHighlight}`}
                      id={`yt-row-${platId}`}
                    >
                      {/* Column 1: Channel Info & Master Gmail */}
                      <td className="py-3.5 px-4 align-top">
                        <div className="space-y-2">
                          <div className="flex items-start justify-between gap-1.5">
                            <div className="min-w-0">
                              <p className="font-sans font-black text-sm text-white hover:text-red-400 transition-colors flex items-center gap-1.5">
                                <PlaySquare className="w-3.5 h-3.5 text-red-500 shrink-0" />
                                <span className="truncate max-w-[170px]" title={account.accountName}>
                                  {maskIfEmail(account.accountName, userRole === 'guest')}
                                </span>
                              </p>

                              <p className="text-[11px] text-neutral-400 font-mono flex items-center gap-1 mt-0.5">
                                <span>{maskIfEmail(account.usernameOrHandle, userRole === 'guest') || '@channel'}</span>
                                {account.channelOrProfileUrl && (
                                  <a
                                    href={account.channelOrProfileUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-neutral-500 hover:text-red-400 transition-colors"
                                    title="Buka Channel di Tab Baru"
                                  >
                                    <ExternalLink className="w-3 h-3" />
                                  </a>
                                )}
                              </p>
                            </div>

                            {/* Visibility Toggle Icon & Edit - ADMIN ONLY */}
                            {userRole !== 'guest' && (
                              <div className="flex items-center gap-1 shrink-0">
                                <button
                                  type="button"
                                  onClick={() => handleToggleVisibility(account)}
                                  className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                                    account.isVisible !== false
                                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20'
                                      : 'bg-neutral-900 border-neutral-700 text-neutral-500 hover:bg-neutral-800'
                                  }`}
                                  title={
                                    account.isVisible !== false
                                      ? 'Ditampilkan di Guest (Klik icon mata untuk menyembunyikan)'
                                      : 'Disembunyikan dari Guest (Klik icon mata untuk menampilkan)'
                                  }
                                  id={`yt-vis-btn-${platId}`}
                                >
                                  {account.isVisible !== false ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                                </button>
                                {onEditPlatformAccount && (
                                  <button
                                    type="button"
                                    onClick={() => onEditPlatformAccount(account)}
                                    className="p-1.5 rounded-lg border border-[#333] text-neutral-500 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
                                    title="Edit Kredensial Lengkap"
                                  >
                                    <Edit3 className="w-3 h-3" />
                                  </button>
                                )}
                              </div>
                            )}
                          </div>

                          {/* Visibility Pill Badge - ADMIN ONLY */}
                          {userRole !== 'guest' && (
                            <div>
                              {account.isVisible !== false ? (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                                  <Eye className="w-2.5 h-2.5" />
                                  <span>Tampil di Guest</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-neutral-900 text-neutral-400 border border-neutral-700">
                                  <EyeOff className="w-2.5 h-2.5" />
                                  <span>Disembunyikan dari Guest</span>
                                </span>
                              )}
                            </div>
                          )}

                          {/* PIC (Penanggung Jawab) - EDITABLE FOR ADMIN, READONLY FOR GUEST */}
                          {userRole !== 'guest' ? (
                            <div className="flex items-center gap-1.5 p-1 rounded-md bg-neutral-950 border border-neutral-800">
                              <span className="text-[9px] font-mono font-bold text-amber-400 px-1 uppercase tracking-wider shrink-0">
                                PIC:
                              </span>
                              <input
                                type="text"
                                value={picMap[platId] ?? account.pic ?? ''}
                                placeholder="Isi PIC (cth: Wahyu)..."
                                onChange={(e) => handlePicChange(account, e.target.value)}
                                onBlur={() => handlePicBlur(account)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    (e.target as HTMLInputElement).blur();
                                  }
                                }}
                                className="w-full text-xs font-semibold bg-transparent text-amber-300 placeholder-neutral-600 focus:outline-none"
                                title="Ketik nama PIC lalu tekan Enter atau klik di luar untuk menyimpan"
                                id={`yt-pic-input-${platId}`}
                              />
                            </div>
                          ) : (
                            <div className="flex items-center gap-1.5 text-xs">
                              <span className="text-[10px] font-mono font-bold text-neutral-400 uppercase">PIC:</span>
                              <span className="text-xs font-bold text-amber-400">
                                {account.pic ? account.pic : <span className="text-neutral-500 italic font-normal">Belum diatur</span>}
                              </span>
                            </div>
                          )}

                          {/* Master Gmail Link Badge */}
                          {(() => {
                            const rawEmail = gmail?.email;
                            const isMasked = userRole === 'guest';
                            const displayEmail = isMasked ? maskEmail(rawEmail) : (rawEmail || 'Tidak ada Gmail');
                            return (
                              <div className="inline-flex items-center gap-1.5 px-2 py-0.8 rounded-md bg-neutral-950 border border-[#2a2a2a] text-[10px] text-neutral-300 font-mono">
                                <span className={`w-1.5 h-1.5 rounded-full ${isMasked ? 'bg-amber-400' : 'bg-red-400'}`} />
                                <span className="truncate max-w-[140px]" title={isMasked ? 'Akun Gmail Terproteksi (Mode Guest)' : (rawEmail || 'Belum Terhubung')}>
                                  {displayEmail}
                                </span>
                                {!isMasked && rawEmail && (
                                  <button
                                    type="button"
                                    onClick={() => handleCopyEmail(displayEmail, `gm_${platId}`)}
                                    className="text-neutral-500 hover:text-white transition-colors cursor-pointer"
                                    title="Salin Email Master"
                                  >
                                    {copiedId === `gm_${platId}` ? (
                                      <Check className="w-3 h-3 text-emerald-400" />
                                    ) : (
                                      <Copy className="w-3 h-3" />
                                    )}
                                  </button>
                                )}
                              </div>
                            );
                          })()}
                        </div>
                      </td>

                      {/* Column 2: Jadwal (Input Date / Text + Auto Detection & Color Status) */}
                      <td className="py-3.5 px-4 align-top">
                        <div className="space-y-2">
                          {/* Main Date Input with Native Picker */}
                          <div className="relative">
                            <input
                              type="date"
                              value={scheduleStatus.isValid ? scheduleStatus.dateStr : (row.jadwal || '')}
                              onChange={(e) => handleFieldChange(platId, 'jadwal', e.target.value)}
                              className="w-full px-2.5 py-1.5 text-xs font-mono rounded-lg bg-neutral-950 border border-[#333] text-neutral-200 focus:outline-none focus:border-red-500 transition-colors cursor-pointer"
                              id={`yt-date-input-${platId}`}
                              title="Pilih tanggal jadwal upload"
                            />
                          </div>

                          {/* Automatic Status Pill & Subtext */}
                          <div className="space-y-0.5">
                            <div className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md border text-[11px] font-sans ${scheduleStatus.badgeClasses.container}`}>
                              <span className={`w-2 h-2 rounded-full ${scheduleStatus.badgeClasses.dot}`} />
                              <span className="font-bold">{scheduleStatus.statusLabel}</span>
                              {scheduleStatus.isValid && (
                                <span className="text-[10px] font-mono opacity-80">
                                  ({scheduleStatus.displayDate})
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] text-neutral-400 font-sans italic pl-1">
                              {scheduleStatus.statusSubtext}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Column 3: Draft (Angka) */}
                      <td className="py-3.5 px-3 align-top text-center">
                        <input
                          type="number"
                          min="0"
                          value={row.draft === 0 ? '0' : row.draft}
                          onChange={(e) => handleFieldChange(platId, 'draft', parseInt(e.target.value, 10) || 0)}
                          className="w-16 px-2 py-1.5 text-xs text-center font-mono font-bold rounded-lg bg-neutral-950 border border-[#333] text-sky-400 focus:outline-none focus:border-sky-500"
                          id={`yt-draft-input-${platId}`}
                        />
                        <span className="block text-[10px] text-neutral-500 mt-1">video</span>
                      </td>

                      {/* Column 4: Siap Upload (Angka) */}
                      <td className="py-3.5 px-3 align-top text-center">
                        <div className="inline-block">
                          <input
                            type="number"
                            min="0"
                            value={row.siapUpload === 0 ? '0' : row.siapUpload}
                            onChange={(e) => handleFieldChange(platId, 'siapUpload', parseInt(e.target.value, 10) || 0)}
                            className={`w-16 px-2 py-1.5 text-xs text-center font-mono font-bold rounded-lg bg-neutral-950 border focus:outline-none transition-colors ${
                              Number(row.siapUpload) > 0 
                                ? 'border-emerald-500/60 text-emerald-300 ring-1 ring-emerald-500/30' 
                                : 'border-[#333] text-neutral-300 focus:border-emerald-500'
                            }`}
                            id={`yt-siap-input-${platId}`}
                          />
                          {Number(row.siapUpload) > 0 && (
                            <span className="block text-[9px] text-emerald-400 font-bold mt-1">
                              Siap Tayang!
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Column 5: Monet Dropdown (Ya, Tidak, Hampir) */}
                      <td className="py-3.5 px-3 align-top text-center">
                        <div className="space-y-1 inline-block text-left">
                          <select
                            value={row.monet || 'Tidak'}
                            onChange={(e) => handleFieldChange(platId, 'monet', e.target.value as MonetizationStatus)}
                            className={`px-2.5 py-1.5 rounded-lg text-xs font-sans font-bold border focus:outline-none cursor-pointer transition-colors ${
                              row.monet === 'Ya'
                                ? 'bg-emerald-950/60 border-emerald-500/60 text-emerald-300'
                                : row.monet === 'Hampir'
                                ? 'bg-amber-950/60 border-amber-500/60 text-amber-300'
                                : 'bg-neutral-950 border-[#333] text-neutral-400'
                            }`}
                            id={`yt-monet-select-${platId}`}
                          >
                            <option value="Ya" className="bg-neutral-900 text-emerald-300">Ya (Monet)</option>
                            <option value="Hampir" className="bg-neutral-900 text-amber-300">Hampir</option>
                            <option value="Tidak" className="bg-neutral-900 text-neutral-400">Tidak</option>
                          </select>
                        </div>
                      </td>

                      {/* Column 6: Jumlah Bahan (Angka) */}
                      <td className="py-3.5 px-3 align-top text-center">
                        <input
                          type="number"
                          min="0"
                          value={row.jumlahBahan === 0 ? '0' : row.jumlahBahan}
                          onChange={(e) => handleFieldChange(platId, 'jumlahBahan', parseInt(e.target.value, 10) || 0)}
                          className="w-16 px-2 py-1.5 text-xs text-center font-mono font-bold rounded-lg bg-neutral-950 border border-[#333] text-purple-300 focus:outline-none focus:border-purple-500"
                          id={`yt-bahan-input-${platId}`}
                        />
                        <span className="block text-[10px] text-neutral-500 mt-1">item bahan</span>
                      </td>

                      {/* Column 7: Keterangan (Text) */}
                      <td className="py-3.5 px-4 align-top">
                        <textarea
                          rows={2}
                          value={row.keterangan || ''}
                          onChange={(e) => handleFieldChange(platId, 'keterangan', e.target.value)}
                          placeholder="Catatan pengerjaan, thumbnail, topik episode..."
                          className="w-full px-2.5 py-1.5 text-xs rounded-lg bg-neutral-950 border border-[#333] text-neutral-200 placeholder-neutral-600 focus:outline-none focus:border-red-500 transition-colors resize-y min-h-[44px]"
                          id={`yt-keterangan-input-${platId}`}
                        />
                      </td>

                      {/* Column 8: Aksi / Simpan Perbaris */}
                      <td className="py-3.5 px-3 align-top text-center">
                        <div className="space-y-1.5">
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleSaveRow(platId)}
                            className={`w-full py-1.5 px-3 rounded-lg text-xs font-sans font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                              isSaved
                                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-900/40'
                                : 'bg-red-600/90 hover:bg-red-500 text-white shadow-sm shadow-red-900/20'
                            }`}
                            id={`yt-save-row-btn-${platId}`}
                            title="Simpan baris ini ke cloud"
                          >
                            {isSaved ? (
                              <>
                                <Check className="w-3.5 h-3.5" />
                                <span>Tersimpan</span>
                              </>
                            ) : (
                              <>
                                <Save className="w-3.5 h-3.5" />
                                <span>Simpan</span>
                              </>
                            )}
                          </motion.button>

                          {userRole !== 'guest' && (
                            <button
                              type="button"
                              onClick={() => handleToggleVisibility(account)}
                              className={`w-full py-1 px-1.5 rounded-lg text-[10px] font-mono font-bold flex items-center justify-center gap-1 border transition-colors cursor-pointer ${
                                account.isVisible !== false
                                  ? 'bg-neutral-900 border-emerald-500/30 text-emerald-400 hover:bg-emerald-950/40'
                                  : 'bg-neutral-950 border-neutral-800 text-neutral-500 hover:text-white'
                              }`}
                              title={
                                account.isVisible !== false
                                  ? 'Ditampilkan di Guest (Klik untuk sembunyikan)'
                                  : 'Disembunyikan dari Guest (Klik untuk tampilkan)'
                              }
                            >
                              {account.isVisible !== false ? <Eye className="w-3 h-3 text-emerald-400" /> : <EyeOff className="w-3 h-3 text-neutral-500" />}
                              <span>{account.isVisible !== false ? 'Tampil' : 'Sembunyi'}</span>
                            </button>
                          )}
                        </div>
                        <span className="block text-[9px] text-neutral-500 mt-1 font-mono">
                          per baris
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Helper Footer Card */}
      <div className="p-4 rounded-xl bg-neutral-950/60 border border-[#262626] text-xs text-neutral-400 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Info className="w-4 h-4 text-red-400 shrink-0" />
          <span>
            Setiap baris yang disimpan akan langsung tersinkronisasi seumur hidup ke Cloud Firestore dan terhubung otomatis dengan Gmail Master &amp; Akun YouTube.
          </span>
        </div>
        <div className="flex items-center gap-3 text-[11px] text-neutral-400">
          <span className="flex items-center gap-1 text-rose-400">
            <span className="w-2 h-2 rounded-full bg-rose-500" />
            <span>Merah = Terlewat</span>
          </span>
          <span className="flex items-center gap-1 text-amber-300">
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            <span>Kuning = Hari Ini</span>
          </span>
          <span className="flex items-center gap-1 text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Hijau = Mendatang</span>
          </span>
        </div>
      </div>
    </div>
  );
};
