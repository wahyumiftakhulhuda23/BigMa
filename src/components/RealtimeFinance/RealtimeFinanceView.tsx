import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { RealtimeFinance, PlatformAccount, GmailAccount, AppSettings } from '../../types';
import { exportToExcel, exportTableToPdf } from '../../utils/exportUtils';
import { formatCurrency, formatDateIndo } from '../../utils/formatters';
import { ConfirmModal } from '../ConfirmModal';
import { 
  Wallet, 
  Plus, 
  Search, 
  FileSpreadsheet, 
  FileText, 
  Edit3, 
  Trash2, 
  ArrowUpRight, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Coins, 
  TrendingUp,
  CreditCard,
  PlusCircle,
  Sparkles
} from 'lucide-react';

interface RealtimeFinanceViewProps {
  finances: RealtimeFinance[];
  platformAccounts: PlatformAccount[];
  gmails: GmailAccount[];
  settings: AppSettings;
  onAddFinance: () => void;
  onEditFinance: (finance: RealtimeFinance) => void;
  onDeleteFinance: (id: string) => void;
  onCashoutToIncome: (finance: RealtimeFinance) => void;
}

export const RealtimeFinanceView: React.FC<RealtimeFinanceViewProps> = ({
  finances,
  platformAccounts,
  gmails,
  settings,
  onAddFinance,
  onEditFinance,
  onDeleteFinance,
  onCashoutToIncome,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'All' | 'Ready' | 'Pending'>('All');
  const [financeToDelete, setFinanceToDelete] = useState<{ id: string; name: string } | null>(null);

  // Compute grand totals converted to IDR
  let totalAvailableIdr = 0;
  let totalPendingIdr = 0;
  let readyToPayoutCount = 0;

  finances.forEach(f => {
    const rate = f.currency === 'USD' ? settings.usdToIdrRate : f.currency === 'EUR' ? settings.eurToIdrRate : 1;
    totalAvailableIdr += f.availableBalance * rate;
    totalPendingIdr += f.pendingEarnings * rate;
    if (f.availableBalance >= f.payoutThreshold && f.payoutThreshold > 0) {
      readyToPayoutCount++;
    }
  });

  // Filtered rows
  const filteredFinances = finances.filter(f => {
    const plat = platformAccounts.find(p => p.id === f.platformAccountId);
    const gmail = plat ? gmails.find(g => g.id === plat.gmailId) : null;
    const isReady = f.availableBalance >= f.payoutThreshold && f.payoutThreshold > 0;

    if (filterStatus === 'Ready' && !isReady) return false;
    if (filterStatus === 'Pending' && isReady) return false;

    const term = searchTerm.toLowerCase();
    const matchesTerm = 
      (plat && plat.accountName.toLowerCase().includes(term)) ||
      (plat && plat.platform.toLowerCase().includes(term)) ||
      (gmail && gmail.email.toLowerCase().includes(term)) ||
      f.paymentMethod.toLowerCase().includes(term) ||
      (f.accountHolder && f.accountHolder.toLowerCase().includes(term)) ||
      (f.notes && f.notes.toLowerCase().includes(term));

    return matchesTerm;
  });

  // Export handlers
  const handleExportExcel = () => {
    const rows = filteredFinances.map((f, idx) => {
      const plat = platformAccounts.find(p => p.id === f.platformAccountId);
      const gmail = plat ? gmails.find(g => g.id === plat.gmailId) : null;
      const rate = f.currency === 'USD' ? settings.usdToIdrRate : f.currency === 'EUR' ? settings.eurToIdrRate : 1;
      const estIdr = f.availableBalance * rate;

      return {
        No: idx + 1,
        Platform: plat?.platform || '-',
        'Nama Akun': plat?.accountName || '-',
        'Gmail Pengelola': gmail?.email || '-',
        'Mata Uang': f.currency,
        'Saldo Tersedia': f.availableBalance,
        'Estimasi (IDR)': estIdr,
        'Pending Berjalan': f.pendingEarnings,
        'Batas Payout': f.payoutThreshold,
        'Status Siap Payout': f.availableBalance >= f.payoutThreshold && f.payoutThreshold > 0 ? 'YA' : 'BELUM',
        'Metode Payout': f.paymentMethod,
        'Pemilik Rekening / Email': f.accountHolder || '-',
        'Terakhir Update': formatDateIndo(f.lastUpdated),
        Catatan: f.notes || '-',
      };
    });
    exportToExcel(rows, `Keuangan_Realtime_BigMA_${new Date().toISOString().split('T')[0]}`, 'Keuangan Realtime');
  };

  const handleExportPdf = () => {
    const headers = ['No', 'Platform & Akun', 'Saldo Realtime', 'Estimasi (IDR)', 'Pending', 'Batas Payout', 'Status Payout', 'Metode Bayar'];
    const rows = filteredFinances.map((f, idx) => {
      const plat = platformAccounts.find(p => p.id === f.platformAccountId);
      const rate = f.currency === 'USD' ? settings.usdToIdrRate : f.currency === 'EUR' ? settings.eurToIdrRate : 1;
      const estIdr = f.availableBalance * rate;
      const isReady = f.availableBalance >= f.payoutThreshold && f.payoutThreshold > 0;

      return [
        idx + 1,
        `${plat?.platform || '-'}\n${plat?.accountName || '-'}`,
        formatCurrency(f.availableBalance, f.currency),
        formatCurrency(estIdr, 'IDR'),
        formatCurrency(f.pendingEarnings, f.currency),
        formatCurrency(f.payoutThreshold, f.currency),
        isReady ? 'SIAP PAYOUT' : 'BELUM',
        f.paymentMethod,
      ];
    });

    exportTableToPdf({
      title: 'Monitoring Keuangan Realtime - BigMA',
      subtitle: `Total Saldo Tersedia: ${formatCurrency(totalAvailableIdr, 'IDR')} | ${readyToPayoutCount} Akun Siap Payout`,
      filename: `Keuangan_Realtime_BigMA_${new Date().toISOString().split('T')[0]}`,
      headers,
      rows,
      orientation: 'landscape',
    });
  };

  return (
    <div className="space-y-6" id="realtime-finance-root">
      {/* Header & Main Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-2xl font-sans font-extrabold text-white tracking-tight">Keuangan Realtime</h2>
            <span className="px-2 py-0.5 rounded text-[10px] font-sans font-bold uppercase tracking-wider bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
              Live Balances
            </span>
          </div>
          <p className="text-xs text-neutral-400 mt-1 max-w-2xl">
            Monitoring saldo terkini dari setiap channel &amp; platform. Lacak status ambang batas pencairan (threshold payout) dan cairkan langsung ke database kas pemasukan.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {finances.length > 0 && (
            <>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleExportExcel}
                className="px-3 py-2 bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-neutral-300 hover:text-white rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                id="export-excel-finance-btn"
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
                id="export-pdf-finance-btn"
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
            onClick={onAddFinance}
            className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-emerald-400 hover:from-emerald-400 hover:to-emerald-300 text-neutral-950 rounded-lg text-xs font-sans font-bold flex items-center gap-1.5 transition-all shadow-md shadow-emerald-500/20 cursor-pointer"
            id="add-finance-btn"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Input Saldo Realtime</span>
          </motion.button>
        </div>
      </div>

      {/* Summary Stat Cards with Motion */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="p-4 bg-neutral-900/80 border border-[#262626] rounded-xl shadow-xs hover:border-neutral-700 transition-colors"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-wider font-sans font-bold text-neutral-400">Total Saldo Tersedia</span>
            <div className="p-2 bg-emerald-500/10 rounded-lg border border-emerald-500/30">
              <Wallet className="w-4 h-4 text-emerald-400" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-mono font-bold text-emerald-400">
              {formatCurrency(totalAvailableIdr, 'IDR')}
            </div>
            <div className="text-xs text-neutral-400 mt-1">
              Konversi Kurs: USD @ Rp {settings.usdToIdrRate.toLocaleString()} &bull; EUR @ Rp {settings.eurToIdrRate.toLocaleString()}
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
            <span className="text-[10px] uppercase tracking-wider font-sans font-bold text-neutral-400">Siap Cashout / Payout</span>
            <div className="p-2 bg-amber-500/10 rounded-lg border border-amber-500/30">
              <CheckCircle2 className="w-4 h-4 text-amber-400" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-mono font-bold text-amber-400">
              {readyToPayoutCount} Akun
            </div>
            <div className="text-xs text-neutral-400 mt-1">
              Telah mencapai ambang batas payout
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
            <span className="text-[10px] uppercase tracking-wider font-sans font-bold text-neutral-400">Pending Berjalan</span>
            <div className="p-2 bg-purple-500/10 rounded-lg border border-purple-500/30">
              <Coins className="w-4 h-4 text-purple-400" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-mono font-bold text-purple-400">
              {formatCurrency(totalPendingIdr, 'IDR')}
            </div>
            <div className="text-xs text-neutral-400 mt-1">
              Pendapatan sedang ditinjau platform
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
            <span className="text-[10px] uppercase tracking-wider font-sans font-bold text-neutral-400">Akun Dipantau</span>
            <div className="p-2 bg-sky-500/10 rounded-lg border border-sky-500/30">
              <TrendingUp className="w-4 h-4 text-sky-400" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-mono font-bold text-white">
              {finances.length} / {platformAccounts.length}
            </div>
            <div className="text-xs text-neutral-400 mt-1">
              {platformAccounts.length - finances.length > 0
                ? `${platformAccounts.length - finances.length} akun belum diinput saldo`
                : 'Semua akun telah dipantau'}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-neutral-900/70 p-2.5 rounded-xl border border-[#262626] shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 w-full sm:w-auto">
          <button
            onClick={() => setFilterStatus('All')}
            className={`px-3 py-1.5 rounded-lg text-xs font-sans font-semibold transition-all cursor-pointer ${
              filterStatus === 'All' ? 'bg-neutral-800 text-white border border-[#444]' : 'bg-neutral-950 text-neutral-400 hover:text-neutral-200 border border-[#262626]'
            }`}
          >
            Semua Akun ({finances.length})
          </button>
          <button
            onClick={() => setFilterStatus('Ready')}
            className={`px-3 py-1.5 rounded-lg text-xs font-sans font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
              filterStatus === 'Ready' ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-700/50' : 'bg-neutral-950 text-neutral-400 hover:text-emerald-400 border border-[#262626]'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Siap Payout ({readyToPayoutCount})</span>
          </button>
          <button
            onClick={() => setFilterStatus('Pending')}
            className={`px-3 py-1.5 rounded-lg text-xs font-sans font-semibold transition-all cursor-pointer ${
              filterStatus === 'Pending' ? 'bg-neutral-800 text-white border border-[#444]' : 'bg-neutral-950 text-neutral-400 hover:text-neutral-200 border border-[#262626]'
            }`}
          >
            Belum Capai Batas ({finances.length - readyToPayoutCount})
          </button>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-neutral-500" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cari platform, nama channel/akun, Gmail..."
            className="w-full pl-9 pr-4 py-1.5 text-xs bg-neutral-950 text-neutral-200 placeholder:text-neutral-600 border border-[#262626] rounded-lg focus:outline-hidden focus:border-amber-500/60 transition-colors"
            id="search-finance-input"
          />
        </div>
      </div>

      {/* Finance Table */}
      <div className="bg-neutral-900/70 border border-[#262626] rounded-xl shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse" id="table-realtime-finance">
            <thead>
              <tr className="bg-neutral-950/80 text-neutral-400 uppercase tracking-wider text-[10px] font-sans font-bold border-b border-[#262626]">
                <th className="py-3 px-3.5 w-12 text-center">No</th>
                <th className="py-3 px-3.5 min-w-[200px]">Platform &amp; Nama Akun</th>
                <th className="py-3 px-3.5 min-w-[170px]">Gmail Pengelola</th>
                <th className="py-3 px-3.5 min-w-[180px]">Saldo Tersedia (Realtime)</th>
                <th className="py-3 px-3.5 min-w-[130px]">Pending Berjalan</th>
                <th className="py-3 px-3.5 min-w-[180px]">Ambang Batas &amp; Status Payout</th>
                <th className="py-3 px-3.5 min-w-[170px]">Metode Pembayaran</th>
                <th className="py-3 px-3.5 min-w-[110px]">Terakhir Update</th>
                <th className="py-3 px-3.5 w-28 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#262626]/70">
              {filteredFinances.map((fin, index) => {
                const plat = platformAccounts.find(p => p.id === fin.platformAccountId);
                const gmail = plat ? gmails.find(g => g.id === plat.gmailId) : null;
                const rate = fin.currency === 'USD' ? settings.usdToIdrRate : fin.currency === 'EUR' ? settings.eurToIdrRate : 1;
                const estIdr = fin.availableBalance * rate;
                const isReady = fin.availableBalance >= fin.payoutThreshold && fin.payoutThreshold > 0;
                const progressPct = fin.payoutThreshold > 0 
                  ? Math.min(100, Math.round((fin.availableBalance / fin.payoutThreshold) * 100))
                  : 100;

                return (
                  <tr key={fin.id} className="hover:bg-neutral-900/60 transition-colors" id={`row-finance-${fin.id}`}>
                    {/* No */}
                    <td className="py-3 px-3.5 text-center font-mono text-neutral-500">
                      {index + 1}
                    </td>

                    {/* Platform & Account */}
                    <td className="py-3 px-3.5">
                      <div className="font-semibold text-neutral-100 text-sm">{plat?.accountName || 'Akun Tidak Dikenal'}</div>
                      <div className="text-[11px] text-amber-400 font-medium mt-0.5 flex items-center gap-1">
                        <span>{plat?.platform}</span>
                        {plat?.usernameOrHandle && <span className="text-neutral-500">({plat.usernameOrHandle})</span>}
                      </div>
                    </td>

                    {/* Gmail */}
                    <td className="py-3 px-3.5">
                      {gmail ? (
                        <div className="font-medium text-neutral-300 text-[11px] select-all truncate max-w-[160px]">
                          {gmail.email}
                        </div>
                      ) : (
                        <span className="text-neutral-500 italic text-[11px]">-</span>
                      )}
                    </td>

                    {/* Saldo Tersedia */}
                    <td className="py-3 px-3.5">
                      <div className="font-mono font-bold text-emerald-400 text-sm">
                        {formatCurrency(fin.availableBalance, fin.currency)}
                      </div>
                      {fin.currency !== 'IDR' && (
                        <div className="text-[10px] text-neutral-400 font-mono">
                          ≈ {formatCurrency(estIdr, 'IDR')}
                        </div>
                      )}
                    </td>

                    {/* Pending Berjalan */}
                    <td className="py-3 px-3.5">
                      <div className="font-mono font-medium text-amber-400 text-xs">
                        {formatCurrency(fin.pendingEarnings, fin.currency)}
                      </div>
                      <div className="text-[10px] text-neutral-500">In-review</div>
                    </td>

                    {/* Ambang Batas & Status */}
                    <td className="py-3 px-3.5 space-y-1.5">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-neutral-400 font-mono text-[10px]">Batas: {formatCurrency(fin.payoutThreshold, fin.currency)}</span>
                        <span className={`font-mono font-bold text-[10px] ${isReady ? 'text-emerald-400' : 'text-neutral-400'}`}>
                          {progressPct}%
                        </span>
                      </div>
                      <div className="w-full bg-neutral-800 rounded-full h-1.5 overflow-hidden">
                        <div
                          className={`h-1.5 rounded-full ${isReady ? 'bg-emerald-500' : 'bg-neutral-600'}`}
                          style={{ width: `${progressPct}%` }}
                        />
                      </div>
                      <div>
                        {isReady ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-semibold uppercase tracking-wider bg-emerald-950/40 text-emerald-400 border border-emerald-800/50">
                            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                            SIAP CASHOUT
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] text-neutral-500 font-medium">
                            <Clock className="w-3 h-3 text-neutral-500" />
                            Mengumpulkan batas
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Metode Pembayaran */}
                    <td className="py-3 px-3.5 space-y-0.5">
                      <div className="font-medium text-neutral-200 text-[11px] flex items-center gap-1">
                        <CreditCard className="w-3.5 h-3.5 text-neutral-500 shrink-0" />
                        <span>{fin.paymentMethod}</span>
                      </div>
                      {fin.accountHolder && (
                        <div className="text-[10px] text-neutral-400 truncate max-w-[150px]">
                          {fin.accountHolder}
                        </div>
                      )}
                    </td>

                    {/* Terakhir Update */}
                    <td className="py-3 px-3.5 text-[11px] text-neutral-400 font-mono">
                      {formatDateIndo(fin.lastUpdated)}
                    </td>

                    {/* Aksi */}
                    <td className="py-3 px-3.5 text-center">
                      <div className="flex items-center justify-center gap-1">
                        {isReady && (
                          <button
                            onClick={() => onCashoutToIncome(fin)}
                            className="p-1.5 text-emerald-400 hover:bg-neutral-800 rounded-lg transition-colors cursor-pointer"
                            title="Cairkan ke Database Pemasukan"
                            id={`cashout-btn-${fin.id}`}
                          >
                            <ArrowUpRight className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => onEditFinance(fin)}
                          className="p-1.5 text-sky-400 hover:bg-neutral-800 rounded-lg transition-colors cursor-pointer"
                          title="Perbarui Saldo Realtime"
                          id={`edit-fin-${fin.id}`}
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setFinanceToDelete({ 
                            id: fin.id, 
                            name: `${plat?.accountName || 'Akun'} - Saldo ${formatCurrency(fin.availableBalance, fin.currency)}` 
                          })}
                          className="p-1.5 text-rose-400 hover:bg-neutral-800 rounded-lg transition-colors cursor-pointer"
                          title="Hapus Catatan Saldo"
                          id={`del-fin-${fin.id}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {/* Empty state */}
              {filteredFinances.length === 0 && (
                <tr>
                  <td colSpan={9} className="py-16 text-center text-neutral-400">
                    <motion.div 
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ duration: 0.3 }}
                      className="max-w-sm mx-auto flex flex-col items-center"
                    >
                      <div className="w-14 h-14 rounded-2xl bg-neutral-900 border border-neutral-800 flex items-center justify-center mb-3 shadow-inner">
                        <Wallet className="w-7 h-7 text-emerald-400" />
                      </div>
                      <p className="font-sans font-bold text-base text-neutral-200">
                        {finances.length === 0 ? 'Belum Ada Saldo Terpantau' : 'Tidak Ada Data Saldo yang Cocok'}
                      </p>
                      <p className="text-xs text-neutral-400 mt-1 max-w-xs leading-relaxed">
                        {finances.length === 0 
                          ? 'Input saldo realtime dari platform seperti AdSense YouTube, Adobe Stock, Shutterstock, dsb.'
                          : 'Coba sesuaikan kata kunci pencarian atau filter status payout.'}
                      </p>
                      <motion.button
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={onAddFinance}
                        className="mt-4 px-4 py-2 bg-gradient-to-r from-emerald-500 to-emerald-400 hover:from-emerald-400 text-neutral-950 rounded-lg text-xs font-sans font-bold flex items-center gap-1.5 shadow-md shadow-emerald-500/20 cursor-pointer"
                      >
                        <Plus className="w-4 h-4 stroke-[3]" />
                        <span>Input Saldo Realtime Pertama</span>
                      </motion.button>
                    </motion.div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Confirmation Modal for Deleting Finance Record */}
      <ConfirmModal
        isOpen={!!financeToDelete}
        onClose={() => setFinanceToDelete(null)}
        onConfirm={() => {
          if (financeToDelete) {
            onDeleteFinance(financeToDelete.id);
          }
        }}
        title="Hapus Catatan Saldo Realtime"
        message="Apakah Anda yakin ingin menghapus catatan saldo realtime ini dari tabel monitoring keuangan?"
        itemName={financeToDelete?.name}
        confirmLabel="Ya, Hapus Saldo"
      />
    </div>
  );
};
