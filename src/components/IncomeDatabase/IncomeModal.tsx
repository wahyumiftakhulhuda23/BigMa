import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { IncomeRecord, PlatformAccount, AppSettings } from '../../types';
import { X, Save, TrendingUp, DollarSign, Calendar, Tag, CreditCard } from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';

interface IncomeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (record: IncomeRecord) => void;
  platformAccounts: PlatformAccount[];
  settings: AppSettings;
  initialData?: IncomeRecord | null;
  preselectedPlatformAccountId?: string;
  prefillAmount?: number;
  prefillCurrency?: 'USD' | 'IDR' | 'EUR';
}

const COMMON_SOURCES = [
  'Payoneer',
  'Paypal',
  'Bank Mandiri (Wire Transfer)',
  'Bank BCA (Wire Transfer)',
  'Wise',
  'Jenius',
  'Lainnya',
];

const COMMON_CATEGORIES = [
  'Royalty Microstock',
  'Google AdSense YouTube',
  'Penjualan Lisensi Langsung',
  'Sponsorship / Brand Deal',
  'Freelance Design Client',
  'Lainnya',
];

export const IncomeModal: React.FC<IncomeModalProps> = ({
  isOpen,
  onClose,
  onSave,
  platformAccounts,
  settings,
  initialData,
  preselectedPlatformAccountId,
  prefillAmount,
  prefillCurrency,
}) => {
  const [platformAccountId, setPlatformAccountId] = useState('');
  const [date, setDate] = useState('');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState<'USD' | 'IDR' | 'EUR'>('USD');
  const [exchangeRate, setExchangeRate] = useState(settings.usdToIdrRate.toString());
  const [paymentSource, setPaymentSource] = useState('Payoneer');
  const [category, setCategory] = useState('Royalty Microstock');
  const [referenceNo, setReferenceNo] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (initialData) {
      setPlatformAccountId(initialData.platformAccountId);
      setDate(initialData.date);
      setAmount(initialData.amount.toString());
      setCurrency(initialData.currency);
      setExchangeRate(initialData.exchangeRate.toString());
      setPaymentSource(initialData.paymentSource);
      setCategory(initialData.category);
      setReferenceNo(initialData.referenceNo || '');
      setNotes(initialData.notes || '');
    } else {
      const defaultPlatId = preselectedPlatformAccountId || (platformAccounts.length > 0 ? platformAccounts[0].id : '');
      const defaultCurr = prefillCurrency || 'USD';
      setPlatformAccountId(defaultPlatId);
      setDate(new Date().toISOString().split('T')[0]);
      setAmount(prefillAmount !== undefined ? prefillAmount.toString() : '');
      setCurrency(defaultCurr);
      setExchangeRate(
        defaultCurr === 'USD' ? settings.usdToIdrRate.toString() : defaultCurr === 'EUR' ? settings.eurToIdrRate.toString() : '1'
      );
      setPaymentSource('Payoneer');
      setCategory('Royalty Microstock');
      setReferenceNo('');
      setNotes('');
    }
  }, [initialData, preselectedPlatformAccountId, prefillAmount, prefillCurrency, platformAccounts, settings, isOpen]);

  // Adjust default rate when currency changes
  const handleCurrencyChange = (curr: 'USD' | 'IDR' | 'EUR') => {
    setCurrency(curr);
    if (curr === 'USD') setExchangeRate(settings.usdToIdrRate.toString());
    else if (curr === 'EUR') setExchangeRate(settings.eurToIdrRate.toString());
    else setExchangeRate('1');
  };

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
    if (!platformAccountId || !date || !amount) return;

    const numAmount = parseFloat(amount) || 0;
    const numRate = parseFloat(exchangeRate) || 1;
    const amountIdr = currency === 'IDR' ? numAmount : numAmount * numRate;

    const newOrUpdated: IncomeRecord = {
      id: initialData ? initialData.id : `inc-${Date.now()}`,
      platformAccountId,
      date,
      amount: numAmount,
      currency,
      exchangeRate: numRate,
      amountIdr,
      paymentSource,
      category,
      referenceNo: referenceNo.trim(),
      notes: notes.trim(),
      createdAt: initialData ? initialData.createdAt : new Date().toISOString().split('T')[0],
    };

    onSave(newOrUpdated);
    onClose();
  };

  // Calc IDR live
  const liveAmount = parseFloat(amount) || 0;
  const liveRate = parseFloat(exchangeRate) || 1;
  const liveIdr = currency === 'IDR' ? liveAmount : liveAmount * liveRate;

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
          id="income-modal-overlay"
        >
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
            className="bg-neutral-900 rounded-xl max-w-2xl w-full shadow-2xl border border-[#262626] overflow-hidden flex flex-col text-[#E5E5E5]"
            id="income-modal-container"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-4 bg-neutral-950 border-b border-[#262626] text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-amber-500/10 text-amber-400 rounded-lg border border-amber-500/20">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-sans font-bold text-base tracking-tight text-neutral-100">
                    {initialData ? 'Edit Catatan Pemasukan' : 'Catat Pemasukan / Kas Masuk Baru'}
                  </h3>
                  <p className="text-xs text-neutral-400">
                    Arsip penerimaan royalti, payout AdSense &amp; transfer bersih BigMA
                  </p>
                </div>
              </div>
              <button 
                type="button"
                onClick={onClose} 
                className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
                id="close-income-modal-btn"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto max-h-[80vh]">
              {/* Platform Account & Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1">
                    Sumber Akun Platform <span className="text-rose-400">*</span>
                  </label>
                  <select
                    value={platformAccountId}
                    onChange={(e) => setPlatformAccountId(e.target.value)}
                    required
                    className="w-full px-3 py-2 text-xs bg-neutral-950 text-neutral-100 border border-[#262626] rounded-lg focus:outline-hidden focus:border-amber-500/60 font-medium"
                    id="income-select-platform-account"
                  >
                    {platformAccounts.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.platform}: {p.accountName}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1">
                    Tanggal Penerimaan / Masuk <span className="text-rose-400">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="date"
                      required
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-neutral-950 text-neutral-100 border border-[#262626] rounded-lg font-mono focus:outline-hidden focus:border-amber-500/60"
                      id="income-input-date"
                    />
                  </div>
                </div>
              </div>

              {/* Amount, Currency & Exchange Rate Box */}
              <div className="p-4 bg-neutral-950 border border-[#262626] rounded-xl space-y-3">
                <div className="text-xs font-semibold text-neutral-200 flex items-center gap-1.5">
                  <DollarSign className="w-4 h-4 text-amber-400" />
                  <span>Nominal &amp; Kurs Konversi IDR</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-medium text-neutral-400 mb-1">
                      Mata Uang <span className="text-rose-400">*</span>
                    </label>
                    <div className="flex gap-1.5">
                      {(['USD', 'IDR', 'EUR'] as const).map(c => (
                        <button
                          type="button"
                          key={c}
                          onClick={() => handleCurrencyChange(c)}
                          className={`flex-1 py-1.5 text-xs rounded-lg border font-mono font-bold transition-colors cursor-pointer ${
                            currency === c
                              ? 'bg-amber-400 text-neutral-950 border-amber-400 shadow-xs'
                              : 'bg-neutral-900 text-neutral-400 border-[#333] hover:bg-neutral-800'
                          }`}
                        >
                          {c}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-neutral-400 mb-1">
                      Nominal Asli Masuk <span className="text-rose-400">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-2.5 top-2 text-xs text-neutral-500 font-mono">{currency}</span>
                      <input
                        type="number"
                        step="any"
                        min="0.01"
                        required
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="0.00"
                        className="w-full pl-12 pr-3 py-1.5 text-xs bg-neutral-900 text-neutral-100 border border-[#333] rounded-lg font-mono focus:outline-hidden focus:border-amber-500/60"
                        id="income-input-amount"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-neutral-400 mb-1">
                      Kurs Konversi (1 {currency} = Rp)
                    </label>
                    <input
                      type="number"
                      step="any"
                      min="1"
                      disabled={currency === 'IDR'}
                      value={exchangeRate}
                      onChange={(e) => setExchangeRate(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs bg-neutral-900 text-neutral-100 disabled:opacity-50 disabled:bg-neutral-950 border border-[#333] rounded-lg font-mono focus:outline-hidden focus:border-amber-500/60"
                      id="income-input-rate"
                    />
                  </div>
                </div>

                {/* IDR Result Live Calculation */}
                <div className="p-2.5 bg-neutral-900/90 rounded-lg border border-[#333] flex items-center justify-between text-xs">
                  <span className="text-neutral-400 font-medium">Total Bersih Diterima (IDR):</span>
                  <span className="font-mono font-bold text-emerald-400 text-sm">
                    {formatCurrency(liveIdr, 'IDR')}
                  </span>
                </div>
              </div>

              {/* Payment Destination Source & Category */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1">
                    Sumber Rekening Penampung / Wallet <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={paymentSource}
                    onChange={(e) => setPaymentSource(e.target.value)}
                    placeholder="Payoneer, Mandiri Rek. Utama..."
                    className="w-full px-3 py-2 text-xs bg-neutral-950 text-neutral-100 placeholder:text-neutral-600 border border-[#262626] rounded-lg focus:outline-hidden focus:border-amber-500/60 font-medium"
                    id="income-input-source"
                    list="common-sources"
                  />
                  <datalist id="common-sources">
                    {COMMON_SOURCES.map(s => (
                      <option key={s} value={s} />
                    ))}
                  </datalist>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1">
                    Kategori Pemasukan <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    placeholder="Royalty Microstock, AdSense..."
                    className="w-full px-3 py-2 text-xs bg-neutral-950 text-neutral-100 placeholder:text-neutral-600 border border-[#262626] rounded-lg focus:outline-hidden focus:border-amber-500/60 font-medium"
                    id="income-input-category"
                    list="common-categories"
                  />
                  <datalist id="common-categories">
                    {COMMON_CATEGORIES.map(c => (
                      <option key={c} value={c} />
                    ))}
                  </datalist>
                </div>
              </div>

              {/* Reference ID & Notes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1">
                    No. Referensi / ID Transaksi / Invoice
                  </label>
                  <input
                    type="text"
                    value={referenceNo}
                    onChange={(e) => setReferenceNo(e.target.value)}
                    placeholder="TXN-2026-0901 atau INV-Adobe-..."
                    className="w-full px-3 py-2 text-xs bg-neutral-950 text-neutral-100 placeholder:text-neutral-600 border border-[#262626] rounded-lg focus:outline-hidden focus:border-amber-500/60 font-mono"
                    id="income-input-reference"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1">
                    Catatan Khusus Pemasukan
                  </label>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Royalti vector batch Agustus, penarikan otomatis..."
                    className="w-full px-3 py-2 text-xs bg-neutral-950 text-neutral-100 placeholder:text-neutral-600 border border-[#262626] rounded-lg focus:outline-hidden focus:border-amber-500/60 transition-colors"
                    id="income-input-notes"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-[#262626] flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-medium text-neutral-300 bg-neutral-800 hover:bg-neutral-700 rounded-lg transition-colors cursor-pointer"
                  id="cancel-income-btn"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={platformAccounts.length === 0}
                  className="px-5 py-2 text-xs font-sans font-bold text-neutral-950 bg-amber-400 hover:bg-amber-300 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
                  id="save-income-btn"
                >
                  <Save className="w-4 h-4 stroke-[2.5]" />
                  <span>Simpan Catatan Pemasukan</span>
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
