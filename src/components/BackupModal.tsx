import React, { useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AppData, AppSettings } from '../types';
import { downloadJsonBackup, resetToDefaultData } from '../utils/storage';
import { exportFullStudioWorkbook } from '../utils/exportUtils';
import { ConfirmModal } from './ConfirmModal';
import { X, Download, Upload, RefreshCw, FileSpreadsheet, DollarSign, Check, AlertCircle, Cloud, Globe, CloudCheck } from 'lucide-react';

interface BackupModalProps {
  isOpen: boolean;
  onClose: () => void;
  appData: AppData;
  onUpdateData?: (newData: AppData) => void;
  onRestoreData?: (newData: AppData) => void;
  onSaveSettings?: (newSettings: AppSettings) => void;
  userEmail?: string | null;
  onSyncCloud?: () => Promise<boolean>;
  isSyncing?: boolean;
  lastSyncTime?: Date | null;
}

export const BackupModal: React.FC<BackupModalProps> = ({
  isOpen,
  onClose,
  appData,
  onUpdateData,
  onRestoreData,
  onSaveSettings,
  userEmail,
  onSyncCloud,
  isSyncing = false,
  lastSyncTime,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [rateUsd, setRateUsd] = useState(appData.settings.usdToIdrRate?.toString() || '16250');
  const [rateEur, setRateEur] = useState(appData.settings.eurToIdrRate?.toString() || '17400');
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);

  // Sync inputs whenever modal is opened or settings change
  useEffect(() => {
    if (isOpen) {
      setRateUsd(appData.settings.usdToIdrRate?.toString() || '16250');
      setRateEur(appData.settings.eurToIdrRate?.toString() || '17400');
    }
  }, [isOpen, appData.settings.usdToIdrRate, appData.settings.eurToIdrRate]);

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

  const handleSaveRates = (e: React.FormEvent) => {
    e.preventDefault();
    const usd = parseFloat(rateUsd) || 16250;
    const eur = parseFloat(rateEur) || 17400;
    
    const newSettings: AppSettings = {
      ...appData.settings,
      usdToIdrRate: usd,
      eurToIdrRate: eur,
    };

    if (onSaveSettings) {
      onSaveSettings(newSettings);
    }
    if (onUpdateData) {
      const updated: AppData = {
        ...appData,
        settings: newSettings,
      };
      onUpdateData(updated);
    }

    setStatusMessage({ type: 'success', text: 'Pengaturan kurs valuta USD & EUR berhasil disimpan!' });
    setTimeout(() => setStatusMessage(null), 3000);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (!parsed.gmails || !parsed.platformAccounts) {
          throw new Error('Format berkas backup JSON tidak valid');
        }
        
        // Ensure notes array exists
        if (!parsed.notes) {
          parsed.notes = [];
        }

        if (onRestoreData) {
          onRestoreData(parsed);
        } else if (onUpdateData) {
          onUpdateData(parsed);
        }

        setStatusMessage({ type: 'success', text: 'Data BigMA berhasil dipulihkan dari file backup!' });
        setTimeout(() => {
          setStatusMessage(null);
          onClose();
        }, 1500);
      } catch (err: any) {
        setStatusMessage({ type: 'error', text: `Gagal import: ${err.message || 'Format JSON salah'}` });
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleConfirmResetData = () => {
    const def = resetToDefaultData();
    if (onRestoreData) {
      onRestoreData(def);
    } else if (onUpdateData) {
      onUpdateData(def);
    }
    setStatusMessage({ type: 'success', text: 'Data telah direset ke format kosong awal BigMA.' });
    setTimeout(() => {
      setStatusMessage(null);
      onClose();
    }, 1200);
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
          id="backup-modal-overlay"
        >
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
            className="bg-neutral-900 rounded-xl max-w-lg w-full shadow-2xl border border-[#262626] overflow-hidden flex flex-col text-[#E5E5E5]" 
            id="backup-modal-container"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-4 bg-neutral-950 border-b border-[#262626] text-white flex items-center justify-between">
              <div>
                <h3 className="font-sans font-bold text-base tracking-tight text-neutral-100">Pusat Ekspor, Backup &amp; Pengaturan</h3>
                <p className="text-xs text-neutral-400">BigMA Account Manajement</p>
              </div>
              <button 
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  onClose();
                }} 
                className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer" 
                id="close-backup-modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-5 space-y-5 overflow-y-auto max-h-[75vh]">
              {statusMessage && (
                <div className={`p-3 rounded-lg text-xs flex items-center gap-2 ${
                  statusMessage.type === 'success' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                }`}>
                  {statusMessage.type === 'success' ? <Check className="w-4 h-4 text-emerald-400 shrink-0" /> : <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />}
                  <span>{statusMessage.text}</span>
                </div>
              )}

              {/* Cloud Firestore Multi-Device Sync */}
              <div className="p-4 bg-neutral-950 border border-[#262626] rounded-xl space-y-2.5">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-sans font-bold text-sm text-neutral-200 flex items-center gap-1.5">
                      <Cloud className="w-4 h-4 text-sky-400" />
                      Sinkronisasi Cloud Multi-Device
                    </h4>
                    <p className="text-xs text-neutral-400 mt-0.5">
                      Tersimpan aman di akun cloud Anda ({userEmail || 'Terhubung'}). Buka aplikasi ini di device, laptop atau smartphone mana pun untuk mengakses data yang sama secara otomatis.
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <div className="text-[11px] text-neutral-500 flex items-center gap-1.5 font-mono">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span>Sinkron Otomatis: Aktif</span>
                  </div>

                  {onSyncCloud && (
                    <button
                      type="button"
                      disabled={isSyncing}
                      onClick={async () => {
                        const ok = await onSyncCloud();
                        if (ok) {
                          setStatusMessage({ type: 'success', text: 'Data berhasil disinkronkan ke Cloud Firestore!' });
                          setTimeout(() => setStatusMessage(null), 3000);
                        } else {
                          setStatusMessage({ type: 'error', text: 'Gagal sinkronisasi ke cloud. Coba periksa koneksi internet.' });
                        }
                      }}
                      className="px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-sky-400 hover:text-sky-300 border border-sky-500/30 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                      <span>{isSyncing ? 'Menyinkronkan...' : 'Sinkronkan Sekarang'}</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Master Excel Export */}
              <div className="p-4 bg-neutral-950 border border-[#262626] rounded-xl">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-sans font-bold text-sm text-neutral-200 flex items-center gap-1.5">
                      <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                      Unduh Semua Data (Master Excel .XLSX)
                    </h4>
                    <p className="text-xs text-neutral-400 mt-1">
                      Mencakup seluruh sheet: Database Gmail, Kelola Akun, Catatan, Keuangan Realtime, Pemasukan, dan Kalender Deadline.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    exportFullStudioWorkbook(
                      appData.gmails,
                      appData.platformAccounts,
                      appData.realtimeFinances,
                      appData.incomes,
                      appData.deadlines
                    );
                  }}
                  className="mt-3 w-full py-2 px-3 bg-amber-400 hover:bg-amber-300 text-neutral-950 font-sans font-bold text-xs rounded-lg flex items-center justify-center gap-1.5 transition-colors shadow-xs cursor-pointer"
                  id="export-master-excel-btn"
                >
                  <Download className="w-4 h-4 stroke-[2.5]" />
                  Ekspor Buku Kerja Excel Komplit (.xlsx)
                </button>
              </div>

              {/* Backup & Restore JSON */}
              <div className="space-y-3">
                <h4 className="text-[11px] font-sans font-bold text-neutral-400 uppercase tracking-wider">Cadangan Data Aplikasi (JSON)</h4>
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    onClick={() => downloadJsonBackup(appData)}
                    className="p-3 border border-[#262626] hover:border-neutral-700 bg-neutral-950 hover:bg-neutral-800/60 rounded-xl text-left transition-colors flex flex-col justify-between cursor-pointer"
                    id="download-backup-json-btn"
                  >
                    <div className="p-2 bg-neutral-900 rounded-lg w-fit border border-[#262626] text-neutral-300 mb-2">
                      <Download className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-sans font-bold text-xs text-neutral-200">Download Backup</div>
                      <div className="text-[11px] text-neutral-400">Simpan berkas JSON ke komputer</div>
                    </div>
                  </button>

                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="p-3 border border-[#262626] hover:border-neutral-700 bg-neutral-950 hover:bg-neutral-800/60 rounded-xl text-left transition-colors flex flex-col justify-between cursor-pointer"
                    id="restore-backup-json-btn"
                  >
                    <div className="p-2 bg-neutral-900 rounded-lg w-fit border border-[#262626] text-neutral-300 mb-2">
                      <Upload className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-sans font-bold text-xs text-neutral-200">Pulihkan / Restore</div>
                      <div className="text-[11px] text-neutral-400">Pilih berkas JSON cadangan</div>
                    </div>
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".json"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </div>
              </div>

              {/* Currency Rates Settings */}
              <form onSubmit={handleSaveRates} className="p-4 bg-neutral-950 border border-[#262626] rounded-xl space-y-3">
                <h4 className="font-sans font-bold text-neutral-200 text-xs flex items-center gap-1.5">
                  <DollarSign className="w-4 h-4 text-amber-400" />
                  Pengaturan Kurs Valuta (Estimasi Konversi ke IDR)
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-medium text-neutral-400">1 USD (US Dollar) =</label>
                    <div className="relative mt-1">
                      <span className="absolute left-2.5 top-2 text-xs text-neutral-500 font-mono">Rp</span>
                      <input
                        type="number"
                        value={rateUsd}
                        onChange={(e) => setRateUsd(e.target.value)}
                        className="w-full pl-8 pr-2.5 py-1.5 text-xs bg-neutral-900 text-neutral-200 border border-[#262626] rounded-lg font-mono focus:outline-hidden focus:border-amber-500/60"
                        placeholder="16250"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-[11px] font-medium text-neutral-400">1 EUR (Euro) =</label>
                    <div className="relative mt-1">
                      <span className="absolute left-2.5 top-2 text-xs text-neutral-500 font-mono">Rp</span>
                      <input
                        type="number"
                        value={rateEur}
                        onChange={(e) => setRateEur(e.target.value)}
                        className="w-full pl-8 pr-2.5 py-1.5 text-xs bg-neutral-900 text-neutral-200 border border-[#262626] rounded-lg font-mono focus:outline-hidden focus:border-amber-500/60"
                        placeholder="17400"
                      />
                    </div>
                  </div>
                </div>
                <button
                  type="submit"
                  className="w-full py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-sans font-bold rounded-lg transition-colors border border-[#333] cursor-pointer"
                  id="save-currency-rates-btn"
                >
                  Simpan Kurs Mata Uang
                </button>
              </form>

              {/* Reset to starter data */}
              <div className="pt-2 border-t border-[#262626] flex items-center justify-between">
                <span className="text-xs text-neutral-400">Ingin membersihkan semua data?</span>
                <button
                  type="button"
                  onClick={() => setIsResetConfirmOpen(true)}
                  className="text-xs font-medium text-rose-400 hover:text-rose-300 flex items-center gap-1 py-1 px-2.5 rounded-lg hover:bg-rose-500/10 transition-colors cursor-pointer"
                  id="reset-starter-data-btn"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Reset ke Kosong
                </button>
              </div>
            </div>
          </motion.div>

          {/* Confirmation Modal for Resetting All Studio Data */}
          <ConfirmModal
            isOpen={isResetConfirmOpen}
            onClose={() => setIsResetConfirmOpen(false)}
            onConfirm={handleConfirmResetData}
            title="Reset Data BigMA"
            message="Apakah Anda yakin ingin mengosongkan seluruh database BigMA? Pastikan Anda sudah mengekspor backup JSON jika memiliki data yang ingin disimpan."
            confirmLabel="Ya, Kosongkan Data"
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
};
