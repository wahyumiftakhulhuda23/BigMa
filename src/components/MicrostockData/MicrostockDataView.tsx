import React, { useState, useMemo, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  PlatformAccount, 
  GmailAccount, 
  MicrostockItem 
} from '../../types';
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
  Filter
} from 'lucide-react';

interface MicrostockDataViewProps {
  platformAccounts: PlatformAccount[];
  gmails: GmailAccount[];
  microstockItems: MicrostockItem[];
  onSaveMicrostockItem: (item: MicrostockItem) => void;
  onSaveAllMicrostockItems?: (items: MicrostockItem[]) => void;
  onAddMicrostockAccount: (defaultPlatform?: string) => void;
  onEditPlatformAccount?: (account: PlatformAccount) => void;
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
}) => {
  // 1. Filter accounts that belong to Microstock (exclude YouTube unless explicitly named stock)
  const microstockAccounts = useMemo(() => {
    return platformAccounts.filter(p => {
      const plat = (p.platform || '').trim();
      // YouTube is handled in Penjadwalan YouTube
      if (plat.toLowerCase() === 'youtube') return false;
      return true;
    });
  }, [platformAccounts]);

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

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [platformFilter, setPlatformFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'default' | 'item-desc' | 'new-desc' | 'reject-desc'>('default');

  // Synchronize microstock items into local row states
  useEffect(() => {
    const initialRows: { [platId: string]: MicrostockItem } = {};
    microstockAccounts.forEach(account => {
      const existing = microstockItems.find(m => m.platformAccountId === account.id);
      if (existing) {
        initialRows[account.id] = { ...existing };
      } else {
        initialRows[account.id] = {
          id: `ms_${account.id}`,
          platformAccountId: account.id,
          jumlahItem: 0,
          newItem: 0,
          reject: 0,
          konsentrasiAkun: account.niche || '',
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

  // Save single row
  const handleSaveRow = (platId: string) => {
    const item = rowStates[platId];
    if (!item) return;
    onSaveMicrostockItem(item);
    setSavedRows(prev => ({ ...prev, [platId]: true }));
    setTimeout(() => {
      setSavedRows(prev => ({ ...prev, [platId]: false }));
    }, 2500);
  };

  // Save all rows
  const handleSaveAll = () => {
    const allItems: MicrostockItem[] = Object.values(rowStates);
    if (onSaveAllMicrostockItems) {
      onSaveAllMicrostockItems(allItems);
    } else {
      allItems.forEach(item => onSaveMicrostockItem(item));
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

    microstockAccounts.forEach(acc => {
      const row = rowStates[acc.id];
      if (row) {
        totalItems += Number(row.jumlahItem) || 0;
        totalNew += Number(row.newItem) || 0;
        totalReject += Number(row.reject) || 0;
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
      return 0;
    });
  }, [microstockAccounts, rowStates, gmailMap, searchQuery, platformFilter, sortBy]);

  return (
    <div className="space-y-6">
      {/* Header Banner - Highlight Menu #2 */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-950/40 via-neutral-900/90 to-blue-950/30 border border-indigo-500/30 p-5 sm:p-6 shadow-xl backdrop-blur-sm">
        <div className="absolute -right-8 -top-8 w-40 h-40 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2.5 mb-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-indigo-500/20 border border-indigo-500/40 text-indigo-300 text-xs font-mono font-bold tracking-wider uppercase">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                Menu Highlight #2
              </span>
              <span className="text-xs font-mono text-neutral-400">
                &bull; Portofolio &amp; Produksi Microstock Agency
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-sans font-black text-white tracking-tight flex items-center gap-3">
              <ImageIcon className="w-8 h-8 text-indigo-400" />
              <span>Data Microstock</span>
            </h2>
            <p className="text-xs sm:text-sm text-neutral-300 mt-1 max-w-2xl leading-relaxed">
              Tabel terintegrasi <strong className="text-white">Master Gmail</strong> dan <strong className="text-white">Kelola Akun Microstock</strong> (Adobe Stock, Shutterstock, Freepik, Vecteezy, dll). Pantau jumlah item portofolio, new submission, tingkat reject, dan konsentrasi tema akun.
            </p>
          </div>

          <div className="flex items-center gap-2.5 self-start md:self-auto">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleSaveAll}
              className="px-4 py-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-neutral-200 border border-[#333] hover:border-neutral-500 text-xs font-sans font-bold flex items-center gap-2 shadow-sm transition-all cursor-pointer"
              id="ms-save-all-btn"
              title="Simpan seluruh baris ke Cloud"
            >
              <Save className="w-4 h-4 text-emerald-400" />
              <span>Simpan Semua</span>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onAddMicrostockAccount('Adobe Stock')}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white text-xs font-sans font-black flex items-center gap-2 shadow-lg shadow-indigo-900/30 transition-all cursor-pointer ring-1 ring-indigo-400/40"
              id="ms-add-account-btn"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Akun Microstock</span>
            </motion.button>
          </div>
        </div>

        {/* Metrics Row */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mt-6 pt-5 border-t border-white/10">
          <div className="p-3 rounded-xl bg-neutral-950/60 border border-neutral-800/80">
            <span className="text-[10px] uppercase tracking-wider font-bold text-neutral-400 block">Total Akun Stock</span>
            <span className="text-xl font-mono font-black text-white mt-0.5 block">{metrics.totalAccounts} Akun</span>
          </div>

          <div className="p-3 rounded-xl bg-neutral-950/60 border border-neutral-800/80">
            <span className="text-[10px] uppercase tracking-wider font-bold text-neutral-400 block">Total Item Online</span>
            <span className="text-xl font-mono font-black text-indigo-300 mt-0.5 block flex items-center gap-1.5">
              <span>{metrics.totalItems.toLocaleString()}</span>
              <span className="text-xs font-normal text-indigo-400/80">Item</span>
            </span>
          </div>

          <div className="p-3 rounded-xl bg-neutral-950/60 border border-neutral-800/80">
            <span className="text-[10px] uppercase tracking-wider font-bold text-neutral-400 block">New / Pending</span>
            <span className="text-xl font-mono font-black text-emerald-400 mt-0.5 block flex items-center gap-1.5">
              <span>{metrics.totalNew.toLocaleString()}</span>
              <span className="text-xs font-normal text-emerald-400/80">Baru</span>
            </span>
          </div>

          <div className="p-3 rounded-xl bg-neutral-950/60 border border-neutral-800/80">
            <span className="text-[10px] uppercase tracking-wider font-bold text-neutral-400 block">Total Reject</span>
            <span className="text-xl font-mono font-black text-rose-400 mt-0.5 block flex items-center gap-1.5">
              <span>{metrics.totalReject.toLocaleString()}</span>
              <span className="text-xs font-normal text-rose-400/80">Ditolak</span>
            </span>
          </div>

          <div className="p-3 rounded-xl bg-neutral-950/60 border border-neutral-800/80">
            <span className="text-[10px] uppercase tracking-wider font-bold text-neutral-400 block">Acceptance Rate</span>
            <span className="text-xl font-mono font-black text-emerald-400 mt-0.5 block flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>{metrics.acceptRate}%</span>
            </span>
          </div>
        </div>
      </div>

      {/* Control Bar: Search & Platform Filters */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 p-3.5 rounded-xl bg-neutral-950/80 border border-[#262626]">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari akun, email master Gmail, platform stock, atau konsentrasi tema..."
            className="w-full pl-9 pr-4 py-2 text-xs rounded-lg bg-neutral-900 border border-[#333] text-white placeholder-neutral-500 focus:outline-none focus:border-indigo-500"
            id="ms-search-input"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-none">
          {/* Platform Filter */}
          <div className="flex items-center gap-1 bg-neutral-900 p-1 rounded-lg border border-[#333] text-xs">
            <Filter className="w-3.5 h-3.5 text-neutral-400 ml-1.5" />
            <select
              value={platformFilter}
              onChange={(e) => setPlatformFilter(e.target.value)}
              className="bg-transparent text-xs text-neutral-200 focus:outline-none cursor-pointer pr-1"
              id="ms-filter-platform-select"
            >
              <option value="all" className="bg-neutral-900 text-white">Semua Platform Stock</option>
              <option value="Adobe Stock" className="bg-neutral-900 text-red-300">Adobe Stock</option>
              <option value="Shutterstock" className="bg-neutral-900 text-rose-300">Shutterstock</option>
              <option value="Freepik" className="bg-neutral-900 text-blue-300">Freepik</option>
              <option value="Vecteezy" className="bg-neutral-900 text-amber-300">Vecteezy</option>
              <option value="Envato" className="bg-neutral-900 text-emerald-300">Envato</option>
              <option value="Creative Fabrica" className="bg-neutral-900 text-purple-300">Creative Fabrica</option>
            </select>
          </div>

          {/* Sort By */}
          <div className="flex items-center gap-1 bg-neutral-900 p-1 rounded-lg border border-[#333] text-xs">
            <ArrowUpDown className="w-3.5 h-3.5 text-neutral-400 ml-1.5" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-transparent text-xs text-neutral-200 focus:outline-none cursor-pointer pr-1"
              id="ms-sort-select"
            >
              <option value="default" className="bg-neutral-900 text-white">Urutan Default</option>
              <option value="item-desc" className="bg-neutral-900 text-white">Item Terbanyak</option>
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
                  <th className="py-3 px-4 w-64">Master Gmail</th>
                  <th className="py-3 px-4 min-w-[200px]">Platform &amp; Akun</th>
                  <th className="py-3 px-3 w-32 text-center">Jumlah Item</th>
                  <th className="py-3 px-3 w-28 text-center">New</th>
                  <th className="py-3 px-3 w-32 text-center">Reject</th>
                  <th className="py-3 px-4 min-w-[220px]">Konsentrasi Akun</th>
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

                  return (
                    <tr 
                      key={platId}
                      className="hover:bg-neutral-900/40 transition-colors"
                      id={`ms-row-${platId}`}
                    >
                      {/* Column 1: Master Gmail */}
                      <td className="py-3.5 px-4 align-top">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-emerald-400" />
                            <span className="font-mono font-bold text-neutral-200 truncate max-w-[170px]" title={gmail?.email || 'Belum Terhubung'}>
                              {gmail?.email || 'Tidak ada Gmail'}
                            </span>
                            {gmail?.email && (
                              <button
                                type="button"
                                onClick={() => handleCopyEmail(gmail.email, `ms_gm_${platId}`)}
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
                            Master ID: {account.gmailId.slice(0, 10)}...
                          </p>
                        </div>
                      </td>

                      {/* Column 2: Platform & Akun */}
                      <td className="py-3.5 px-4 align-top">
                        <div className="space-y-1.5">
                          <div className="flex items-start justify-between gap-1.5">
                            <div>
                              {/* Platform Badge */}
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-sans font-bold border ${badge.bg}`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
                                <span>{badge.label}</span>
                              </span>

                              <p className="font-sans font-black text-sm text-white mt-1 hover:text-indigo-300 transition-colors">
                                {account.accountName}
                              </p>
                              <p className="text-[11px] text-neutral-400 font-mono flex items-center gap-1">
                                <span>{account.usernameOrHandle || '@account'}</span>
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

                            {onEditPlatformAccount && (
                              <button
                                type="button"
                                onClick={() => onEditPlatformAccount(account)}
                                className="p-1 rounded text-neutral-500 hover:text-neutral-200 hover:bg-neutral-800 transition-colors"
                                title="Edit Detail Kredensial Akun"
                              >
                                <Edit3 className="w-3 h-3" />
                              </button>
                            )}
                          </div>
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

                      {/* Column 6: Konsentrasi Akun (Text) */}
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
