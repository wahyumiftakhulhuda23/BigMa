import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { IncomeRecord, PlatformAccount, AppSettings } from '../../types';
import { exportToExcel, exportTableToPdf } from '../../utils/exportUtils';
import { formatCurrency, formatDateIndo } from '../../utils/formatters';
import { ConfirmModal } from '../ConfirmModal';
import { 
  TrendingUp, 
  Plus, 
  Search, 
  FileSpreadsheet, 
  FileText, 
  Edit3, 
  Trash2, 
  DollarSign, 
  Calendar, 
  BarChart3, 
  PieChart, 
  Filter, 
  Tag, 
  CreditCard,
  Layers,
  Sparkles
} from 'lucide-react';

interface IncomeDatabaseViewProps {
  incomes: IncomeRecord[];
  platformAccounts: PlatformAccount[];
  settings: AppSettings;
  onAddIncome: () => void;
  onEditIncome: (income: IncomeRecord) => void;
  onDeleteIncome: (id: string) => void;
}

export const IncomeDatabaseView: React.FC<IncomeDatabaseViewProps> = ({
  incomes,
  platformAccounts,
  settings,
  onAddIncome,
  onEditIncome,
  onDeleteIncome,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPlatform, setSelectedPlatform] = useState('All');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [incomeToDelete, setIncomeToDelete] = useState<{ id: string; name: string } | null>(null);

  // Compute Grand Totals
  const totalIncomeIdr = useMemo(() => {
    return incomes.reduce((acc, curr) => acc + (curr.amountIdr || 0), 0);
  }, [incomes]);

  const avgTransactionIdr = useMemo(() => {
    return incomes.length > 0 ? totalIncomeIdr / incomes.length : 0;
  }, [incomes, totalIncomeIdr]);

  // Compute Monthly Data for Visual Cash Flow Chart
  const monthlyData = useMemo(() => {
    const map: Record<string, { label: string; totalIdr: number; count: number; rawDate: string }> = {};
    
    incomes.forEach(inc => {
      if (!inc.date) return;
      const monthKey = inc.date.slice(0, 7); // "YYYY-MM"
      const [year, month] = monthKey.split('-');
      const d = new Date(parseInt(year, 10), parseInt(month, 10) - 1, 1);
      const label = d.toLocaleDateString('id-ID', { month: 'short', year: 'numeric' });

      if (!map[monthKey]) {
        map[monthKey] = { label, totalIdr: 0, count: 0, rawDate: monthKey };
      }
      map[monthKey].totalIdr += (inc.amountIdr || 0);
      map[monthKey].count += 1;
    });

    // Sort chronologically
    return Object.values(map).sort((a, b) => a.rawDate.localeCompare(b.rawDate));
  }, [incomes]);

  // Max value for bar scaling
  const maxMonthVal = useMemo(() => {
    return Math.max(...monthlyData.map(m => m.totalIdr), 1);
  }, [monthlyData]);

  // Platform Distribution
  const platformDistribution = useMemo(() => {
    const map: Record<string, number> = {};
    incomes.forEach(inc => {
      const plat = platformAccounts.find(p => p.id === inc.platformAccountId);
      const name = plat ? plat.platform : 'Lainnya';
      map[name] = (map[name] || 0) + (inc.amountIdr || 0);
    });

    return Object.entries(map)
      .map(([platform, total]) => ({
        platform,
        total,
        percentage: totalIncomeIdr > 0 ? (total / totalIncomeIdr) * 100 : 0,
      }))
      .sort((a, b) => b.total - a.total);
  }, [incomes, platformAccounts, totalIncomeIdr]);

  // Filtered List
  const filteredIncomes = useMemo(() => {
    return incomes.filter(inc => {
      const plat = platformAccounts.find(p => p.id === inc.platformAccountId);
      
      // Platform filter
      if (selectedPlatform !== 'All') {
        if (!plat || plat.platform !== selectedPlatform) return false;
      }

      // Category filter
      if (selectedCategory !== 'All') {
        if (inc.category !== selectedCategory) return false;
      }

      // Search query
      const term = searchTerm.toLowerCase();
      const matchesTerm = 
        (plat && plat.accountName.toLowerCase().includes(term)) ||
        (plat && plat.platform.toLowerCase().includes(term)) ||
        inc.paymentSource.toLowerCase().includes(term) ||
        inc.category.toLowerCase().includes(term) ||
        (inc.referenceNo && inc.referenceNo.toLowerCase().includes(term)) ||
        (inc.notes && inc.notes.toLowerCase().includes(term)) ||
        inc.amount.toString().includes(term) ||
        (inc.amountIdr && inc.amountIdr.toString().includes(term));

      return matchesTerm;
    });
  }, [incomes, platformAccounts, selectedPlatform, selectedCategory, searchTerm]);

  // Distinct platforms & categories for select options
  const distinctPlatforms = useMemo(() => {
    const set = new Set<string>();
    incomes.forEach(inc => {
      const p = platformAccounts.find(x => x.id === inc.platformAccountId);
      if (p) set.add(p.platform);
    });
    return Array.from(set);
  }, [incomes, platformAccounts]);

  const distinctCategories = useMemo(() => {
    const set = new Set<string>();
    incomes.forEach(inc => {
      if (inc.category) set.add(inc.category);
    });
    return Array.from(set);
  }, [incomes]);

  // Export handlers
  const handleExportExcel = () => {
    const rows = filteredIncomes.map((inc, idx) => {
      const plat = platformAccounts.find(p => p.id === inc.platformAccountId);
      return {
        No: idx + 1,
        Tanggal: inc.date,
        Platform: plat?.platform || '-',
        'Nama Akun': plat?.accountName || '-',
        'Mata Uang': inc.currency,
        'Nominal Asli': inc.amount,
        'Kurs (IDR)': inc.exchangeRate,
        'Total Bersih (IDR)': inc.amountIdr,
        'Sumber Rekening / Wallet': inc.paymentSource,
        'Kategori Pemasukan': inc.category,
        'No. Referensi': inc.referenceNo || '-',
        Catatan: inc.notes || '-',
      };
    });
    exportToExcel(rows, `Database_Pemasukan_BigMA_${new Date().toISOString().split('T')[0]}`, 'Database Pemasukan');
  };

  const handleExportPdf = () => {
    const headers = ['No', 'Tanggal', 'Platform & Akun', 'Nominal Asli', 'Nominal (IDR)', 'Sumber Rekening', 'Kategori'];
    const rows = filteredIncomes.map((inc, idx) => {
      const plat = platformAccounts.find(p => p.id === inc.platformAccountId);
      return [
        idx + 1,
        formatDateIndo(inc.date),
        `${plat?.platform || '-'}: ${plat?.accountName || '-'}`,
        formatCurrency(inc.amount, inc.currency),
        formatCurrency(inc.amountIdr, 'IDR'),
        inc.paymentSource,
        inc.category,
      ];
    });

    exportTableToPdf({
      title: 'Database Pemasukan & Kas - BigMA',
      subtitle: `Total Akumulasi Masuk: ${formatCurrency(totalIncomeIdr, 'IDR')} | ${incomes.length} Transaksi Tercatat`,
      filename: `Database_Pemasukan_BigMA_${new Date().toISOString().split('T')[0]}`,
      headers,
      rows,
      orientation: 'landscape',
    });
  };

  return (
    <div className="space-y-6" id="income-database-root">
      {/* Header & Main Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-2xl font-sans font-extrabold text-white tracking-tight">Database Pemasukan &amp; Kas</h2>
            <span className="px-2 py-0.5 rounded text-[10px] font-sans font-bold uppercase tracking-wider bg-amber-500/15 text-amber-300 border border-amber-500/30">
              Cash Inflow
            </span>
          </div>
          <p className="text-xs text-neutral-400 mt-1 max-w-2xl">
            Arsip lengkap penerimaan royalti, gajian YouTube AdSense, penjualan produk digital, dan penarikan kas microstock lengkap dengan kurs IDR otomatis.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {incomes.length > 0 && (
            <>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleExportExcel}
                className="px-3 py-2 bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-neutral-300 hover:text-white rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                id="export-excel-income-btn"
                title="Ekspor ke format Excel (.xlsx)"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                <span>Ekspor Excel</span>
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleExportPdf}
                className="px-3 py-2 bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-neutral-300 hover:text-white rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                id="export-pdf-income-btn"
                title="Ekspor ke format PDF Siap Cetak"
              >
                <FileText className="w-3.5 h-3.5 text-rose-400" />
                <span>Ekspor PDF</span>
              </motion.button>
            </>
          )}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onAddIncome}
            className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-neutral-950 rounded-lg text-xs font-sans font-bold flex items-center gap-1.5 transition-all shadow-md shadow-amber-500/20 cursor-pointer"
            id="add-income-btn"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Catat Pemasukan Baru</span>
          </motion.button>
        </div>
      </div>

      {/* Summary KPI Cards with Motion */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="p-4 bg-neutral-900/80 border border-[#262626] rounded-xl shadow-xs hover:border-neutral-700 transition-colors"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-wider font-sans font-bold text-neutral-400">Total Akumulasi Pemasukan</span>
            <div className="p-2 bg-amber-500/10 rounded-lg border border-amber-500/30">
              <TrendingUp className="w-4 h-4 text-amber-400" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-mono font-bold text-amber-400">
              {formatCurrency(totalIncomeIdr, 'IDR')}
            </div>
            <div className="text-xs text-neutral-400 mt-1">
              Dari {incomes.length} catatan pembayaran
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="p-4 bg-neutral-900/80 border border-[#262626] rounded-xl shadow-xs hover:border-neutral-700 transition-colors"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-wider font-sans font-bold text-neutral-400">Rata-Rata per Pencairan</span>
            <div className="p-2 bg-emerald-500/10 rounded-lg border border-emerald-500/30">
              <DollarSign className="w-4 h-4 text-emerald-400" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-mono font-bold text-emerald-400">
              {formatCurrency(avgTransactionIdr, 'IDR')}
            </div>
            <div className="text-xs text-neutral-400 mt-1">
              Nilai rerata per transaksi
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="p-4 bg-neutral-900/80 border border-[#262626] rounded-xl shadow-xs hover:border-neutral-700 transition-colors"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-wider font-sans font-bold text-neutral-400">Bulan Terpantau</span>
            <div className="p-2 bg-purple-500/10 rounded-lg border border-purple-500/30">
              <Calendar className="w-4 h-4 text-purple-400" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-mono font-bold text-purple-400">
              {monthlyData.length} Bulan
            </div>
            <div className="text-xs text-neutral-400 mt-1">
              Periode pencatatan aktif
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="p-4 bg-neutral-900/80 border border-[#262626] rounded-xl shadow-xs hover:border-neutral-700 transition-colors"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-wider font-sans font-bold text-neutral-400">Platform Kontributor</span>
            <div className="p-2 bg-sky-500/10 rounded-lg border border-sky-500/30">
              <Layers className="w-4 h-4 text-sky-400" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-mono font-bold text-sky-400">
              {platformDistribution.length} Platform
            </div>
            <div className="text-xs text-neutral-400 mt-1">
              Diversifikasi sumber royalti
            </div>
          </div>
        </motion.div>
      </div>

      {/* Visual Charts Grid (Monthly Cash Flow & Platform Breakdown) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Monthly Cash Flow Bar Chart */}
        <div className="lg:col-span-2 p-5 bg-neutral-900/80 border border-[#262626] rounded-xl shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-amber-400" />
                <h3 className="font-sans font-bold text-neutral-100 text-sm">Grafik Arus Kas Bulanan</h3>
              </div>
              <span className="text-[11px] font-mono text-neutral-500">Transparansi Pendapatan Bulanan</span>
            </div>

            {/* Visual Bar Chart */}
            <div className="h-52 flex items-end gap-3 pt-6 pb-2 px-2 border-b border-[#262626]">
              {monthlyData.map(m => {
                const heightPct = Math.max(10, Math.round((m.totalIdr / maxMonthVal) * 100));
                return (
                  <div key={m.rawDate} className="flex-1 flex flex-col items-center gap-1.5 group h-full justify-end">
                    {/* Tooltip value */}
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity text-[10px] font-mono font-bold text-amber-400 bg-neutral-950 border border-amber-500/40 px-1.5 py-0.5 rounded shadow-xs whitespace-nowrap mb-1">
                      {formatCurrency(m.totalIdr, 'IDR')}
                    </div>
                    {/* Animated Bar */}
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: `${heightPct}%` }}
                      transition={{ duration: 0.5, ease: 'easeOut' }}
                      className="w-full bg-gradient-to-t from-amber-600 to-amber-400 rounded-t hover:brightness-110 shadow-xs relative"
                    />
                    {/* Label */}
                    <span className="text-[11px] font-mono text-neutral-400 whitespace-nowrap mt-1">
                      {m.label}
                    </span>
                  </div>
                );
              })}

              {monthlyData.length === 0 && (
                <div className="w-full h-full flex flex-col items-center justify-center text-xs text-neutral-500 gap-1">
                  <BarChart3 className="w-8 h-8 text-neutral-700" />
                  <span>Belum ada transaksi bulanan yang tercatat.</span>
                </div>
              )}
            </div>
          </div>

          <div className="mt-3 flex items-center justify-between text-xs text-neutral-500 pt-2 font-mono">
            <span>Total periode: {monthlyData.length} Bulan</span>
            <span className="text-amber-400 font-sans font-semibold">BigMA Cash Flow Tracker</span>
          </div>
        </div>

        {/* Platform Share Distribution */}
        <div className="p-5 bg-neutral-900/80 border border-[#262626] rounded-xl shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <PieChart className="w-4 h-4 text-amber-400" />
                <h3 className="font-sans font-bold text-neutral-100 text-sm">Distribusi per Platform</h3>
              </div>
              <span className="text-[11px] font-mono text-neutral-500">Porsi Omset</span>
            </div>

            <div className="space-y-3">
              {platformDistribution.map(item => (
                <div key={item.platform} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-neutral-200">{item.platform}</span>
                    <span className="font-mono text-neutral-400 text-[11px]">
                      {formatCurrency(item.total, 'IDR')} ({item.percentage.toFixed(1)}%)
                    </span>
                  </div>
                  <div className="w-full bg-neutral-800 h-2 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${item.percentage}%` }}
                      transition={{ duration: 0.5, ease: 'easeOut' }}
                      className="bg-amber-400 h-2 rounded-full"
                    />
                  </div>
                </div>
              ))}

              {platformDistribution.length === 0 && (
                <div className="py-8 text-center text-xs text-neutral-500">
                  Belum ada data distribusi royalti.
                </div>
              )}
            </div>
          </div>

          <div className="text-[11px] text-neutral-500 mt-4 pt-2 border-t border-[#262626]">
            Keseimbangan portofolio aset microstock &amp; media
          </div>
        </div>
      </div>

      {/* Filter & Search Controls */}
      <div className="bg-neutral-900/70 p-2.5 rounded-xl border border-[#262626] shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Dropdown Filters */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <div className="flex items-center gap-1.5 text-xs text-neutral-400">
            <Filter className="w-3.5 h-3.5" />
            <span>Filter:</span>
          </div>

          <select
            value={selectedPlatform}
            onChange={(e) => setSelectedPlatform(e.target.value)}
            className="px-2.5 py-1.5 text-xs bg-neutral-950 border border-[#262626] rounded-lg focus:outline-hidden text-neutral-300"
          >
            <option value="All">Semua Platform</option>
            {distinctPlatforms.map(p => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-2.5 py-1.5 text-xs bg-neutral-950 border border-[#262626] rounded-lg focus:outline-hidden text-neutral-300"
          >
            <option value="All">Semua Kategori</option>
            {distinctCategories.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          {(selectedPlatform !== 'All' || selectedCategory !== 'All') && (
            <button
              onClick={() => {
                setSelectedPlatform('All');
                setSelectedCategory('All');
              }}
              className="text-xs text-rose-400 hover:text-rose-300 px-2 transition-colors cursor-pointer"
            >
              Reset Filter
            </button>
          )}
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-neutral-500" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cari transaksi, platform, invoice, rekening..."
            className="w-full pl-9 pr-4 py-1.5 text-xs bg-neutral-950 text-neutral-200 placeholder:text-neutral-600 border border-[#262626] rounded-lg focus:outline-hidden focus:border-amber-500/60 transition-colors"
            id="search-income-input"
          />
        </div>
      </div>

      {/* Income Records Table */}
      <div className="bg-neutral-900/70 border border-[#262626] rounded-xl shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse" id="table-income-database">
            <thead>
              <tr className="bg-neutral-950/80 text-neutral-400 uppercase tracking-wider text-[10px] font-sans font-bold border-b border-[#262626]">
                <th className="py-3 px-3.5 w-12 text-center">No</th>
                <th className="py-3 px-3.5 min-w-[110px]">Tanggal</th>
                <th className="py-3 px-3.5 min-w-[200px]">Platform &amp; Akun</th>
                <th className="py-3 px-3.5 min-w-[150px]">Nominal Asli</th>
                <th className="py-3 px-3.5 min-w-[170px]">Nominal (IDR)</th>
                <th className="py-3 px-3.5 min-w-[160px]">Sumber Dana</th>
                <th className="py-3 px-3.5 min-w-[170px]">Kategori Pendapatan</th>
                <th className="py-3 px-3.5 min-w-[160px]">No. Ref / Catatan</th>
                <th className="py-3 px-3.5 w-24 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#262626]/70">
              {filteredIncomes.map((inc, index) => {
                const plat = platformAccounts.find(p => p.id === inc.platformAccountId);

                return (
                  <tr key={inc.id} className="hover:bg-neutral-900/60 transition-colors" id={`row-income-${inc.id}`}>
                    {/* No */}
                    <td className="py-3 px-3.5 text-center font-mono text-neutral-500">
                      {index + 1}
                    </td>

                    {/* Tanggal */}
                    <td className="py-3 px-3.5 font-mono text-neutral-300">
                      {formatDateIndo(inc.date)}
                    </td>

                    {/* Platform & Akun */}
                    <td className="py-3 px-3.5">
                      <div className="font-semibold text-neutral-100 text-sm">{plat?.accountName || 'Akun Terhapus'}</div>
                      <span className="text-[11px] text-amber-400 font-medium">{plat?.platform || '-'}</span>
                    </td>

                    {/* Nominal Asli */}
                    <td className="py-3 px-3.5">
                      <div className="font-mono font-medium text-neutral-200 text-xs">
                        {formatCurrency(inc.amount, inc.currency)}
                      </div>
                      {inc.currency !== 'IDR' && (
                        <span className="text-[10px] text-neutral-500 font-mono">Kurs: Rp {inc.exchangeRate.toLocaleString('id-ID')}</span>
                      )}
                    </td>

                    {/* Nominal IDR */}
                    <td className="py-3 px-3.5">
                      <div className="font-mono font-bold text-emerald-400 text-sm">
                        {formatCurrency(inc.amountIdr, 'IDR')}
                      </div>
                    </td>

                    {/* Sumber Dana */}
                    <td className="py-3 px-3.5">
                      <span className="inline-flex items-center gap-1 text-neutral-300 font-medium text-[11px] bg-neutral-900 px-2 py-0.5 rounded border border-[#262626]">
                        <CreditCard className="w-3 h-3 text-neutral-500" />
                        {inc.paymentSource}
                      </span>
                    </td>

                    {/* Kategori */}
                    <td className="py-3 px-3.5">
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold uppercase tracking-wider bg-neutral-900 text-neutral-300 border border-[#333]">
                        {inc.category}
                      </span>
                    </td>

                    {/* No Ref & Catatan */}
                    <td className="py-3 px-3.5 space-y-0.5">
                      {inc.referenceNo && (
                        <div className="font-mono text-[11px] text-neutral-300 font-semibold select-all">
                          {inc.referenceNo}
                        </div>
                      )}
                      {inc.notes && (
                        <div className="text-[10px] text-neutral-400 line-clamp-1">
                          {inc.notes}
                        </div>
                      )}
                      {!inc.referenceNo && !inc.notes && (
                        <span className="text-neutral-500 italic text-[11px]">-</span>
                      )}
                    </td>

                    {/* Aksi */}
                    <td className="py-3 px-3.5 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => onEditIncome(inc)}
                          className="p-1.5 text-sky-400 hover:bg-neutral-800 rounded-lg transition-colors cursor-pointer"
                          title="Edit Transaksi"
                          id={`edit-income-${inc.id}`}
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const plat = platformAccounts.find(p => p.id === inc.platformAccountId);
                            setIncomeToDelete({
                              id: inc.id,
                              name: `${plat?.accountName || 'Pemasukan'} - ${formatDateIndo(inc.date)} (${formatCurrency(inc.amount, inc.currency)})`,
                            });
                          }}
                          className="p-1.5 text-rose-400 hover:bg-neutral-800 rounded-lg transition-colors cursor-pointer"
                          title="Hapus Transaksi"
                          id={`del-income-${inc.id}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {/* Empty state */}
              {filteredIncomes.length === 0 && (
                <tr>
                  <td colSpan={9} className="py-16 text-center text-neutral-400">
                    <motion.div 
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ duration: 0.3 }}
                      className="max-w-sm mx-auto flex flex-col items-center"
                    >
                      <div className="w-14 h-14 rounded-2xl bg-neutral-900 border border-neutral-800 flex items-center justify-center mb-3 shadow-inner">
                        <TrendingUp className="w-7 h-7 text-amber-400" />
                      </div>
                      <p className="font-sans font-bold text-base text-neutral-200">
                        {incomes.length === 0 ? 'Belum Ada Transaksi Pemasukan' : 'Tidak Ada Data yang Cocok'}
                      </p>
                      <p className="text-xs text-neutral-400 mt-1 max-w-xs leading-relaxed">
                        {incomes.length === 0 
                          ? 'Catat penerimaan royalti pertama Anda atau lakukan cashout dari tab Keuangan Realtime.'
                          : 'Coba sesuaikan kata kunci pencarian atau reset filter kategori/platform.'}
                      </p>
                      <motion.button
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={onAddIncome}
                        className="mt-4 px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 text-neutral-950 rounded-lg text-xs font-sans font-bold flex items-center gap-1.5 shadow-md shadow-amber-500/20 cursor-pointer"
                      >
                        <Plus className="w-4 h-4 stroke-[3]" />
                        <span>Catat Pemasukan Pertama</span>
                      </motion.button>
                    </motion.div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Confirmation Modal for Deleting Income Record */}
      <ConfirmModal
        isOpen={!!incomeToDelete}
        onClose={() => setIncomeToDelete(null)}
        onConfirm={() => {
          if (incomeToDelete) {
            onDeleteIncome(incomeToDelete.id);
          }
        }}
        title="Hapus Catatan Pemasukan"
        message="Apakah Anda yakin ingin menghapus catatan pemasukan ini? Data grafik dan total omset akan otomatis disinkronisasi."
        itemName={incomeToDelete?.name}
        confirmLabel="Ya, Hapus Pemasukan"
      />
    </div>
  );
};
