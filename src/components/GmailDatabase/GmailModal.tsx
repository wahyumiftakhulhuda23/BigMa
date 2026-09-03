import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { GmailAccount } from '../../types';
import { X, Save, KeyRound, Mail, ShieldAlert, Phone, HelpCircle } from 'lucide-react';

interface GmailModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (gmail: GmailAccount) => void;
  initialData?: GmailAccount | null;
}

export const GmailModal: React.FC<GmailModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code2FA, setCode2FA] = useState('');
  const [recoveryEmail, setRecoveryEmail] = useState('');
  const [recoveryPassword, setRecoveryPassword] = useState('');
  const [phoneRecovery, setPhoneRecovery] = useState('');
  const [connectedAccountsNote, setConnectedAccountsNote] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (initialData) {
      setEmail(initialData.email);
      setPassword(initialData.password);
      setCode2FA(initialData.code2FA);
      setRecoveryEmail(initialData.recoveryEmail);
      setRecoveryPassword(initialData.recoveryPassword);
      setPhoneRecovery(initialData.phoneRecovery || '');
      setConnectedAccountsNote(initialData.connectedAccountsNote || '');
      setNotes(initialData.notes || '');
    } else {
      setEmail('');
      setPassword('');
      setCode2FA('');
      setRecoveryEmail('');
      setRecoveryPassword('');
      setPhoneRecovery('');
      setConnectedAccountsNote('');
      setNotes('');
    }
  }, [initialData, isOpen]);

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    const todayStr = new Date().toISOString().split('T')[0];
    const newOrUpdated: GmailAccount = {
      id: initialData ? initialData.id : `gm-${Date.now()}`,
      email: email.trim(),
      password: password.trim(),
      code2FA: code2FA.trim(),
      recoveryEmail: recoveryEmail.trim(),
      recoveryPassword: recoveryPassword.trim(),
      phoneRecovery: phoneRecovery.trim(),
      connectedAccountsNote: connectedAccountsNote.trim(),
      notes: notes.trim(),
      createdAt: initialData ? initialData.createdAt : todayStr,
      updatedAt: todayStr,
    };

    onSave(newOrUpdated);
    onClose();
  };

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
          id="gmail-modal-overlay"
        >
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
            className="bg-neutral-900 rounded-xl max-w-2xl w-full shadow-2xl border border-[#262626] overflow-hidden flex flex-col text-[#E5E5E5]"
            id="gmail-modal-container"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-4 bg-neutral-950 border-b border-[#262626] text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-amber-500/10 text-amber-400 rounded-lg border border-amber-500/20">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-sans font-bold text-base tracking-tight text-neutral-100">
                    {initialData ? 'Edit Data Kunci Gmail Master' : 'Tambah Database Master Gmail Baru'}
                  </h3>
                  <p className="text-xs text-neutral-400">
                    Pondasi data kunci operasional BigMA
                  </p>
                </div>
              </div>
              <button 
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onClose();
                }} 
                className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
                id="close-gmail-modal-btn"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto max-h-[80vh]">
              {/* Email Address */}
              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1">
                  Alamat Email Gmail <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="misal: wahyuhuda2000@gmail.com"
                    className="w-full px-3 py-2 text-sm bg-neutral-950 text-neutral-100 placeholder:text-neutral-600 border border-[#262626] rounded-lg focus:outline-hidden focus:border-amber-500/60 font-mono transition-colors"
                    id="gmail-input-email"
                  />
                </div>
                <p className="text-[11px] text-neutral-500 mt-1">
                  Email ini akan menjadi pilihan basis operasional di menu Kelola Akun Platform.
                </p>
              </div>

              {/* Password & 2FA */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1">
                    Password Gmail <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Kata sandi akun..."
                    className="w-full px-3 py-2 text-sm bg-neutral-950 text-neutral-100 placeholder:text-neutral-600 border border-[#262626] rounded-lg font-mono focus:outline-hidden focus:border-amber-500/60 transition-colors"
                    id="gmail-input-password"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1">
                    Kode 2FA / Backup Key
                  </label>
                  <input
                    type="text"
                    value={code2FA}
                    onChange={(e) => setCode2FA(e.target.value)}
                    placeholder="Contoh: JBSWY3DP... atau Kode Cadangan"
                    className="w-full px-3 py-2 text-sm bg-neutral-950 text-neutral-100 placeholder:text-neutral-600 border border-[#262626] rounded-lg font-mono focus:outline-hidden focus:border-amber-500/60 transition-colors"
                    id="gmail-input-2fa"
                  />
                </div>
              </div>

              {/* Recovery Email & Password */}
              <div className="p-3.5 bg-neutral-950 border border-[#262626] rounded-lg space-y-3">
                <div className="text-xs font-semibold text-neutral-200 flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4 text-amber-400" />
                  <span>Data Pemulihan Akun (Recovery)</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-medium text-neutral-400 mb-1">
                      Email Pemulihan
                    </label>
                    <input
                      type="email"
                      value={recoveryEmail}
                      onChange={(e) => setRecoveryEmail(e.target.value)}
                      placeholder="recovery.backup@gmail.com"
                      className="w-full px-3 py-2 text-xs bg-neutral-900 text-neutral-200 placeholder:text-neutral-600 border border-[#333] rounded-lg focus:outline-hidden focus:border-amber-500/60 font-mono"
                      id="gmail-input-recovery-email"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-neutral-400 mb-1">
                      Password Email Pemulihan
                    </label>
                    <input
                      type="text"
                      value={recoveryPassword}
                      onChange={(e) => setRecoveryPassword(e.target.value)}
                      placeholder="Password email pemulihan..."
                      className="w-full px-3 py-2 text-xs bg-neutral-900 text-neutral-200 placeholder:text-neutral-600 border border-[#333] rounded-lg font-mono focus:outline-hidden focus:border-amber-500/60"
                      id="gmail-input-recovery-password"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-neutral-400 mb-1">
                    Nomor HP Pemulihan (Opsional)
                  </label>
                  <input
                    type="text"
                    value={phoneRecovery}
                    onChange={(e) => setPhoneRecovery(e.target.value)}
                    placeholder="+62 812-xxxx-xxxx"
                    className="w-full px-3 py-2 text-xs bg-neutral-900 text-neutral-200 placeholder:text-neutral-600 border border-[#333] rounded-lg font-mono focus:outline-hidden focus:border-amber-500/60"
                    id="gmail-input-phone"
                  />
                </div>
              </div>

              {/* Kolom Lanjutan Akun Penting Lainnya */}
              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1">
                  Kolom Lanjutan: Terkoneksi dengan Akun Penting Lainnya
                </label>
                <textarea
                  rows={2}
                  value={connectedAccountsNote}
                  onChange={(e) => setConnectedAccountsNote(e.target.value)}
                  placeholder="Contoh: Terkoneksi dengan AdSense ID: pub-84291823, Google Cloud, Payoneer Akun Utama, Play Console..."
                  className="w-full px-3 py-2 text-xs bg-neutral-950 text-neutral-100 placeholder:text-neutral-600 border border-[#262626] rounded-lg focus:outline-hidden focus:border-amber-500/60 transition-colors"
                  id="gmail-input-connected-notes"
                />
                <p className="text-[11px] text-neutral-500 mt-1">
                  Catat layanan Google, financial tools, atau izin kritis yang ditautkan ke akun ini.
                </p>
              </div>

              {/* General Notes */}
              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1">
                  Catatan Internal BigMA
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Catatan peran, penanggung jawab, atau peruntukan khusus..."
                  className="w-full px-3 py-2 text-xs bg-neutral-950 text-neutral-100 placeholder:text-neutral-600 border border-[#262626] rounded-lg focus:outline-hidden focus:border-amber-500/60 transition-colors"
                  id="gmail-input-notes"
                />
              </div>

              {/* Action buttons */}
              <div className="pt-4 border-t border-[#262626] flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-medium text-neutral-300 bg-neutral-800 hover:bg-neutral-700 rounded-lg transition-colors cursor-pointer"
                  id="cancel-gmail-btn"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-sans font-bold text-neutral-950 bg-amber-400 hover:bg-amber-300 rounded-lg flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
                  id="save-gmail-btn"
                >
                  <Save className="w-4 h-4 stroke-[2.5]" />
                  <span>Simpan Database Gmail</span>
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
