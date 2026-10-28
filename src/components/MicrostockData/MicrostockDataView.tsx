import React, { useState, useMemo, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  PlatformAccount, 
  GmailAccount, 
  MicrostockItem,
  UserRole
} from '../../types';
import { maskEmail, maskIfEmail } from '../../utils/maskUtils';
import { 
  Layers, 
  Save, 
  Plus, 
  Search, 
  ExternalLink, 
  Sparkles, 
  Edit3, 
  Copy, 
  Check, 
  Info, 
  TrendingUp, 
  CheckCircle2, 
  XCircle, 
  Image as ImageIcon,
  Palette,
  ArrowUpDown,
  Filter,
  Shield,
  Eye,
  EyeOff,
  Calendar,
  AlertTriangle,
  Clock,
  UploadCloud
} from 'lucide-react';

export interface MicrostockScheduleStatus {
  hasDate: boolean;
  dateStr: string;
  daysPassed: number | null;
  isOverdue: boolean;
  overdueDays: number;
  label: string;
  subtext: string;
  badgeClass: string;
  dotClass: string;
}

/**
 * Detect upload schedule status over a 1-week (7 days) threshold.
 * If > 7 days have passed since the last upload date, indicates overdue status.
 */
export function detectMicrostockUploadStatus(dateStr?: string): MicrostockScheduleStatus {
  if (!dateStr || !dateStr.trim()) {
    return {
      hasDate: false,
      dateStr: '',
      daysPassed: null,
      isOverdue: false,
      overdueDays: 0,
      label: 'Belum Diatur',
      subtext: 'Klik untuk set tanggal',
      badgeClass: 'bg-neutral-900 border-neutral-800 text-neutral-400',
      dotClass: 'bg-neutral-600',
    };
  }

  const parts = dateStr.trim().split(/[-/]/);
  let parsedDate: Date | null = null;
  if (parts.length === 3) {
    if (parts[0].length === 4) {
      // YYYY-MM-DD
      parsedDate = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
    } else if (parts[2].length === 4) {
      // DD-MM-YYYY
      parsedDate = new Date(parseInt(parts[2], 10), parseInt(parts[1], 10) - 1, parseInt(parts[0], 10));
    }
  }
  if (!parsedDate || isNaN(parsedDate.getTime())) {
    parsedDate = new Date(dateStr);
  }

  if (isNaN(parsedDate.getTime())) {
    return {
      hasDate: false,
      dateStr: dateStr,
      daysPassed: null,
      isOverdue: false,
      overdueDays: 0,
      label: 'Format Tidak Valid',
      subtext: 'Pilih ulang tanggal',
      badgeClass: 'bg-neutral-900 border-neutral-800 text-neutral-400',
      dotClass: 'bg-neutral-600',
    };
  }

  const today = new Date();
  const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const uploadMidnight = new Date(parsedDate.getFullYear(), parsedDate.getMonth(), parsedDate.getDate());

  const msPerDay = 1000 * 60 * 60 * 24;
  const daysPassed = Math.round((todayMidnight.getTime() - uploadMidnight.getTime()) / msPerDay);

  // Future date
  if (daysPassed < 0) {
    const futureDays = Math.abs(daysPassed);
    return {
      hasDate: true,
      dateStr,
      daysPassed,
      isOverdue: false,
      overdueDays: 0,
      label: `📅 ${futureDays} Hari Lagi`,
      subtext: 'Jadwal mendatang',
      badgeClass: 'bg-indigo-950/40 border-indigo-500/40 text-indigo-300',
      dotClass: 'bg-indigo-400',
    };
  }

  // Uploaded today
  if (daysPassed === 0) {
    return {
      hasDate: true,
      dateStr,
      daysPassed: 0,
      isOverdue: false,
      overdueDays: 0,
      label: '⚡ Upload Hari Ini',
      subtext: 'Aktif (sisa 7 hari)',
      badgeClass: 'bg-emerald-950/50 border-emerald-500/60 text-emerald-300 ring-1 ring-emerald-500/30',
      dotClass: 'bg-emerald-400 animate-pulse',
    };
  }

  // Overdue (> 7 days since last upload)
  if (daysPassed > 7) {
    const overdueDays = daysPassed - 7;
    return {
      hasDate: true,
      dateStr,
      daysPassed,
      isOverdue: true,
      overdueDays,
      label: `⚠️ Terlewat ${overdueDays} Hari`,
      subtext: `${daysPassed} hari sejak upload (lewat seminggu)`,
      badgeClass: 'bg-rose-950/60 border-rose-500/70 text-rose-300 shadow-sm shadow-rose-900/40 ring-1 ring-rose-500/40',
      dotClass: 'bg-rose-500 animate-pulse',
    };
  }

  // Exactly 7 days (last day of the week)
  if (daysPassed === 7) {
    return {
      hasDate: true,
      dateStr,
      daysPassed: 7,
      isOverdue: false,
      overdueDays: 0,
      label: '⏰ Batas 7 Hari (Hari Ini)',
      subtext: 'Waktunya upload minggu ini',
      badgeClass: 'bg-amber-950/50 border-amber-500/60 text-amber-300 ring-1 ring-amber-500/30',
      dotClass: 'bg-amber-400 animate-ping',
    };
  }

  // Within 1-6 days
  const remainingInWeek = 7 - daysPassed;
  return {
    hasDate: true,
    dateStr,
    daysPassed,
    isOverdue: false,
    overdueDays: 0,
    label: `✅ ${daysPassed} Hari Lalu`,
    subtext: `Sisa ${remainingInWeek} hari dalam seminggu`,
    badgeClass: 'bg-emerald-950/30 border-emerald-500/40 text-emerald-300',
    dotClass: 'bg-emerald-400',
  };
}

interface MicrostockDataViewProps {
  platformAccounts: PlatformAccount[];
  gmails: GmailAccount[];
  microstockItems: MicrostockItem[];
  onSaveMicrostockItem: (item: MicrostockItem) => void;
  onSaveAllMicrostockItems?: (items: MicrostockItem[]) => void;
  onAddMicrostockAccount: (defaultPlatform?: string) => void;
  onEditPlatformAccount?: (account: PlatformAccount) => void;
  onUpdateAccount?: (account: PlatformAccount) => void;
  userRole?: UserRole;
}

// Known microstock platforms
export const MICROSTOCK_PLATFORMS = [
  'Adobe Stock',
  'Shutterstock',
  'Freepik',
  'Vecteezy',
  'Envato',
  'Creative Fabrica',
  'iStock / Getty',
  'Canva Contributor',
];

export const MicrostockDataView: React.FC<MicrostockDataViewProps> = ({
  platformAccounts,
  gmails,
  microstockItems,
  onSaveMicrostockItem,
  onSaveAllMicrostockItems,
  onAddMicrostockAccount,
  onEditPlatformAccount,
  onUpdateAccount,
  userRole,
}) => {
  // 1. Filter accounts that belong to Microstock (exclude YouTube unless explicitly named stock)
  const microstockAccounts = useMemo(() => {
    return platformAccounts.filter(p => {
      if (userRole === 'guest' && p.isVisible === false) return false;
      const plat = (p.platform || '').trim();
      // YouTube is handled in Penjadwalan YouTube
      if (plat.toLowerCase() === 'youtube') return false;
      return true;
    });
  }, [platformAccounts, userRole]);

  // 2. Map Gmail dictionary
  const gmailMap = useMemo(() => {
    const map = new Map<string, GmailAccount>();
    gmails.forEach(g => map.set(g.id, g));
    return map;
  }, [gmails]);

  // 3. Local row states for inline editing and per-row saving
  const [rowStates, setRowStates] = useState<{ [platId: string]: MicrostockItem }>({});
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
  const [platformFilter, setPlatformFilter] = useState<string>('all');
  const [picFilter, setPicFilter] = useState<string>('all');
  const [visibilityFilter, setVisibilityFilter] = useState<'all' | 'visible' | 'hidden'>('all');
  const [sortBy, setSortBy] = useState<'default' | 'item-desc' | 'new-desc' | 'reject-desc' | 'overdue-desc' | 'upload-desc' | 'date-desc'>('default');

  // Extract all distinct PICs available in microstock accounts
  const availablePics = useMemo(() => {
    const pics = new Set<string>();
    microstockAccounts.forEach(acc => {
      const p = (acc.pic || '').trim();
      if (p) pics.add(p);
    });
    return Array.from(pics).sort((a, b) => a.localeCompare(b));
  }, [microstockAccounts]);

  // Synchronize microstock items into local row states
  useEffect(() => {
    const initialRows: { [platId: string]: MicrostockItem } = {};
    microstockAccounts.forEach(account => {
      const existing = microstockItems.find(m => m.platformAccountId === account.id);
      if (existing) {
        initialRows[account.id] = {
          ...existing,
          lastUploadDate: existing.lastUploadDate || '',
          jumlahUpload: existing.jumlahUpload !== undefined ? existing.jumlahUpload : 0,
        };
      } else {
        initialRows[account.id] = {
          id: `ms_${account.id}`,
          platformAccountId: account.id,
          jumlahItem: 0,
          newItem: 0,
          reject: 0,
          konsentrasiAkun: account.niche || '',
          lastUploadDate: '',
          jumlahUpload: 0,
          updatedAt: new Date().toISOString(),
        };
      }
    });
    setRowStates(initialRows);
  }, [microstockAccounts, microstockItems]);

  // Handle single field change
  const handleFieldChange = <K extends keyof MicrostockItem>(
    platId: string,
    field: K,
    value: MicrostockItem[K]
  ) => {
    setRowStates(prev => {
      const current = prev[platId] || {
        id: `ms_${platId}`,
        platformAccountId: platId,
        jumlahItem: 0,
        newItem: 0,
        reject: 0,
        konsentrasiAkun: '',
        lastUploadDate: '',
        jumlahUpload: 0,
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
    setSavedRows(prev => ({ ...prev, [platId]: false }));
  };

  // Save single row (persisting both microstock item and PIC)
  const handleSaveRow = (platId: string) => {
    const item = rowStates[platId];
    if (item) {
      onSaveMicrostockItem(item);
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

  // Save all rows & PICs
  const handleSaveAll = () => {
    const allItems: MicrostockItem[] = Object.values(rowStates);
    if (onSaveAllMicrostockItems) {
      onSaveAllMicrostockItems(allItems);
    } else {
      allItems.forEach(item => onSaveMicrostockItem(item));
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

  // Copy email
  const handleCopyEmail = (email: string, id: string) => {
    navigator.clipboard.writeText(email);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Summary metrics
  const metrics = useMemo(() => {
    let totalItems = 0;
    let totalNew = 0;
    let totalReject = 0;
    let totalJumlahUpload = 0;
    let totalOverdue = 0;

    microstockAccounts.forEach(acc => {
      const row = rowStates[acc.id];
      if (row) {
        totalItems += Number(row.jumlahItem) || 0;
        totalNew += Number(row.newItem) || 0;
        totalReject += Number(row.reject) || 0;
        totalJumlahUpload += Number(row.jumlahUpload) || 0;
        const status = detectMicrostockUploadStatus(row.lastUploadDate);
        if (status.isOverdue) {
          totalOverdue += 1;
        }
      }
    });

    const totalProcessed = totalItems + totalReject;
    const acceptRate = totalProcessed > 0 
      ? Math.round((totalItems / totalProcessed) * 1000) / 10 
      : 100;

    return {
      totalAccounts: microstockAccounts.length,
      totalItems,
      totalNew,
      totalReject,
      totalJumlahUpload,
      totalOverdue,
      acceptRate,
    };
  }, [microstockAccounts, rowStates]);

  // Platform styling helper
  const getPlatformBadge = (platform: string) => {
    const p = platform.toLowerCase();
    if (p.includes('adobe')) {
      return {
        bg: 'bg-red-950/50 border-red-500/40 text-red-300',
        dot: 'bg-red-500',
        label: 'Adobe Stock',
      };
    }
    if (p.includes('shutter')) {
      return {
        bg: 'bg-rose-950/50 border-rose-500/40 text-rose-300',
        dot: 'bg-rose-500',
        label: 'Shutterstock',
      };
    }
    if (p.includes('freepik')) {
      return {
        bg: 'bg-blue-950/50 border-blue-500/40 text-blue-300',
        dot: 'bg-blue-500',
        label: 'Freepik',
      };
    }
    if (p.includes('vecteezy')) {
      return {
        bg: 'bg-amber-950/50 border-amber-500/40 text-amber-300',
        dot: 'bg-amber-500',
        label: 'Vecteezy',
      };
    }
    return {
      bg: 'bg-indigo-950/50 border-indigo-500/40 text-indigo-300',
      dot: 'bg-indigo-400',
      label: platform,
    };
  };

  // Filtered and sorted accounts
  const filteredAccounts = useMemo(() => {
    return microstockAccounts.filter(account => {
      const row = rowStates[account.id];
      const gmail = gmailMap.get(account.gmailId);
      const q = searchQuery.toLowerCase();

      // Search match
      const matchSearch = 
        !q ||
        account.accountName.toLowerCase().includes(q) ||
        account.usernameOrHandle.toLowerCase().includes(q) ||
        account.platform.toLowerCase().includes(q) ||
        (gmail?.email || '').toLowerCase().includes(q) ||
        (row?.konsentrasiAkun || '').toLowerCase().includes(q);

      if (!matchSearch) return false;

      // Platform filter
      if (platformFilter !== 'all') {
        if (account.platform !== platformFilter) return false;
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
      if (sortBy === 'item-desc') {
        return (rowB?.jumlahItem || 0) - (rowA?.jumlahItem || 0);
      }
      if (sortBy === 'new-desc') {
        return (rowB?.newItem || 0) - (rowA?.newItem || 0);
      }
      if (sortBy === 'reject-desc') {
        return (rowB?.reject || 0) - (rowA?.reject || 0);
      }
      if (sortBy === 'upload-desc') {
        return (rowB?.jumlahUpload || 0) - (rowA?.jumlahUpload || 0);
      }
      if (sortBy === 'overdue-desc') {
        const statusA = detectMicrostockUploadStatus(rowA?.lastUploadDate);
        const statusB = detectMicrostockUploadStatus(rowB?.lastUploadDate);
        return (statusB.daysPassed || 0) - (statusA.daysPassed || 0);
      }
      if (sortBy === 'date-desc') {
        const dateA = rowA?.lastUploadDate || '';
        const dateB = rowB?.lastUploadDate || '';
        return dateB.localeCompare(dateA);
      }
      return 0;
    });
  }, [microstockAccounts, rowStates, gmailMap, searchQuery, platformFilter, picFilter, visibilityFilter, sortBy, userRole]);

  return (
    <div className="space-y-4">
      {/* Header Banner - Clean, Minimal & High Efficiency */}
      <div className="rounded-2xl bg-gradient-to-r from-neutral-900 via-neutral-900 to-indigo-950/30 border border-neutral-800 p-4 sm:p-5 shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shadow-inner">
              <ImageIcon className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-sans font-black text-white tracking-tight">
                  Data Microstock
                </h2>
                {userRole === 'guest' && (
                  <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 font-mono text-[10px] font-bold">
                    Mode Guest
                  </span>
                )}
              </div>
              <p className="text-xs text-neutral-400 mt-0.5">
                Pantau total item, new submissions, reject rate, tema akun, dan penanggung jawab (PIC).
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleSaveAll}
              className="px-3.5 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-neutral-200 border border-neutral-700 hover:border-neutral-500 text-xs font-bold flex items-center gap-2 shadow-sm transition-all cursor-pointer"
              id="ms-save-all-btn"
              title="Simpan seluruh baris ke Cloud"
            >
              <Save className="w-3.5 h-3.5 text-emerald-400" />
              <span>Simpan Semua</span>
            </motion.button>

            {userRole !== 'guest' && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onAddMicrostockAccount('Adobe Stock')}
                className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-indigo-900/30 transition-all cursor-pointer"
                id="ms-add-account-btn"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah Akun Stock</span>
              </motion.button>
            )}
          </div>
        </div>

        {/* Metrics Row - 6 Compact & Crisp Columns */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 mt-4 pt-3.5 border-t border-neutral-800/80">
          <div className="p-2.5 rounded-xl bg-neutral-950/70 border border-neutral-800">
            <span className="text-[10px] uppercase font-bold text-neutral-400 block">Total Akun Stock</span>
            <span className="text-lg font-mono font-black text-white mt-0.5 block">{metrics.totalAccounts}</span>
          </div>

          <div className="p-2.5 rounded-xl bg-neutral-950/70 border border-neutral-800">
            <span className="text-[10px] uppercase font-bold text-neutral-400 block">Total Item Online</span>
            <span className="text-lg font-mono font-black text-indigo-300 mt-0.5 block flex items-center gap-1">
              <span>{metrics.totalItems.toLocaleString()}</span>
              <span className="text-[10px] font-normal text-indigo-400/80">Item</span>
            </span>
          </div>

          <div className="p-2.5 rounded-xl bg-neutral-950/70 border border-neutral-800">
            <span className="text-[10px] uppercase font-bold text-neutral-400 block">Jml Upload Baru</span>
            <span className="text-lg font-mono font-black text-amber-300 mt-0.5 block flex items-center gap-1">
              <UploadCloud className="w-3.5 h-3.5 text-amber-400" />
              <span>{metrics.totalJumlahUpload.toLocaleString()}</span>
              <span className="text-[10px] font-normal text-amber-400/80">File</span>
            </span>
          </div>

          <div className="p-2.5 rounded-xl bg-neutral-950/70 border border-neutral-800">
            <span className="text-[10px] uppercase font-bold text-neutral-400 block">New / Pending</span>
            <span className="text-lg font-mono font-black text-emerald-400 mt-0.5 block flex items-center gap-1">
              <span>{metrics.totalNew.toLocaleString()}</span>
              <span className="text-[10px] font-normal text-emerald-400/80">Baru</span>
            </span>
          </div>

          <div className="p-2.5 rounded-xl bg-neutral-950/70 border border-neutral-800">
            <span className="text-[10px] uppercase font-bold text-neutral-400 block">Total Reject</span>
            <span className="text-lg font-mono font-black text-rose-400 mt-0.5 block flex items-center gap-1">
              <span>{metrics.totalReject.toLocaleString()}</span>
              <span className="text-[10px] font-normal text-rose-400/80">Ditolak</span>
            </span>
          </div>

          <div className={`p-2.5 rounded-xl border transition-colors ${
            metrics.totalOverdue > 0 ? 'bg-rose-950/30 border-rose-500/40' : 'bg-neutral-950/70 border-neutral-800'
          }`}>
            <span className={`text-[10px] uppercase font-bold block ${
              metrics.totalOverdue > 0 ? 'text-rose-400' : 'text-neutral-400'
            }`}>
              Lewat 1 Minggu
            </span>
            <span className={`text-lg font-mono font-black mt-0.5 block flex items-center gap-1.5 ${
              metrics.totalOverdue > 0 ? 'text-rose-300' : 'text-emerald-400'
            }`}>
              {metrics.totalOverdue > 0 ? (
                <>
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
                  <span>{metrics.totalOverdue}</span>
                  <span className="text-[10px] font-normal text-rose-300/80">Perlu Upload</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{metrics.acceptRate}%</span>
                  <span className="text-[10px] font-normal text-emerald-300/80">Accept</span>
                </>
              )}
            </span>
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
            placeholder="Cari akun, email master, platform, tema..."
            className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg bg-neutral-900 border border-neutral-700 text-white placeholder-neutral-500 focus:outline-none focus:border-indigo-500"
            id="ms-search-input"
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
              id="ms-filter-pic-select"
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
                id="ms-filter-vis-select"
              >
                <option value="all" className="bg-neutral-900 text-white">Semua</option>
                <option value="visible" className="bg-neutral-900 text-emerald-400">Ditampilkan</option>
                <option value="hidden" className="bg-neutral-900 text-neutral-400">Disembunyikan</option>
              </select>
            </div>
          )}

          {/* Platform Filter */}
          <div className="flex items-center gap-1 bg-neutral-900 px-2 py-1 rounded-lg border border-neutral-700 text-xs">
            <Filter className="w-3 h-3 text-neutral-400 ml-0.5" />
            <select
              value={platformFilter}
              onChange={(e) => setPlatformFilter(e.target.value)}
              className="bg-transparent text-xs text-neutral-200 focus:outline-none cursor-pointer pr-1"
              id="ms-filter-platform-select"
            >
              <option value="all" className="bg-neutral-900 text-white">Semua Platform</option>
              <option value="Adobe Stock" className="bg-neutral-900 text-red-300">Adobe Stock</option>
              <option value="Shutterstock" className="bg-neutral-900 text-rose-300">Shutterstock</option>
              <option value="Freepik" className="bg-neutral-900 text-blue-300">Freepik</option>
              <option value="Vecteezy" className="bg-neutral-900 text-amber-300">Vecteezy</option>
              <option value="Envato" className="bg-neutral-900 text-emerald-300">Envato</option>
              <option value="Creative Fabrica" className="bg-neutral-900 text-purple-300">Creative Fabrica</option>
            </select>
          </div>

          {/* Sort By */}
          <div className="flex items-center gap-1 bg-neutral-900 px-2 py-1 rounded-lg border border-neutral-700 text-xs">
            <ArrowUpDown className="w-3 h-3 text-neutral-400 ml-0.5" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-transparent text-xs text-neutral-200 focus:outline-none cursor-pointer pr-1"
              id="ms-sort-select"
            >
              <option value="default" className="bg-neutral-900 text-white">Default</option>
              <option value="item-desc" className="bg-neutral-900 text-white">Item Terbanyak</option>
              <option value="upload-desc" className="bg-neutral-900 text-white">Jumlah Upload Terbanyak</option>
              <option value="overdue-desc" className="bg-neutral-900 text-rose-300">Paling Terlewat (&gt; 1 Minggu)</option>
              <option value="date-desc" className="bg-neutral-900 text-white">Tanggal Upload Terbaru</option>
              <option value="new-desc" className="bg-neutral-900 text-white">Item Baru Terbanyak</option>
              <option value="reject-desc" className="bg-neutral-900 text-white">Reject Terbanyak</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Table: Editable Per-Row with Linked Master Gmail & Microstock Platforms */}
      <div className="rounded-xl border border-[#262626] bg-[#0E0E0E] shadow-2xl overflow-hidden">
        {filteredAccounts.length === 0 ? (
          <div className="py-16 px-4 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-indigo-950/40 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shadow-inner">
              <ImageIcon className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold text-white mb-1">
              {microstockAccounts.length === 0 
                ? 'Belum Ada Akun Microstock yang Terdaftar' 
                : 'Tidak Ada Akun yang Sesuai Filter'}
            </h3>
            <p className="text-xs text-neutral-400 max-w-md mx-auto mb-5 leading-relaxed">
              {microstockAccounts.length === 0
                ? 'Tambahkan akun Adobe Stock, Shutterstock, Freepik, atau Vecteezy dan tautkan ke salah satu email Master Gmail untuk mengelola item dan tema portofolio.'
                : 'Coba ubah kata kunci pencarian atau ganti filter platform.'}
            </p>
            {microstockAccounts.length === 0 && (
              <button
                onClick={() => onAddMicrostockAccount('Adobe Stock')}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-900/30 transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah Akun Microstock Pertama</span>
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-[#E5E5E5] border-collapse">
              <thead>
                <tr className="bg-neutral-950/90 border-b border-[#262626] text-neutral-400 font-mono text-[11px] uppercase tracking-wider">
                  <th className="py-3 px-4 w-56">Master Gmail</th>
                  <th className="py-3 px-4 min-w-[190px]">Platform &amp; Akun</th>
                  <th className="py-3 px-2 w-24 text-center">Jumlah Item</th>
                  <th className="py-3 px-2 w-20 text-center">New</th>
                  <th className="py-3 px-2 w-20 text-center">Reject</th>
                  <th className="py-3 px-3 min-w-[170px] text-center">Terakhir Upload</th>
                  <th className="py-3 px-2 w-24 text-center">Jumlah Upload</th>
                  <th className="py-3 px-3 min-w-[180px]">Konsentrasi Akun</th>
                  <th className="py-3 px-3 w-28 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#202020]">
                {filteredAccounts.map((account) => {
                  const platId = account.id;
                  const row = rowStates[platId] || {
                    id: `ms_${platId}`,
                    platformAccountId: platId,
                    jumlahItem: 0,
                    newItem: 0,
                    reject: 0,
                    konsentrasiAkun: account.niche || '',
                    updatedAt: new Date().toISOString(),
                  };

                  const gmail = gmailMap.get(account.gmailId);
                  const isSaved = !!savedRows[platId];
                  const badge = getPlatformBadge(account.platform);

                  // Calculate single row rejection percentage
                  const totalSub = (Number(row.jumlahItem) || 0) + (Number(row.reject) || 0);
                  const rejectRate = totalSub > 0 
                    ? Math.round(((Number(row.reject) || 0) / totalSub) * 1000) / 10 
                    : 0;
                  const uploadStatus = detectMicrostockUploadStatus(row.lastUploadDate);

                  return (
                    <tr 
                      key={platId}
                      className="hover:bg-neutral-900/40 transition-colors"
                      id={`ms-row-${platId}`}
                    >
                      {/* Column 1: Master Gmail */}
                      <td className="py-3.5 px-4 align-top">
                        {(() => {
                          const rawEmail = gmail?.email;
                          const isMasked = userRole === 'guest';
                          const displayEmail = isMasked ? maskEmail(rawEmail) : (rawEmail || 'Tidak ada Gmail');

                          return (
                            <div className="space-y-1">
                              <div className="flex items-center gap-1.5">
                                <span className={`w-2 h-2 rounded-full ${isMasked ? 'bg-amber-400' : 'bg-emerald-400'}`} />
                                <span className="font-mono font-bold text-neutral-200 truncate max-w-[170px]" title={isMasked ? 'Akun Gmail Terproteksi (Mode Guest)' : (rawEmail || 'Belum Terhubung')}>
                                  {displayEmail}
                                </span>
                                {!isMasked && rawEmail && (
                                  <button
                                    type="button"
                                    onClick={() => handleCopyEmail(displayEmail, `ms_gm_${platId}`)}
                                    className="text-neutral-500 hover:text-white transition-colors cursor-pointer"
                                    title="Salin Email Master"
                                  >
                                    {copiedId === `ms_gm_${platId}` ? (
                                      <Check className="w-3 h-3 text-emerald-400" />
                                    ) : (
                                      <Copy className="w-3 h-3" />
                                    )}
                                  </button>
                                )}
                              </div>
                              <p className="text-[10px] text-neutral-500 font-mono">
                                {isMasked ? 'Master ID: ******' : `Master ID: ${account.gmailId.slice(0, 10)}...`}
                              </p>
                            </div>
                          );
                        })()}
                      </td>

                      {/* Column 2: Platform & Akun */}
                      <td className="py-3.5 px-4 align-top">
                        <div className="space-y-2">
                          <div className="flex items-start justify-between gap-1.5">
                            <div className="min-w-0">
                              {/* Platform Badge */}
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-sans font-bold border ${badge.bg}`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
                                <span>{badge.label}</span>
                              </span>

                              <p className="font-sans font-black text-sm text-white mt-1 hover:text-indigo-300 transition-colors">
                                {maskIfEmail(account.accountName, userRole === 'guest')}
                              </p>

                              <p className="text-[11px] text-neutral-400 font-mono flex items-center gap-1 mt-0.5">
                                <span>{maskIfEmail(account.usernameOrHandle, userRole === 'guest') || '@account'}</span>
                                {account.channelOrProfileUrl && (
                                  <a
                                    href={account.channelOrProfileUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-neutral-500 hover:text-indigo-400 transition-colors"
                                    title="Buka Portofolio Stock di Tab Baru"
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
                                  id={`ms-vis-btn-${platId}`}
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
                                id={`ms-pic-input-${platId}`}
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
                        </div>
                      </td>

                      {/* Column 3: Jumlah Item (Angka) */}
                      <td className="py-3.5 px-3 align-top text-center">
                        <div className="inline-block">
                          <input
                            type="number"
                            min="0"
                            value={row.jumlahItem === 0 ? '0' : row.jumlahItem}
                            onChange={(e) => handleFieldChange(platId, 'jumlahItem', parseInt(e.target.value, 10) || 0)}
                            className="w-24 px-2 py-1.5 text-xs text-center font-mono font-bold rounded-lg bg-neutral-950 border border-[#333] text-indigo-300 focus:outline-none focus:border-indigo-500"
                            id={`ms-item-input-${platId}`}
                          />
                          <span className="block text-[10px] text-neutral-500 mt-1">item online</span>
                        </div>
                      </td>

                      {/* Column 4: New (Angka) */}
                      <td className="py-3.5 px-3 align-top text-center">
                        <div className="inline-block">
                          <input
                            type="number"
                            min="0"
                            value={row.newItem === 0 ? '0' : row.newItem}
                            onChange={(e) => handleFieldChange(platId, 'newItem', parseInt(e.target.value, 10) || 0)}
                            className={`w-20 px-2 py-1.5 text-xs text-center font-mono font-bold rounded-lg bg-neutral-950 border focus:outline-none transition-colors ${
                              Number(row.newItem) > 0 
                                ? 'border-emerald-500/60 text-emerald-300 ring-1 ring-emerald-500/20' 
                                : 'border-[#333] text-neutral-300 focus:border-emerald-500'
                            }`}
                            id={`ms-new-input-${platId}`}
                          />
                          <span className="block text-[10px] text-neutral-500 mt-1">submission</span>
                        </div>
                      </td>

                      {/* Column 5: Reject (Angka) */}
                      <td className="py-3.5 px-3 align-top text-center">
                        <div className="inline-block">
                          <input
                            type="number"
                            min="0"
                            value={row.reject === 0 ? '0' : row.reject}
                            onChange={(e) => handleFieldChange(platId, 'reject', parseInt(e.target.value, 10) || 0)}
                            className={`w-20 px-2 py-1.5 text-xs text-center font-mono font-bold rounded-lg bg-neutral-950 border focus:outline-none transition-colors ${
                              Number(row.reject) > 0 
                                ? 'border-rose-500/50 text-rose-300' 
                                : 'border-[#333] text-neutral-300 focus:border-rose-500'
                            }`}
                            id={`ms-reject-input-${platId}`}
                          />
                          {Number(row.reject) > 0 && (
                            <span className="block text-[10px] font-mono text-rose-400 mt-1">
                              {rejectRate}% Reject
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Column 6: Terakhir Upload (Tanggal & Deteksi Jadwal Seminggu) */}
                      <td className="py-3.5 px-3 align-top text-center">
                        <div className="inline-block w-full max-w-[170px]">
                          <div className="relative">
                            <input
                              type="date"
                              value={row.lastUploadDate || ''}
                              onChange={(e) => handleFieldChange(platId, 'lastUploadDate', e.target.value)}
                              className={`w-full px-2 py-1.5 text-xs text-center font-mono font-bold rounded-lg bg-neutral-950 border focus:outline-none transition-all cursor-pointer ${
                                uploadStatus.isOverdue
                                  ? 'border-rose-500/70 text-rose-300 ring-1 ring-rose-500/30'
                                  : uploadStatus.hasDate
                                  ? 'border-neutral-700 text-neutral-200 focus:border-indigo-500'
                                  : 'border-[#333] text-neutral-400 focus:border-indigo-500'
                              }`}
                              title="Klik untuk memilih tanggal terakhir upload microstock"
                              id={`ms-date-input-${platId}`}
                            />
                          </div>

                          {/* Weekly Schedule Detection Badge */}
                          <div
                            className={`mt-1.5 px-2 py-1 rounded-md border text-[10px] font-sans flex flex-col items-center justify-center text-center transition-all ${uploadStatus.badgeClass}`}
                            title={uploadStatus.subtext}
                          >
                            <span className="flex items-center gap-1 font-bold">
                              <span className={`w-1.5 h-1.5 rounded-full ${uploadStatus.dotClass}`} />
                              <span>{uploadStatus.label}</span>
                            </span>
                            <span className="text-[9px] font-mono opacity-85 mt-0.5 leading-tight">
                              {uploadStatus.subtext}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Column 7: Jumlah Upload (Angka) */}
                      <td className="py-3.5 px-2 align-top text-center">
                        <div className="inline-block">
                          <input
                            type="number"
                            min="0"
                            value={row.jumlahUpload === undefined || row.jumlahUpload === 0 ? '0' : row.jumlahUpload}
                            onChange={(e) => handleFieldChange(platId, 'jumlahUpload', parseInt(e.target.value, 10) || 0)}
                            className="w-20 px-2 py-1.5 text-xs text-center font-mono font-bold rounded-lg bg-neutral-950 border border-[#333] text-amber-300 focus:outline-none focus:border-amber-500"
                            title="Jumlah item yang diupload pada sesi terakhir"
                            id={`ms-upload-count-input-${platId}`}
                          />
                          <span className="block text-[10px] text-neutral-500 mt-1">item upload</span>
                        </div>
                      </td>

                      {/* Column 8: Konsentrasi Akun (Text) */}
                      <td className="py-3.5 px-4 align-top">
                        <input
                          type="text"
                          value={row.konsentrasiAkun || ''}
                          onChange={(e) => handleFieldChange(platId, 'konsentrasiAkun', e.target.value)}
                          placeholder="Contoh: Flat Vector Icon, Vintage Pattern, 3D Render..."
                          className="w-full px-2.5 py-1.5 text-xs rounded-lg bg-neutral-950 border border-[#333] text-neutral-200 placeholder-neutral-600 focus:outline-none focus:border-indigo-500 transition-colors"
                          id={`ms-konsentrasi-input-${platId}`}
                        />
                        <div className="flex items-center gap-1.5 mt-1.5 text-[10px] text-neutral-500">
                          <Palette className="w-3 h-3 text-indigo-400" />
                          <span>Fokus Niche / Tema Visual</span>
                        </div>
                      </td>

                      {/* Column 7: Aksi / Simpan Perbaris */}
                      <td className="py-3.5 px-3 align-top text-center">
                        <div className="flex flex-col gap-1.5">
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleSaveRow(platId)}
                            className={`w-full py-1.5 px-3 rounded-lg text-xs font-sans font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                              isSaved
                                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-900/40'
                                : 'bg-indigo-600/90 hover:bg-indigo-500 text-white shadow-sm shadow-indigo-900/20'
                            }`}
                            id={`ms-save-row-btn-${platId}`}
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

                          {/* Quick Visibility Toggle - Admin only */}
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
          <Info className="w-4 h-4 text-indigo-400 shrink-0" />
          <span>
            Setiap baris yang disimpan akan langsung tersinkronisasi ke Cloud Firestore dan terhubung otomatis dengan Gmail Master &amp; Kelola Akun Platform.
          </span>
        </div>
        <div className="flex items-center gap-2 text-[11px] text-neutral-400 font-mono">
          <span>Terhubung ke {microstockAccounts.length} Akun Microstock</span>
        </div>
      </div>
    </div>
  );
};
