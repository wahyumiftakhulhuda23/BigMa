import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { GmailAccount, PlatformAccount } from '../../types';
import { exportToExcel, exportTableToPdf } from '../../utils/exportUtils';
import { ConfirmModal } from '../ConfirmModal';
import { 
  KeyRound, 
  Plus, 
  Search, 
  FileSpreadsheet, 
  FileText, 
  Copy, 
  Check, 
  Eye, 
  EyeOff, 
  Edit3, 
  Trash2, 
  ExternalLink,
  Layers,
  ShieldCheck,
  Phone,
  Mail,
  Sparkles,
  Link as LinkIcon
} from 'lucide-react';

interface GmailTableProps {
  gmails: GmailAccount[];
  platformAccounts: PlatformAccount[];
  onAddGmail: () => void;
  onEditGmail: (gmail: GmailAccount) => void;
  onDeleteGmail: (id: string) => void;
  onManagePlatformForGmail: (gmailId: string) => void;
}

export const GmailTable: React.FC<GmailTableProps> = ({
  gmails,
  platformAccounts,
  onAddGmail,
  onEditGmail,
  onDeleteGmail,
  onManagePlatformForGmail,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({});
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [gmailToDelete, setGmailToDelete] = useState<{ id: string; email: string } | null>(null);

  // Toggle password visibility per item
  const toggleVisibility = (key: string) => {
    setVisiblePasswords(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // Copy helper with feedback
  const handleCopy = (text: string, keyId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(keyId);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Filter gmails
  const filteredGmails = gmails.filter(g => {
    const term = searchTerm.toLowerCase();
    const matchesBasic = g.email.toLowerCase().includes(term) ||
      g.recoveryEmail.toLowerCase().includes(term) ||
      g.connectedAccountsNote.toLowerCase().includes(term) ||
      (g.notes && g.notes.toLowerCase().includes(term));
    
    // Check if linked platform matches
    const linked = platformAccounts.filter(p => p.gmailId === g.id);
    const matchesLinked = linked.some(p => 
      p.platform.toLowerCase().includes(term) || 
      p.accountName.toLowerCase().includes(term)
    );

    return matchesBasic || matchesLinked;
  });

  // Export handlers
  const handleExportExcel = () => {
    const rows = filteredGmails.map((g, idx) => {
      const linked = platformAccounts.filter(p => p.gmailId === g.id);
      const linkedSummary = linked.map(l => `${l.platform} (${l.accountName})`).join('; ');
      return {
        No: idx + 1,
        Email: g.email,
        Password: g.password,
        'Kode 2FA': g.code2FA,
        'Email Pemulihan': g.recoveryEmail,
        'Password Email Pemulihan': g.recoveryPassword,
        'No HP Pemulihan': g.phoneRecovery || '-',
        'Terkoneksi Akun Penting': g.connectedAccountsNote || '-',
        'Total Akun Terhubung': linked.length,
        'Daftar Platform Terhubung': linkedSummary || 'Belum ada',
        Catatan: g.notes || '-',
      };
    });
    exportToExcel(rows, `Database_Master_Gmail_BigMA_${new Date().toISOString().split('T')[0]}`, 'Database Gmail');
  };

  const handleExportPdf = () => {
    const headers = ['No', 'Email Gmail', 'Kode 2FA', 'Email Pemulihan', 'Akun Penting / Lanjutan', 'Platform & Akun Terpakai'];
    const rows = filteredGmails.map((g, idx) => {
      const linked = platformAccounts.filter(p => p.gmailId === g.id);
      const linkedSummary = linked.length > 0 
        ? linked.map(l => `${l.platform}: ${l.accountName}`).join(', ')
        : 'Belum terhubung';
      return [
        idx + 1,
        g.email,
        g.code2FA || '-',
        g.recoveryEmail || '-',
        g.connectedAccountsNote || '-',
        linkedSummary,
      ];
    });

    exportTableToPdf({
      title: 'Database Master Akun Gmail - BigMA',
      subtitle: 'Data Kunci Induk Operasional Multi-Platform (Kredensial & Pemulihan)',
      filename: `Database_Master_Gmail_BigMA_${new Date().toISOString().split('T')[0]}`,
      headers,
      rows,
      orientation: 'landscape',
    });
  };

  return (
    <div className="space-y-6" id="gmail-table-root">
      {/* Header Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-2xl font-sans font-extrabold text-white tracking-tight">Database Gmail (Data Kunci)</h2>
            <span className="px-2 py-0.5 rounded text-[10px] font-sans font-bold uppercase tracking-wider bg-amber-500/15 text-amber-300 border border-amber-500/30">
              Master Key
            </span>
          </div>
          <p className="text-xs text-neutral-400 mt-1 max-w-2xl">
            Pusat data kunci induk operasional. Seluruh platform, channel, microstock, dan akun keuangan ditautkan ke akun Gmail di tabel ini.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {gmails.length > 0 && (
            <>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleExportExcel}
                className="px-3 py-2 bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-neutral-300 hover:text-white rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                id="export-excel-gmail-btn"
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
                id="export-pdf-gmail-btn"
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
            onClick={onAddGmail}
            className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-neutral-950 rounded-lg text-xs font-sans font-bold flex items-center gap-1.5 transition-all shadow-md shadow-amber-500/20 cursor-pointer"
            id="add-gmail-btn"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Tambah Master Gmail</span>
          </motion.button>
        </div>
      </div>

      {/* Summary Stat Cards with Motion */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        <motion.div 
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="p-4 bg-neutral-900/80 border border-[#262626] rounded-xl shadow-xs hover:border-neutral-700 transition-colors"
        >
          <div className="text-[10px] uppercase tracking-wider font-sans font-bold text-neutral-400">Total Akun Master Gmail</div>
          <div className="text-2xl font-mono font-bold text-white mt-1">{gmails.length}</div>
          <div className="text-[11px] text-amber-400 mt-1 flex items-center gap-1">
            <KeyRound className="w-3 h-3 text-amber-500" /> Basis operasional
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="p-4 bg-neutral-900/80 border border-[#262626] rounded-xl shadow-xs hover:border-neutral-700 transition-colors"
        >
          <div className="text-[10px] uppercase tracking-wider font-sans font-bold text-neutral-400">Akun Platform Terhubung</div>
          <div className="text-2xl font-mono font-bold text-sky-400 mt-1">{platformAccounts.length}</div>
          <div className="text-[11px] text-neutral-400 mt-1">
            {gmails.length > 0 ? `Rata-rata ${(platformAccounts.length / gmails.length).toFixed(1)} akun per Gmail` : 'Belum ada platform'}
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="p-4 bg-neutral-900/80 border border-[#262626] rounded-xl shadow-xs hover:border-neutral-700 transition-colors"
        >
          <div className="text-[10px] uppercase tracking-wider font-sans font-bold text-neutral-400">Proteksi 2FA Aktif</div>
          <div className="text-2xl font-mono font-bold text-emerald-400 mt-1">
            {gmails.filter(g => g.code2FA).length} / {gmails.length}
          </div>
          <div className="text-[11px] text-emerald-400 mt-1 flex items-center gap-1">
            <ShieldCheck className="w-3 h-3 text-emerald-500" /> Terproteksi kunci cadangan
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="p-4 bg-neutral-900/80 border border-[#262626] rounded-xl shadow-xs hover:border-neutral-700 transition-colors"
        >
          <div className="text-[10px] uppercase tracking-wider font-sans font-bold text-neutral-400">Email Pemulihan Siap</div>
          <div className="text-2xl font-mono font-bold text-purple-400 mt-1">
            {gmails.filter(g => g.recoveryEmail).length} / {gmails.length}
          </div>
          <div className="text-[11px] text-purple-400 mt-1">
            Terkoneksi jalur darurat
          </div>
        </motion.div>
      </div>

      {/* Main Table Container */}
      <div className="bg-neutral-900/70 border border-[#262626] rounded-xl overflow-hidden shadow-xl">
        {/* Search & Filter Bar */}
        <div className="p-3.5 bg-neutral-950/80 border-b border-[#262626] flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari email, password, pemulihan..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-neutral-900 border border-[#333] focus:border-amber-500 text-xs rounded-lg pl-9 pr-3 py-1.5 text-neutral-200 placeholder-neutral-500 outline-none transition-colors"
              id="search-gmail-input"
            />
          </div>
          <div className="text-xs text-neutral-400 font-mono">
            Menampilkan <span className="text-amber-400 font-bold">{filteredGmails.length}</span> dari {gmails.length} Akun Master
          </div>
        </div>

        {/* Responsive Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse" id="gmail-master-table">
            <thead>
              <tr className="border-b border-[#262626] bg-neutral-950/50 text-[11px] font-sans font-bold text-neutral-400 uppercase tracking-wider">
                <th className="py-3 px-3.5 w-12 text-center">No</th>
                <th className="py-3 px-3.5 min-w-[200px]">Email Gmail</th>
                <th className="py-3 px-3.5 min-w-[170px]">Password Master</th>
                <th className="py-3 px-3.5 min-w-[170px]">Kode 2FA / Backup</th>
                <th className="py-3 px-3.5 min-w-[190px]">Email Pemulihan &amp; Sandi</th>
                <th className="py-3 px-3.5 min-w-[190px]">Kolom Lanjutan (Akun Penting)</th>
                <th className="py-3 px-3.5 min-w-[200px]">Platform &amp; Akun Terhubung</th>
                <th className="py-3 px-3.5 w-28 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#262626]/70">
              {filteredGmails.map((gmail, index) => {
                const linkedAccounts = platformAccounts.filter(p => p.gmailId === gmail.id);
                
                // Group linked by platform name
                const groupedPlatforms = linkedAccounts.reduce((acc, curr) => {
                  acc[curr.platform] = acc[curr.platform] || [];
                  acc[curr.platform].push(curr);
                  return acc;
                }, {} as Record<string, PlatformAccount[]>);

                const isPwVisible = visiblePasswords[`pw-${gmail.id}`];
                const isRecPwVisible = visiblePasswords[`rec-pw-${gmail.id}`];

                return (
                  <tr key={gmail.id} className="hover:bg-neutral-900/60 transition-colors" id={`row-gmail-${gmail.id}`}>
                    {/* No */}
                    <td className="py-3 px-3.5 text-center font-mono text-neutral-500">
                      {index + 1}
                    </td>

                    {/* Email Gmail */}
                    <td className="py-3 px-3.5">
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-semibold text-neutral-100 select-all">{gmail.email}</span>
                        <button
                          onClick={() => handleCopy(gmail.email, `email-${gmail.id}`)}
                          className="p-1 rounded text-neutral-500 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
                          title="Salin Email"
                        >
                          {copiedKey === `email-${gmail.id}` ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                      {gmail.notes && (
                        <p className="text-[10px] text-neutral-400 mt-0.5 line-clamp-1">{gmail.notes}</p>
                      )}
                    </td>

                    {/* Password */}
                    <td className="py-3 px-3.5">
                      <div className="flex items-center justify-between gap-1.5 bg-neutral-900 px-2 py-1 rounded-md border border-[#262626]">
                        <span className="font-mono text-neutral-300 select-all text-[11px] truncate max-w-[110px]">
                          {isPwVisible ? gmail.password : '••••••••••••'}
                        </span>
                        <div className="flex items-center gap-0.5">
                          <button
                            onClick={() => toggleVisibility(`pw-${gmail.id}`)}
                            className="p-1 text-neutral-500 hover:text-white transition-colors cursor-pointer"
                            title={isPwVisible ? 'Sembunyikan' : 'Tampilkan'}
                          >
                            {isPwVisible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                          <button
                            onClick={() => handleCopy(gmail.password, `pw-${gmail.id}`)}
                            className="p-1 text-neutral-500 hover:text-white transition-colors cursor-pointer"
                            title="Salin Password"
                          >
                            {copiedKey === `pw-${gmail.id}` ? (
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </div>
                    </td>

                    {/* Kode 2FA */}
                    <td className="py-3 px-3.5">
                      {gmail.code2FA ? (
                        <div className="flex items-center justify-between gap-1.5 bg-amber-500/10 border border-amber-500/30 px-2 py-1 rounded-md">
                          <span className="font-mono text-[11px] text-amber-300 select-all truncate max-w-[110px]" title={gmail.code2FA}>
                            {gmail.code2FA}
                          </span>
                          <button
                            onClick={() => handleCopy(gmail.code2FA, `2fa-${gmail.id}`)}
                            className="p-1 text-amber-400 hover:text-amber-300 transition-colors cursor-pointer"
                            title="Salin Kode 2FA"
                          >
                            {copiedKey === `2fa-${gmail.id}` ? (
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      ) : (
                        <span className="text-neutral-500 italic text-[11px]">Belum diatur</span>
                      )}
                    </td>

                    {/* Email Pemulihan & Sandi */}
                    <td className="py-3 px-3.5 space-y-1">
                      {gmail.recoveryEmail ? (
                        <div>
                          <div className="flex items-center justify-between gap-1 text-[11px]">
                            <span className="font-medium text-neutral-300 truncate select-all">{gmail.recoveryEmail}</span>
                            <button
                              onClick={() => handleCopy(gmail.recoveryEmail, `rec-${gmail.id}`)}
                              className="p-0.5 text-neutral-500 hover:text-white transition-colors cursor-pointer"
                              title="Salin Email Pemulihan"
                            >
                              {copiedKey === `rec-${gmail.id}` ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                            </button>
                          </div>
                          {gmail.recoveryPassword && (
                            <div className="flex items-center justify-between gap-1 text-[10px] text-neutral-400 bg-neutral-900 border border-[#262626] px-1.5 py-0.5 rounded mt-0.5">
                              <span className="font-mono">Sandi: {isRecPwVisible ? gmail.recoveryPassword : '••••••'}</span>
                              <button
                                onClick={() => toggleVisibility(`rec-pw-${gmail.id}`)}
                                className="p-0.5 text-neutral-500 hover:text-white transition-colors cursor-pointer"
                              >
                                {isRecPwVisible ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                              </button>
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-neutral-500 italic text-[11px]">Tidak ada</span>
                      )}
                      {gmail.phoneRecovery && (
                        <div className="text-[10px] text-neutral-400 flex items-center gap-1 font-mono">
                          <Phone className="w-3 h-3 text-neutral-500" />
                          <span>{gmail.phoneRecovery}</span>
                        </div>
                      )}
                    </td>

                    {/* Kolom Lanjutan Akun Penting */}
                    <td className="py-3 px-3.5">
                      {gmail.connectedAccountsNote ? (
                        <div className="text-[11px] text-neutral-300 bg-neutral-900/70 p-2 rounded-md border border-[#262626] line-clamp-3">
                          {gmail.connectedAccountsNote}
                        </div>
                      ) : (
                        <span className="text-neutral-500 italic text-[11px]">Belum ada catatan</span>
                      )}
                    </td>

                    {/* Platform & Akun Terpakai */}
                    <td className="py-3 px-3.5">
                      {linkedAccounts.length > 0 ? (
                        <div className="space-y-1.5">
                          <div className="flex flex-wrap gap-1">
                            {(Object.entries(groupedPlatforms) as [string, PlatformAccount[]][]).map(([platform, accounts]) => (
                              <span
                                key={platform}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-neutral-800 text-neutral-200 border border-neutral-700"
                              >
                                <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
                                <span>{platform}</span>
                                <span className="text-sky-300 font-mono font-bold">({accounts.length})</span>
                              </span>
                            ))}
                          </div>
                          <div className="text-[10px] text-neutral-400 flex items-center gap-1">
                            <Layers className="w-3 h-3 text-neutral-500" />
                            <span>Total {linkedAccounts.length} Akun aktif</span>
                            <button
                              onClick={() => onManagePlatformForGmail(gmail.id)}
                              className="ml-auto text-sky-400 hover:text-sky-300 text-[10px] font-semibold underline transition-colors cursor-pointer"
                            >
                              Lihat Akun &rarr;
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-neutral-500 text-[11px]">
                          <span>Belum ada platform</span>
                          <button
                            onClick={() => onManagePlatformForGmail(gmail.id)}
                            className="text-[10px] font-semibold text-amber-400 hover:text-amber-300 underline transition-colors cursor-pointer"
                          >
                            + Kaitkan
                          </button>
                        </div>
                      )}
                    </td>

                    {/* Aksi */}
                    <td className="py-3 px-3.5 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => onManagePlatformForGmail(gmail.id)}
                          className="p-1.5 text-sky-400 hover:bg-neutral-800 rounded-lg transition-colors cursor-pointer"
                          title="Tambah / Kelola Akun Platform untuk Gmail ini"
                          id={`add-plat-for-${gmail.id}`}
                        >
                          <Layers className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onEditGmail(gmail)}
                          className="p-1.5 text-amber-400 hover:bg-neutral-800 rounded-lg transition-colors cursor-pointer"
                          title="Edit Data Kunci Gmail"
                          id={`edit-gmail-${gmail.id}`}
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setGmailToDelete({ id: gmail.id, email: gmail.email })}
                          className="p-1.5 text-rose-400 hover:bg-neutral-800 rounded-lg transition-colors cursor-pointer"
                          title="Hapus Akun Gmail"
                          id={`delete-gmail-${gmail.id}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {/* Empty state when searching has no result or zero data */}
              {filteredGmails.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-16 text-center text-neutral-400">
                    <motion.div 
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ duration: 0.3 }}
                      className="max-w-sm mx-auto flex flex-col items-center"
                    >
                      <div className="w-14 h-14 rounded-2xl bg-neutral-900 border border-neutral-800 flex items-center justify-center mb-3 shadow-inner">
                        <Mail className="w-7 h-7 text-amber-500" />
                      </div>
                      <p className="font-sans font-bold text-base text-neutral-200">
                        {gmails.length === 0 ? 'Belum Ada Akun Gmail Master' : 'Tidak Ada Data yang Cocok'}
                      </p>
                      <p className="text-xs text-neutral-400 mt-1 max-w-xs leading-relaxed">
                        {gmails.length === 0 
                          ? 'Mulai dengan menambahkan akun Gmail master pertama Anda. Seluruh platform & channel nanti dapat dikaitkan ke sini.'
                          : 'Coba sesuaikan kata kunci pencarian Anda.'}
                      </p>
                      {gmails.length === 0 && (
                        <motion.button
                          whileHover={{ scale: 1.03 }}
                          whileTap={{ scale: 0.97 }}
                          onClick={onAddGmail}
                          className="mt-4 px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 text-neutral-950 rounded-lg text-xs font-sans font-bold flex items-center gap-1.5 shadow-md shadow-amber-500/20 cursor-pointer"
                        >
                          <Plus className="w-4 h-4 stroke-[3]" />
                          <span>Tambah Akun Gmail Pertama</span>
                        </motion.button>
                      )}
                    </motion.div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Confirmation Modal for Deleting Gmail Record */}
      <ConfirmModal
        isOpen={!!gmailToDelete}
        onClose={() => setGmailToDelete(null)}
        onConfirm={() => {
          if (gmailToDelete) {
            onDeleteGmail(gmailToDelete.id);
          }
        }}
        title="Hapus Akun Gmail Master"
        message="Apakah Anda yakin ingin menghapus akun Gmail ini? Pastikan data platform atau akun terkait sudah dipindahkan bila diperlukan."
        itemName={gmailToDelete?.email}
        confirmLabel="Ya, Hapus Gmail"
      />
    </div>
  );
};
