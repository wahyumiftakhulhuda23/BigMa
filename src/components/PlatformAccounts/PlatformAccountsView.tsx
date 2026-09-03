import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { PlatformAccount, GmailAccount } from '../../types';
import { exportToExcel, exportTableToPdf } from '../../utils/exportUtils';
import { ConfirmModal } from '../ConfirmModal';
import { 
  Layers, 
  Plus, 
  Search, 
  FileSpreadsheet, 
  FileText, 
  ExternalLink, 
  Copy, 
  Check, 
  Eye, 
  EyeOff, 
  Edit3, 
  Trash2, 
  Mail, 
  Wallet, 
  PlusCircle, 
  Youtube, 
  Palette, 
  Image as ImageIcon, 
  FolderArchive,
  DollarSign,
  Sparkles,
  Link as LinkIcon
} from 'lucide-react';

interface PlatformAccountsViewProps {
  platformAccounts: PlatformAccount[];
  gmails: GmailAccount[];
  onAddAccount: (preselectedPlatform?: string) => void;
  onEditAccount: (account: PlatformAccount) => void;
  onDeleteAccount: (id: string) => void;
  onQuickUpdateFinance: (platformAccountId: string) => void;
  onQuickAddIncome: (platformAccountId: string) => void;
}

export const PlatformAccountsView: React.FC<PlatformAccountsViewProps> = ({
  platformAccounts,
  gmails,
  onAddAccount,
  onEditAccount,
  onDeleteAccount,
  onQuickUpdateFinance,
  onQuickAddIncome,
}) => {
  const [selectedSubMenu, setSelectedSubMenu] = useState<string>('All');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({});
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [accountToDelete, setAccountToDelete] = useState<{ id: string; name: string } | null>(null);

  // Standard platforms: YouTube, Adobe Stock, Shutterstock, Vecteezy, Freepik, Lynk.id, Lainnya
  const defaultSubMenus: string[] = ['All', 'YouTube', 'Adobe Stock', 'Shutterstock', 'Vecteezy', 'Freepik', 'Lynk.id', 'Lainnya'];
  const subMenuTabs: string[] = [...defaultSubMenus];
  platformAccounts.forEach(p => {
    const platName = p.platform as string;
    if (!subMenuTabs.includes(platName)) {
      subMenuTabs.push(platName);
    }
  });

  const togglePassword = (id: string) => {
    setVisiblePasswords(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(id);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Filter accounts
  const filteredAccounts = platformAccounts.filter(p => {
    // Sub-menu platform filter
    if (selectedSubMenu !== 'All') {
      if (selectedSubMenu === 'Lainnya') {
        const standard6 = ['YouTube', 'Adobe Stock', 'Shutterstock', 'Vecteezy', 'Freepik', 'Lynk.id'];
        if (standard6.includes(p.platform) && p.platform !== 'Lainnya') {
          return false;
        }
      } else if (p.platform !== selectedSubMenu) {
        return false;
      }
    }

    // Search query filter
    const term = searchTerm.toLowerCase();
    const gmail = gmails.find(g => g.id === p.gmailId);
    const matchesTerm = 
      p.accountName.toLowerCase().includes(term) ||
      p.usernameOrHandle.toLowerCase().includes(term) ||
      p.platform.toLowerCase().includes(term) ||
      (p.customPlatformName && p.customPlatformName.toLowerCase().includes(term)) ||
      (p.niche && p.niche.toLowerCase().includes(term)) ||
      (p.customCredentials && p.customCredentials.toLowerCase().includes(term)) ||
      (gmail && gmail.email.toLowerCase().includes(term));

    return matchesTerm;
  });

  // Get icon and color badge per platform
  const getPlatformBadge = (platform: string) => {
    switch (platform) {
      case 'YouTube':
        return {
          icon: <Youtube className="w-3.5 h-3.5 text-red-400" />,
          bg: 'bg-red-500/10 text-red-300 border-red-500/30',
        };
      case 'Adobe Stock':
        return {
          icon: <Palette className="w-3.5 h-3.5 text-amber-400" />,
          bg: 'bg-amber-500/10 text-amber-300 border-amber-500/30',
        };
      case 'Shutterstock':
        return {
          icon: <ImageIcon className="w-3.5 h-3.5 text-rose-400" />,
          bg: 'bg-rose-500/10 text-rose-300 border-rose-500/30',
        };
      case 'Vecteezy':
        return {
          icon: <FolderArchive className="w-3.5 h-3.5 text-emerald-400" />,
          bg: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30',
        };
      case 'Freepik':
        return {
          icon: <Palette className="w-3.5 h-3.5 text-sky-400" />,
          bg: 'bg-sky-500/10 text-sky-300 border-sky-500/30',
        };
      case 'Lynk.id':
        return {
          icon: <DollarSign className="w-3.5 h-3.5 text-purple-400" />,
          bg: 'bg-purple-500/10 text-purple-300 border-purple-500/30',
        };
      default:
        return {
          icon: <Layers className="w-3.5 h-3.5 text-neutral-400" />,
          bg: 'bg-neutral-800 text-neutral-300 border-neutral-700',
        };
    }
  };

  // Export handlers
  const handleExportExcel = () => {
    const rows = filteredAccounts.map((acc, idx) => {
      const gmail = gmails.find(g => g.id === acc.gmailId);
      return {
        No: idx + 1,
        Platform: acc.platform === 'Lainnya' && acc.customPlatformName ? acc.customPlatformName : acc.platform,
        'Nama Akun / Channel': acc.accountName,
        'Gmail Basis': gmail ? gmail.email : 'Tidak terhubung',
        Username: acc.usernameOrHandle || '-',
        Password: acc.platformPassword || '-',
        'Kredensial Khusus': acc.customCredentials || '-',
        'URL Profil/Channel': acc.channelOrProfileUrl || '-',
        Niche: acc.niche || '-',
        Status: acc.status,
        Catatan: acc.notes || '-',
      };
    });
    exportToExcel(rows, `Akun_Platform_BigMA_${new Date().toISOString().split('T')[0]}`, 'Akun Platform');
  };

  const handleExportPdf = () => {
    const headers = ['No', 'Platform', 'Nama Akun / Channel', 'Gmail Basis', 'Username / ID', 'Status', 'Niche'];
    const rows = filteredAccounts.map((acc, idx) => {
      const gmail = gmails.find(g => g.id === acc.gmailId);
      return [
        idx + 1,
        acc.platform === 'Lainnya' && acc.customPlatformName ? acc.customPlatformName : acc.platform,
        acc.accountName,
        gmail ? gmail.email : 'Gmail Terhapus',
        acc.usernameOrHandle || '-',
        acc.status,
        acc.niche || '-',
      ];
    });

    exportTableToPdf({
      title: 'Database Akun Platform - BigMA',
      subtitle: `Koleksi Akun Multi-Platform (Filter: ${selectedSubMenu})`,
      filename: `Akun_Platform_BigMA_${new Date().toISOString().split('T')[0]}`,
      headers,
      rows,
      orientation: 'landscape',
    });
  };

  return (
    <div className="space-y-6" id="platform-accounts-root">
      {/* Header & Main Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-2xl font-sans font-extrabold text-white tracking-tight">Kelola Akun Platform</h2>
            <span className="px-2 py-0.5 rounded text-[10px] font-sans font-bold uppercase tracking-wider bg-sky-500/15 text-sky-300 border border-sky-500/30">
              Multi-Platform
            </span>
          </div>
          <p className="text-xs text-neutral-400 mt-1 max-w-2xl">
            Pusat kelola seluruh channel YouTube, akun microstock (Adobe Stock, Shutterstock, Vecteezy, Freepik), Lynk.id, serta platform kustom lainnya.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {platformAccounts.length > 0 && (
            <>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleExportExcel}
                className="px-3 py-2 bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-neutral-300 hover:text-white rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                id="export-excel-platform-btn"
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
                id="export-pdf-platform-btn"
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
            onClick={() => onAddAccount(selectedSubMenu !== 'All' && selectedSubMenu !== 'Lainnya' ? selectedSubMenu : undefined)}
            className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-neutral-950 rounded-lg text-xs font-sans font-bold flex items-center gap-1.5 transition-all shadow-md shadow-amber-500/20 cursor-pointer"
            id="add-platform-btn"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Tambah Akun {selectedSubMenu !== 'All' ? selectedSubMenu : 'Platform'}</span>
          </motion.button>
        </div>
      </div>

      {/* Sub-menu Navigation Tabs with Animated Indicator */}
      <div className="bg-neutral-900/80 p-1.5 rounded-xl border border-[#262626] shadow-sm overflow-x-auto scrollbar-none flex items-center gap-1">
        {subMenuTabs.map((tabName) => {
          const isSelected = selectedSubMenu === tabName;
          const count = tabName === 'All' 
            ? platformAccounts.length 
            : tabName === 'Lainnya'
            ? platformAccounts.filter(p => p.platform === 'Lainnya' || !['YouTube', 'Adobe Stock', 'Shutterstock', 'Vecteezy', 'Freepik', 'Lynk.id'].includes(p.platform)).length
            : platformAccounts.filter(p => p.platform === tabName).length;

          return (
            <button
              key={tabName}
              onClick={() => setSelectedSubMenu(tabName)}
              className={`relative px-3.5 py-1.5 rounded-lg text-xs font-sans font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-2 ${
                isSelected
                  ? 'text-neutral-950'
                  : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/50'
              }`}
              id={`subtab-${tabName.toLowerCase().replace(/\s+/g, '-')}`}
            >
              {isSelected && (
                <motion.div
                  layoutId="platformSubMenuPill"
                  className="absolute inset-0 bg-amber-400 rounded-lg shadow-sm"
                  transition={{ type: 'spring', stiffness: 450, damping: 35 }}
                />
              )}
              <span className="relative z-10 flex items-center gap-1.5">
                <span>{tabName}</span>
                <span className={`px-1.5 py-0.2 rounded text-[10px] font-mono ${
                  isSelected ? 'bg-neutral-900/30 text-neutral-950 font-bold' : 'bg-neutral-800 text-neutral-400'
                }`}>
                  {count}
                </span>
              </span>
            </button>
          );
        })}
      </div>

      {/* Search Filter Bar */}
      <div className="bg-neutral-900/70 p-2.5 rounded-xl border border-[#262626] shadow-xs flex items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-neutral-500" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={`Cari di ${selectedSubMenu === 'All' ? 'semua akun' : selectedSubMenu} (nama channel, Gmail, username, kredensial, niche)...`}
            className="w-full pl-9 pr-4 py-1.5 text-xs bg-neutral-950 text-neutral-200 placeholder:text-neutral-600 border border-[#262626] rounded-lg focus:outline-hidden focus:border-amber-500/60 transition-colors"
            id="search-platform-input"
          />
        </div>
        {searchTerm && (
          <button
            onClick={() => setSearchTerm('')}
            className="text-xs text-neutral-400 hover:text-white font-medium px-2 py-1 transition-colors cursor-pointer"
          >
            Reset
          </button>
        )}
      </div>

      {/* Detailed Table */}
      <div className="bg-neutral-900/70 border border-[#262626] rounded-xl shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse" id="table-platform-accounts">
            <thead>
              <tr className="bg-neutral-950/80 text-neutral-400 uppercase tracking-wider text-[10px] font-sans font-bold border-b border-[#262626]">
                <th className="py-3 px-3.5 w-12 text-center">No</th>
                <th className="py-3 px-3.5 min-w-[130px]">Platform</th>
                <th className="py-3 px-3.5 min-w-[200px]">Nama Akun / Channel</th>
                <th className="py-3 px-3.5 min-w-[180px]">Gmail Basis Operasional</th>
                <th className="py-3 px-3.5 min-w-[160px]">Username &amp; URL</th>
                <th className="py-3 px-3.5 min-w-[220px]">Kredensial Khusus &amp; Password</th>
                <th className="py-3 px-3.5 min-w-[180px]">Niche &amp; Catatan</th>
                <th className="py-3 px-3.5 w-24 text-center">Status</th>
                <th className="py-3 px-3.5 w-28 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#262626]/70">
              {filteredAccounts.map((account, index) => {
                const gmail = gmails.find(g => g.id === account.gmailId);
                const badge = getPlatformBadge(account.platform);
                const isPwVisible = visiblePasswords[`pw-${account.id}`];

                return (
                  <tr key={account.id} className="hover:bg-neutral-900/60 transition-colors" id={`row-platform-${account.id}`}>
                    {/* No */}
                    <td className="py-3 px-3.5 text-center font-mono text-neutral-500">
                      {index + 1}
                    </td>

                    {/* Platform */}
                    <td className="py-3 px-3.5">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-semibold border ${badge.bg}`}>
                        {badge.icon}
                        <span>{account.platform === 'Lainnya' && account.customPlatformName ? account.customPlatformName : account.platform}</span>
                      </span>
                    </td>

                    {/* Nama Akun / Channel */}
                    <td className="py-3 px-3.5">
                      <div className="font-semibold text-neutral-100 text-sm">{account.accountName}</div>
                      {account.channelOrProfileUrl && (
                        <a
                          href={account.channelOrProfileUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] text-amber-400 hover:text-amber-300 hover:underline mt-0.5 transition-colors"
                        >
                          <ExternalLink className="w-3 h-3" />
                          <span>Buka Channel / Profil</span>
                        </a>
                      )}
                    </td>

                    {/* Gmail Basis Operasional */}
                    <td className="py-3 px-3.5">
                      {gmail ? (
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1 font-medium text-neutral-200 text-[11px]">
                            <Mail className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                            <span className="truncate select-all">{gmail.email}</span>
                          </div>
                          <span className="text-[10px] text-neutral-500 block truncate">
                            {gmail.notes || 'Master Gmail Terhubung'}
                          </span>
                        </div>
                      ) : (
                        <span className="text-rose-400 font-medium text-xs">Gmail Terhapus</span>
                      )}
                    </td>

                    {/* Username & URL */}
                    <td className="py-3 px-3.5 space-y-1">
                      {account.usernameOrHandle ? (
                        <div className="flex items-center justify-between gap-1 text-neutral-300 bg-neutral-900 px-2 py-0.5 rounded border border-[#262626]">
                          <span className="font-mono text-[11px] select-all truncate">{account.usernameOrHandle}</span>
                          <button
                            onClick={() => handleCopy(account.usernameOrHandle, `user-${account.id}`)}
                            className="p-0.5 text-neutral-500 hover:text-white transition-colors cursor-pointer"
                            title="Salin Username"
                          >
                            {copiedKey === `user-${account.id}` ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                          </button>
                        </div>
                      ) : (
                        <span className="text-neutral-500 italic text-[11px]">-</span>
                      )}
                    </td>

                    {/* Kredensial Khusus */}
                    <td className="py-3 px-3.5 space-y-1">
                      {account.platformPassword && (
                        <div className="flex items-center justify-between gap-1 bg-neutral-900 px-2 py-0.5 rounded border border-[#262626] text-[11px]">
                          <span className="font-mono text-neutral-300">
                            Sandi: {isPwVisible ? account.platformPassword : '••••••••'}
                          </span>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => togglePassword(`pw-${account.id}`)}
                              className="p-0.5 text-neutral-500 hover:text-white transition-colors cursor-pointer"
                            >
                              {isPwVisible ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                            </button>
                            <button
                              onClick={() => handleCopy(account.platformPassword!, `platpw-${account.id}`)}
                              className="p-0.5 text-neutral-500 hover:text-white transition-colors cursor-pointer"
                              title="Salin Password"
                            >
                              {copiedKey === `platpw-${account.id}` ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                            </button>
                          </div>
                        </div>
                      )}

                      {account.customCredentials ? (
                        <div className="p-1.5 bg-neutral-900 rounded border border-[#262626] text-[10px] font-mono text-neutral-300 break-all select-all">
                          {account.customCredentials}
                        </div>
                      ) : (
                        <span className="text-neutral-500 italic text-[11px]">-</span>
                      )}
                    </td>

                    {/* Niche & Catatan */}
                    <td className="py-3 px-3.5 space-y-0.5">
                      {account.niche && (
                        <div className="font-medium text-neutral-200 text-[11px]">{account.niche}</div>
                      )}
                      {account.notes && (
                        <div className="text-neutral-400 text-[10px] line-clamp-2">{account.notes}</div>
                      )}
                      {!account.niche && !account.notes && (
                        <span className="text-neutral-500 italic text-[11px]">-</span>
                      )}
                    </td>

                    {/* Status */}
                    <td className="py-3 px-3.5 text-center">
                      <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-mono font-semibold uppercase tracking-wider ${
                        account.status === 'Aktif'
                          ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-800/50'
                          : account.status === 'Review'
                          ? 'bg-amber-950/40 text-amber-400 border border-amber-800/50'
                          : account.status === 'Suspended'
                          ? 'bg-rose-950/40 text-rose-400 border border-rose-800/50'
                          : 'bg-neutral-900 text-neutral-400 border border-[#262626]'
                      }`}>
                        {account.status}
                      </span>
                    </td>

                    {/* Aksi */}
                    <td className="py-3 px-3.5 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => onQuickUpdateFinance(account.id)}
                          className="p-1.5 text-emerald-400 hover:bg-neutral-800 rounded-lg transition-colors cursor-pointer"
                          title="Input Saldo Realtime Akun Ini"
                          id={`update-fin-${account.id}`}
                        >
                          <Wallet className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onQuickAddIncome(account.id)}
                          className="p-1.5 text-amber-400 hover:bg-neutral-800 rounded-lg transition-colors cursor-pointer"
                          title="Catat Kas Pemasukan Akun Ini"
                          id={`add-inc-${account.id}`}
                        >
                          <PlusCircle className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onEditAccount(account)}
                          className="p-1.5 text-sky-400 hover:bg-neutral-800 rounded-lg transition-colors cursor-pointer"
                          title="Edit Akun Platform"
                          id={`edit-plat-${account.id}`}
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setAccountToDelete({ id: account.id, name: account.accountName })}
                          className="p-1.5 text-rose-400 hover:bg-neutral-800 rounded-lg transition-colors cursor-pointer"
                          title="Hapus Akun Platform"
                          id={`delete-plat-${account.id}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {/* Empty state */}
              {filteredAccounts.length === 0 && (
                <tr>
                  <td colSpan={9} className="py-16 text-center text-neutral-400">
                    <motion.div 
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ duration: 0.3 }}
                      className="max-w-sm mx-auto flex flex-col items-center"
                    >
                      <div className="w-14 h-14 rounded-2xl bg-neutral-900 border border-neutral-800 flex items-center justify-center mb-3 shadow-inner">
                        <Layers className="w-7 h-7 text-sky-400" />
                      </div>
                      <p className="font-sans font-bold text-base text-neutral-200">
                        {platformAccounts.length === 0 ? 'Belum Ada Akun Platform' : `Tidak Ada Akun di Kategori ${selectedSubMenu}`}
                      </p>
                      <p className="text-xs text-neutral-400 mt-1 max-w-xs leading-relaxed">
                        {platformAccounts.length === 0 
                          ? 'Tambahkan channel YouTube, portofolio Adobe Stock, Shutterstock, Freepik, atau akun platform lainnya.'
                          : 'Coba sesuaikan kata kunci pencarian atau pilih tab kategori platform lain.'}
                      </p>
                      <motion.button
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => onAddAccount(selectedSubMenu !== 'All' && selectedSubMenu !== 'Lainnya' ? selectedSubMenu : undefined)}
                        className="mt-4 px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 text-neutral-950 rounded-lg text-xs font-sans font-bold flex items-center gap-1.5 shadow-md shadow-amber-500/20 cursor-pointer"
                      >
                        <Plus className="w-4 h-4 stroke-[3]" />
                        <span>Tambah Akun {selectedSubMenu !== 'All' ? selectedSubMenu : 'Platform'}</span>
                      </motion.button>
                    </motion.div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Confirmation Modal for Deleting Account */}
      <ConfirmModal
        isOpen={!!accountToDelete}
        onClose={() => setAccountToDelete(null)}
        onConfirm={() => {
          if (accountToDelete) {
            onDeleteAccount(accountToDelete.id);
          }
        }}
        title="Hapus Akun Platform"
        message="Apakah Anda yakin ingin menghapus akun platform ini dari database? Akun dan data finansial terkait akan dibersihkan."
        itemName={accountToDelete?.name}
        confirmLabel="Ya, Hapus Akun"
      />
    </div>
  );
};
