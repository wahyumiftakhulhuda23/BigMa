import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { PlatformAccount, GmailAccount } from '../../types';
import { X, Save, Layers, Mail, Shield, Check } from 'lucide-react';

interface PlatformAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (account: PlatformAccount) => void;
  gmails: GmailAccount[];
  initialData?: PlatformAccount | null;
  preselectedGmailId?: string;
  preselectedPlatform?: string;
}

export const STANDARD_PLATFORMS = [
  'YouTube',
  'Adobe Stock',
  'Shutterstock',
  'Vecteezy',
  'Freepik',
  'Lynk.id',
  'Lainnya',
];

export const PlatformAccountModal: React.FC<PlatformAccountModalProps> = ({
  isOpen,
  onClose,
  onSave,
  gmails,
  initialData,
  preselectedGmailId,
  preselectedPlatform,
}) => {
  const [gmailId, setGmailId] = useState('');
  const [platform, setPlatform] = useState('YouTube');
  const [customPlatformName, setCustomPlatformName] = useState('');
  const [accountName, setAccountName] = useState('');
  const [usernameOrHandle, setUsernameOrHandle] = useState('');
  const [platformPassword, setPlatformPassword] = useState('');
  const [customCredentials, setCustomCredentials] = useState('');
  const [channelOrProfileUrl, setChannelOrProfileUrl] = useState('');
  const [status, setStatus] = useState<'Aktif' | 'Review' | 'Suspended' | 'Nonaktif'>('Aktif');
  const [niche, setNiche] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (initialData) {
      setGmailId(initialData.gmailId);
      setPlatform(initialData.platform);
      setCustomPlatformName(initialData.customPlatformName || '');
      setAccountName(initialData.accountName);
      setUsernameOrHandle(initialData.usernameOrHandle);
      setPlatformPassword(initialData.platformPassword || '');
      setCustomCredentials(initialData.customCredentials || '');
      setChannelOrProfileUrl(initialData.channelOrProfileUrl || '');
      setStatus(initialData.status);
      setNiche(initialData.niche || '');
      setNotes(initialData.notes || '');
    } else {
      setGmailId(preselectedGmailId || (gmails.length > 0 ? gmails[0].id : ''));
      const defaultPlat = (typeof preselectedPlatform === 'string' && preselectedPlatform) 
        ? preselectedPlatform 
        : 'YouTube';
      setPlatform(defaultPlat);
      setCustomPlatformName('');
      setAccountName('');
      setUsernameOrHandle('');
      setPlatformPassword('');
      setCustomCredentials('');
      setChannelOrProfileUrl('');
      setStatus('Aktif');
      setNiche('');
      setNotes('');
    }
  }, [initialData, preselectedGmailId, preselectedPlatform, gmails, isOpen]);

  const handleSelectPlatform = (selected: string) => {
    setPlatform(selected);
    if (selected !== 'Lainnya') {
      setCustomPlatformName('');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!accountName.trim() || !gmailId) return;

    const todayStr = new Date().toISOString().split('T')[0];
    const finalPlatform = platform === 'Lainnya' && customPlatformName.trim() 
      ? customPlatformName.trim() 
      : platform;

    const newOrUpdated: PlatformAccount = {
      id: initialData ? initialData.id : `pa-${Date.now()}`,
      gmailId,
      platform: finalPlatform,
      customPlatformName: platform === 'Lainnya' ? customPlatformName.trim() : undefined,
      accountName: accountName.trim(),
      usernameOrHandle: usernameOrHandle.trim(),
      platformPassword: platformPassword.trim(),
      customCredentials: customCredentials.trim(),
      channelOrProfileUrl: channelOrProfileUrl.trim(),
      status,
      niche: niche.trim(),
      notes: notes.trim(),
      createdAt: initialData ? initialData.createdAt : todayStr,
    };

    onSave(newOrUpdated);
    onClose();
  };

  const selectedGmail = gmails.find(g => g.id === gmailId);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              onClose();
            }
          }}
          id="platform-modal-overlay"
        >
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
            className="bg-neutral-900 rounded-xl max-w-2xl w-full shadow-2xl border border-[#262626] overflow-hidden flex flex-col text-[#E5E5E5]"
            id="platform-modal-container"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-4 bg-neutral-950 border-b border-[#262626] text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-amber-500/10 text-amber-400 rounded-lg border border-amber-500/20">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-sans font-bold text-base tracking-tight text-neutral-100">
                    {initialData ? 'Edit Data Akun Platform' : 'Tambah Akun Platform Baru'}
                  </h3>
                  <p className="text-xs text-neutral-400">
                    Katalog channel, microstock portofolio &amp; landing bio BigMA
                  </p>
                </div>
              </div>
              <button 
                type="button"
                onClick={onClose} 
                className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
                id="close-platform-modal-btn"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto max-h-[80vh]">
              {/* Parent Gmail Account Selection */}
              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1">
                  Gmail Induk Pengait <span className="text-rose-400">*</span>
                </label>
                {gmails.length === 0 ? (
                  <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg text-xs text-amber-300">
                    Belum ada database Gmail. Silakan tambahkan akun Gmail terlebih dahulu pada tab "Database Gmail".
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <select
                      value={gmailId}
                      onChange={(e) => setGmailId(e.target.value)}
                      required
                      className="w-full px-3 py-2 text-xs bg-neutral-950 text-neutral-100 border border-[#262626] rounded-lg focus:outline-hidden focus:border-amber-500/60 font-mono"
                      id="platform-select-gmail"
                    >
                      {gmails.map(g => (
                        <option key={g.id} value={g.id}>
                          {g.email}
                        </option>
                      ))}
                    </select>
                    {selectedGmail && (
                      <div className="p-2.5 bg-neutral-950/60 border border-[#262626] rounded-lg text-[11px] text-neutral-400 flex items-center justify-between">
                        <span className="flex items-center gap-1.5 text-neutral-300">
                          <Mail className="w-3.5 h-3.5 text-amber-400" />
                          <span>Recovery: {selectedGmail.recoveryEmail || 'Tidak ada'}</span>
                        </span>
                        <span className="font-mono text-neutral-500">2FA: {selectedGmail.code2FA ? 'Tersedia' : 'Non-aktif'}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Platform Selector */}
              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                  Pilih Platform Microstock / Media <span className="text-rose-400">*</span>
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {STANDARD_PLATFORMS.map(p => {
                    const isSelected = platform === p || (p === 'Lainnya' && !STANDARD_PLATFORMS.slice(0, 6).includes(platform));
                    return (
                      <button
                        type="button"
                        key={p}
                        onClick={() => handleSelectPlatform(p)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors flex items-center gap-1 cursor-pointer ${
                          isSelected
                            ? 'bg-amber-400 text-neutral-950 border-amber-400 font-sans font-bold shadow-xs'
                            : 'bg-neutral-950 text-neutral-300 border-[#262626] hover:bg-neutral-800'
                        }`}
                      >
                        {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                        <span>{p}</span>
                      </button>
                    );
                  })}
                </div>

                {platform === 'Lainnya' && (
                  <div className="mt-2.5">
                    <input
                      type="text"
                      required
                      value={customPlatformName}
                      onChange={(e) => setCustomPlatformName(e.target.value)}
                      placeholder="Masukkan nama platform kustom (cth: Pond5, Canva Contributor, Creative Market)..."
                      className="w-full px-3 py-2 text-xs bg-neutral-950 text-neutral-100 placeholder:text-neutral-600 border border-[#262626] rounded-lg focus:outline-hidden focus:border-amber-500/60"
                      id="custom-platform-input"
                    />
                  </div>
                )}
              </div>

              {/* Account Display Name & Handle */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1">
                    Nama Akun / Portofolio / Channel <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={accountName}
                    onChange={(e) => setAccountName(e.target.value)}
                    placeholder="misal: Wahyu Visuals / Huda Studio..."
                    className="w-full px-3 py-2 text-xs bg-neutral-950 text-neutral-100 placeholder:text-neutral-600 border border-[#262626] rounded-lg focus:outline-hidden focus:border-amber-500/60 transition-colors"
                    id="platform-input-account-name"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1">
                    Username / ID / Handle Platform
                  </label>
                  <input
                    type="text"
                    value={usernameOrHandle}
                    onChange={(e) => setUsernameOrHandle(e.target.value)}
                    placeholder="@wahyu_vector atau ID Kontributor..."
                    className="w-full px-3 py-2 text-xs bg-neutral-950 text-neutral-100 placeholder:text-neutral-600 border border-[#262626] rounded-lg font-mono focus:outline-hidden focus:border-amber-500/60 transition-colors"
                    id="platform-input-username"
                  />
                </div>
              </div>

              {/* Specific Password & Custom Key */}
              <div className="p-3.5 bg-neutral-950 border border-[#262626] rounded-lg space-y-3">
                <div className="text-xs font-semibold text-neutral-200 flex items-center gap-1.5">
                  <Shield className="w-4 h-4 text-amber-400" />
                  <span>Kredensial Khusus Platform (Jika Berbeda dari Password Gmail)</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-medium text-neutral-400 mb-1">
                      Password Khusus Platform
                    </label>
                    <input
                      type="text"
                      value={platformPassword}
                      onChange={(e) => setPlatformPassword(e.target.value)}
                      placeholder="Kosongkan jika sama dengan Gmail"
                      className="w-full px-3 py-2 text-xs bg-neutral-900 text-neutral-200 placeholder:text-neutral-600 border border-[#333] rounded-lg font-mono focus:outline-hidden focus:border-amber-500/60"
                      id="platform-input-password"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-neutral-400 mb-1">
                      Kredensial Kustom / PIN / API Key / Token
                    </label>
                    <input
                      type="text"
                      value={customCredentials}
                      onChange={(e) => setCustomCredentials(e.target.value)}
                      placeholder="Contoh: PIN 6-digit, Token API, atau Kontributor ID"
                      className="w-full px-3 py-2 text-xs bg-neutral-900 text-neutral-200 placeholder:text-neutral-600 border border-[#333] rounded-lg font-mono focus:outline-hidden focus:border-amber-500/60"
                      id="platform-input-custom-creds"
                    />
                  </div>
                </div>
              </div>

              {/* Channel / Profile Link & Niche */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1">
                    URL Channel / Profil Portofolio
                  </label>
                  <input
                    type="url"
                    value={channelOrProfileUrl}
                    onChange={(e) => setChannelOrProfileUrl(e.target.value)}
                    placeholder="https://stock.adobe.com/contributor/..."
                    className="w-full px-3 py-2 text-xs bg-neutral-950 text-neutral-100 placeholder:text-neutral-600 border border-[#262626] rounded-lg focus:outline-hidden focus:border-amber-500/60 font-mono transition-colors"
                    id="platform-input-url"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1">
                    Niche / Kategori Aset Konten
                  </label>
                  <input
                    type="text"
                    value={niche}
                    onChange={(e) => setNiche(e.target.value)}
                    placeholder="misal: AI Illustration, Vector Icons, Tech Tutorial..."
                    className="w-full px-3 py-2 text-xs bg-neutral-950 text-neutral-100 placeholder:text-neutral-600 border border-[#262626] rounded-lg focus:outline-hidden focus:border-amber-500/60 transition-colors"
                    id="platform-input-niche"
                  />
                </div>
              </div>

              {/* Status & Notes */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1">
                    Status Akun <span className="text-rose-400">*</span>
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs bg-neutral-950 text-neutral-100 border border-[#262626] rounded-lg focus:outline-hidden focus:border-amber-500/60 font-medium"
                    id="platform-select-status"
                  >
                    <option value="Aktif">Aktif (Operasional)</option>
                    <option value="Review">Dalam Review Platform</option>
                    <option value="Suspended">Suspended / Bermasalah</option>
                    <option value="Nonaktif">Nonaktif / Ditinggalkan</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-neutral-300 mb-1">
                    Catatan Khusus Akun
                  </label>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Pajak W-8BEN approved, target batch 500 asset, dll..."
                    className="w-full px-3 py-2 text-xs bg-neutral-950 text-neutral-100 placeholder:text-neutral-600 border border-[#262626] rounded-lg focus:outline-hidden focus:border-amber-500/60 transition-colors"
                    id="platform-input-notes"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-[#262626] flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-medium text-neutral-300 bg-neutral-800 hover:bg-neutral-700 rounded-lg transition-colors cursor-pointer"
                  id="cancel-platform-btn"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={gmails.length === 0}
                  className="px-5 py-2 text-xs font-sans font-bold text-neutral-950 bg-amber-400 hover:bg-amber-300 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
                  id="save-platform-btn"
                >
                  <Save className="w-4 h-4 stroke-[2.5]" />
                  <span>Simpan Akun Platform</span>
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
