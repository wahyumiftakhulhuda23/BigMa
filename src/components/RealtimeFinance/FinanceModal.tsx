import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { RealtimeFinance, PlatformAccount, GmailAccount, AppSettings } from '../../types';
import { X, Save, Wallet, DollarSign, CreditCard, ArrowRight } from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';

interface FinanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (record: RealtimeFinance) => void;
  platformAccounts: PlatformAccount[];
  gmails: GmailAccount[];
  settings: AppSettings;
  initialData?: RealtimeFinance | null;
  preselectedPlatformAccountId?: string;
}

const COMMON_PAYMENT_METHODS = [
  'Payoneer',
  'Paypal',
  'Wire Transfer / Bank Mandiri',
  'Wire Transfer / Bank BCA',
  'Wise',
  'Lainnya',
];

export const FinanceModal: React.FC<FinanceModalProps> = ({
  isOpen,
  onClose,
  onSave,
  platformAccounts,
  gmails,
  settings,
  initialData,
  preselectedPlatformAccountId,
}) => {
  const [platformAccountId, setPlatformAccountId] = useState('');
  const [availableBalance, setAvailableBalance] = useState('');
  const [pendingEarnings, setPendingEarnings] = useState('');
  const [currency, setCurrency] = useState<'USD' | 'IDR' | 'EUR'>('USD');
  const [payoutThreshold, setPayoutThreshold] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Payoneer');
  const [accountHolder, setAccountHolder] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (initialData) {
      setPlatformAccountId(initialData.platformAccountId);
      setAvailableBalance(initialData.availableBalance.toString());
      setPendingEarnings(initialData.pendingEarnings.toString());
      setCurrency(initialData.currency);
      setPayoutThreshold(initialData.payoutThreshold.toString());
      setPaymentMethod(initialData.paymentMethod);
      setAccountHolder(initialData.accountHolder || '');
      setNotes(initialData.notes || '');
    } else {
      const defaultPlatId = preselectedPlatformAccountId || (platformAccounts.length > 0 ? platformAccounts[0].id : '');
      setPlatformAccountId(defaultPlatId);
      setAvailableBalance('0');
      setPendingEarnings('0');
      setCurrency('USD');
      setPayoutThreshold('50');
      setPaymentMethod('Payoneer');
      setAccountHolder('');
      setNotes('');
    }
  }, [initialData, preselectedPlatformAccountId, platformAccounts, isOpen]);

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
    if (!platformAccountId) return;

    const todayStr = new Date().toISOString().split('T')[0];
    const newOrUpdated: RealtimeFinance = {
      id: initialData ? initialData.id : `rf-${Date.now()}`,
      platformAccountId,
      availableBalance: parseFloat(availableBalance) || 0,
      pendingEarnings: parseFloat(pendingEarnings) || 0,
      currency,
      payoutThreshold: parseFloat(payoutThreshold) || 0,
      paymentMethod,
      accountHolder: accountHolder.trim(),
      lastUpdated: todayStr,
      notes: notes.trim(),
    };

    onSave(newOrUpdated);
    onClose();
  };

  const selectedPlat = platformAccounts.find(p => p.id === platformAccountId);
  const selectedParentGmail = selectedPlat ? gmails.find(g => g.id === selectedPlat.gmailId) : null;

  // Realtime conversion preview
  const numAvailable = parseFloat(availableBalance) || 0;
  const numPending = parseFloat(pendingEarnings) || 0;
  const rate = currency === 'USD' ? settings.usdToIdrRate : currency === 'EUR' ? settings.eurToIdrRate : 1;
  const estTotalIdr = (numAvailable + numPending) * rate;

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
          id="finance-modal-overlay"
        >
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
            className="bg-neutral-900 rounded-xl max-w-2xl w-full shadow-2xl border border-[#262626] overflow-hidden flex flex-col text-[#E5E5E5]"
            id="finance-modal-container"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-4 bg-neutral-950 border-b border-[#262626] text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-amber-500/10 text-amber-400 rounded-lg border border-amber-500/20">
                  <Wallet className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-sans font-bold text-base tracking-tight text-neutral-100">
                    {initialData ? 'Update Saldo Keuangan Akun' : 'Catat Pantauan Saldo Akun Baru'}
                  </h3>
                  <p className="text-xs text-neutral-400">
                    Monitoring saldo berjalan, pending review, dan threshold penarikan BigMA
                  </p>
                </div>
              </div>
              <button 
                type="button"
                onClick={onClose} 
                className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
                id="close-finance-modal-btn"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto max-h-[80vh]">
              {/* Linked Platform Account */}
              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1">
                  Pilih Akun Platform Terkait <span className="text-rose-400">*</span>
                </label>
                {platformAccounts.length === 0 ? (
                  <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg text-xs text-amber-300">
                    Belum ada akun platform yang terdaftar. Tambahkan akun platform terlebih dahulu pada tab "Kelola Akun".
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <select
                      value={platformAccountId}
                      onChange={(e) => setPlatformAccountId(e.target.value)}
                      required
                      className="w-full px-3 py-2 text-xs bg-neutral-950 text-neutral-100 border border-[#262626] rounded-lg focus:outline-hidden focus:border-amber-500/60 font-medium"
                      id="finance-select-platform-account"
                    >
                      {platformAccounts.map(p => (
                        <option key={p.id} value={p.id}>
                          {p.platform}: {p.accountName} ({p.usernameOrHandle || 'No handle'})
                        </option>
                      ))}
                    </select>
                    {selectedPlat && (
                      <div className="p-2.5 bg-neutral-950/60 border border-[#262626] rounded-lg text-[11px] text-neutral-400 flex items-center justify-between">
                        <span>Platform: <strong className="text-neutral-200">{selectedPlat.platform}</strong></span>
                        <span>Gmail: <strong className="text-neutral-200 font-mono">{selectedParentGmail?.email || '-'}</strong></span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Currency & Threshold */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1">
                    Mata Uang Akun <span className="text-rose-400">*</span>
                  </label>
                  <div className="flex gap-2">
                    {(['USD', 'IDR', 'EUR'] as const).map(c => (
                      <button
                        type="button"
                        key={c}
                        onClick={() => setCurrency(c)}
                        className={`flex-1 py-1.5 text-xs rounded-lg border font-mono font-bold transition-colors cursor-pointer ${
                          currency === c
                            ? 'bg-amber-400 text-neutral-950 border-amber-400 shadow-xs'
                            : 'bg-neutral-950 text-neutral-400 border-[#262626] hover:bg-neutral-800'
                        }`}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1">
                    Batas Minimal Penarikan (Payout Threshold)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-xs text-neutral-500 font-mono">{currency}</span>
                    <input
                      type="number"
                      step="any"
                      min="0"
                      value={payoutThreshold}
                      onChange={(e) => setPayoutThreshold(e.target.value)}
                      placeholder="50"
                      className="w-full pl-12 pr-3 py-1.5 text-xs bg-neutral-950 text-neutral-100 placeholder:text-neutral-600 border border-[#262626] rounded-lg font-mono focus:outline-hidden focus:border-amber-500/60"
                      id="finance-input-threshold"
                    />
                  </div>
                </div>
              </div>

              {/* Saldo Siap Tarik & Pending Earnings */}
              <div className="p-4 bg-neutral-950 border border-[#262626] rounded-xl space-y-3">
                <div className="text-xs font-semibold text-neutral-200 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <DollarSign className="w-4 h-4 text-emerald-400" />
                    <span>Rincian Saldo Finansial Saat Ini</span>
                  </span>
                  <span className="text-[11px] text-neutral-500 font-mono">
                    Kurs: 1 {currency} = Rp {rate.toLocaleString('id-ID')}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-medium text-neutral-400 mb-1">
                      Saldo Siap Tarik (Available Balance) <span className="text-rose-400">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-2.5 top-2 text-xs text-neutral-500 font-mono">{currency}</span>
                      <input
                        type="number"
                        step="any"
                        min="0"
                        required
                        value={availableBalance}
                        onChange={(e) => setAvailableBalance(e.target.value)}
                        placeholder="0.00"
                        className="w-full pl-12 pr-3 py-1.5 text-xs bg-neutral-900 text-neutral-100 border border-[#333] rounded-lg font-mono focus:outline-hidden focus:border-amber-500/60"
                        id="finance-input-available-balance"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-neutral-400 mb-1">
                      Estimasi Pending (In Review / Unpaid)
                    </label>
                    <div className="relative">
                      <span className="absolute left-2.5 top-2 text-xs text-neutral-500 font-mono">{currency}</span>
                      <input
                        type="number"
                        step="any"
                        min="0"
                        value={pendingEarnings}
                        onChange={(e) => setPendingEarnings(e.target.value)}
                        placeholder="0.00"
                        className="w-full pl-12 pr-3 py-1.5 text-xs bg-neutral-900 text-neutral-100 border border-[#333] rounded-lg font-mono focus:outline-hidden focus:border-amber-500/60"
                        id="finance-input-pending-earnings"
                      />
                    </div>
                  </div>
                </div>

                {/* Live Realtime Estimate Preview */}
                <div className="p-2.5 bg-neutral-900/90 rounded-lg border border-[#333] flex items-center justify-between text-xs">
                  <span className="text-neutral-400 font-medium">Estimasi Total Aset Bersih (IDR):</span>
                  <span className="font-mono font-bold text-amber-400">
                    {formatCurrency(estTotalIdr, 'IDR')}
                  </span>
                </div>
              </div>

              {/* Payment Method & Beneficiary */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1">
                    Metode Pembayaran / Wallet
                  </label>
                  <input
                    type="text"
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    placeholder="Payoneer, Paypal, Bank Mandiri..."
                    className="w-full px-3 py-2 text-xs bg-neutral-950 text-neutral-100 placeholder:text-neutral-600 border border-[#262626] rounded-lg focus:outline-hidden focus:border-amber-500/60 font-medium"
                    id="finance-input-payment-method"
                    list="common-methods"
                  />
                  <datalist id="common-methods">
                    {COMMON_PAYMENT_METHODS.map(m => (
                      <option key={m} value={m} />
                    ))}
                  </datalist>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1">
                    Nama Pemilik Rekening / Email Wallet
                  </label>
                  <input
                    type="text"
                    value={accountHolder}
                    onChange={(e) => setAccountHolder(e.target.value)}
                    placeholder="misal: wahyu.payoneer@gmail.com / Wahyu Huda"
                    className="w-full px-3 py-2 text-xs bg-neutral-950 text-neutral-100 placeholder:text-neutral-600 border border-[#262626] rounded-lg focus:outline-hidden focus:border-amber-500/60 font-mono transition-colors"
                    id="finance-input-account-holder"
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1">
                  Catatan Finansial Akun
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Jadwal payout otomatis tanggal 15 setiap bulan, potong fee $3..."
                  className="w-full px-3 py-2 text-xs bg-neutral-950 text-neutral-100 placeholder:text-neutral-600 border border-[#262626] rounded-lg focus:outline-hidden focus:border-amber-500/60 transition-colors"
                  id="finance-input-notes"
                />
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-[#262626] flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-medium text-neutral-300 bg-neutral-800 hover:bg-neutral-700 rounded-lg transition-colors cursor-pointer"
                  id="cancel-finance-btn"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={platformAccounts.length === 0}
                  className="px-5 py-2 text-xs font-sans font-bold text-neutral-950 bg-amber-400 hover:bg-amber-300 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
                  id="save-finance-btn"
                >
                  <Save className="w-4 h-4 stroke-[2.5]" />
                  <span>Simpan Catatan Saldo</span>
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
