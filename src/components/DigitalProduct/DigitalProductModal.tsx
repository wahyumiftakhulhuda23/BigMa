import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { DigitalProductItem } from '../../types';
import { 
  X, 
  Sparkles, 
  ShoppingBag, 
  Calendar, 
  Clock, 
  DollarSign, 
  Tag, 
  Share2, 
  Bell, 
  FileText,
  Layers
} from 'lucide-react';

interface DigitalProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (item: DigitalProductItem) => void;
  editingItem?: DigitalProductItem | null;
}

export const DigitalProductModal: React.FC<DigitalProductModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingItem,
}) => {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<DigitalProductItem['category']>('Template');
  const [platform, setPlatform] = useState('Gumroad');
  const [releaseDate, setReleaseDate] = useState('');
  const [releaseTime, setReleaseTime] = useState('19:00');
  const [status, setStatus] = useState<DigitalProductItem['status']>('Ide / Konsep');
  const [pricing, setPricing] = useState<string>('99000');
  const [currency, setCurrency] = useState<'IDR' | 'USD'>('IDR');
  const [conceptNotes, setConceptNotes] = useState('');
  const [contentSchedule, setContentSchedule] = useState('');
  const [promoChannel, setPromoChannel] = useState('');
  const [reminderActive, setReminderActive] = useState(true);

  useEffect(() => {
    if (editingItem) {
      setTitle(editingItem.title);
      setCategory(editingItem.category);
      setPlatform(editingItem.platform || 'Gumroad');
      setReleaseDate(editingItem.releaseDate);
      setReleaseTime(editingItem.releaseTime || '19:00');
      setStatus(editingItem.status);
      setPricing(editingItem.pricing?.toString() || '0');
      setCurrency(editingItem.currency || 'IDR');
      setConceptNotes(editingItem.conceptNotes || '');
      setContentSchedule(editingItem.contentSchedule || '');
      setPromoChannel(editingItem.promoChannel || '');
      setReminderActive(editingItem.reminderActive ?? true);
    } else {
      setTitle('');
      setCategory('Template');
      setPlatform('Gumroad');
      const today = new Date().toISOString().split('T')[0];
      setReleaseDate(today);
      setReleaseTime('19:00');
      setStatus('Ide / Konsep');
      setPricing('99000');
      setCurrency('IDR');
      setConceptNotes('');
      setContentSchedule('H-3: Teaser Video\nH-1: Countdown Post\nH-Day: Link Pembelian Aktif');
      setPromoChannel('Instagram Reels, TikTok, YouTube Shorts');
      setReminderActive(true);
    }
  }, [editingItem, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !releaseDate) return;

    const item: DigitalProductItem = {
      id: editingItem?.id || `digi-${Date.now()}`,
      title: title.trim(),
      category,
      platform: platform.trim() || 'Gumroad',
      releaseDate,
      releaseTime: releaseTime.trim() || '19:00',
      status,
      pricing: parseFloat(pricing) || 0,
      currency,
      conceptNotes: conceptNotes.trim(),
      contentSchedule: contentSchedule.trim(),
      promoChannel: promoChannel.trim(),
      reminderActive,
      createdAt: editingItem?.createdAt || new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0],
    };

    onSave(item);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs select-none"
          onClick={(e) => {
            if (e.target === e.currentTarget) onClose();
          }}
          id="digital-product-modal-overlay"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="bg-neutral-900 rounded-xl max-w-xl w-full shadow-2xl border border-[#262626] overflow-hidden flex flex-col text-[#E5E5E5]"
            id="digital-product-modal-card"
          >
            {/* Header */}
            <div className="p-4 bg-neutral-950 border-b border-[#262626] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-lg">
                  <ShoppingBag className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-sans font-bold text-base text-white">
                    {editingItem ? 'Edit Jadwal Produk Digital' : 'Rilis Produk Digital & Jadwal Konten'}
                  </h3>
                  <p className="text-xs text-neutral-400">Ide, Konsep, Jadwal Rilis &amp; Promosi</p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1">
                  Nama Produk Digital / Judul Rilis <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Misal: Cinematic Lightroom Presets 2026 / Notion Creator OS"
                  className="w-full bg-neutral-950 border border-[#262626] focus:border-emerald-400 rounded-lg px-3 py-2 text-xs text-white placeholder-neutral-600 focus:outline-none"
                  id="digital-title-input"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1">Kategori Produk</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="w-full bg-neutral-950 border border-[#262626] focus:border-emerald-400 rounded-lg px-3 py-2 text-xs text-white focus:outline-none"
                    id="digital-category-select"
                  >
                    <option value="Template">Template (Canva/Notion/Web)</option>
                    <option value="UI Kit">UI Kit &amp; Icon Pack</option>
                    <option value="E-Book">E-Book &amp; Guide</option>
                    <option value="Preset & LUT">Preset &amp; LUTs Video/Foto</option>
                    <option value="Bundle">Design Bundle / Stock Assets</option>
                    <option value="Video Course">Video Course / Tutorial</option>
                    <option value="Audio/SFX">Audio &amp; SFX Effects</option>
                    <option value="Software/Script">Software, Tools &amp; Scripts</option>
                    <option value="Lainnya">Lainnya</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1">Platform Rilis / Penjualan</label>
                  <input
                    type="text"
                    value={platform}
                    onChange={(e) => setPlatform(e.target.value)}
                    placeholder="Gumroad, Lemon Squeezy, Web, Shopee"
                    className="w-full bg-neutral-950 border border-[#262626] focus:border-emerald-400 rounded-lg px-3 py-2 text-xs text-white placeholder-neutral-600 focus:outline-none"
                    id="digital-platform-input"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1">
                    Jadwal Rilis Kapan (Target) <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={releaseDate}
                    onChange={(e) => setReleaseDate(e.target.value)}
                    className="w-full bg-neutral-950 border border-[#262626] focus:border-emerald-400 rounded-lg px-3 py-2 text-xs text-white focus:outline-none font-mono"
                    id="digital-date-input"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1">Jam Peluncuran / Rilis</label>
                  <input
                    type="time"
                    value={releaseTime}
                    onChange={(e) => setReleaseTime(e.target.value)}
                    className="w-full bg-neutral-950 border border-[#262626] focus:border-emerald-400 rounded-lg px-3 py-2 text-xs text-white focus:outline-none font-mono"
                    id="digital-time-input"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1">Status Progres</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="w-full bg-neutral-950 border border-[#262626] focus:border-emerald-400 rounded-lg px-3 py-2 text-xs text-white focus:outline-none"
                    id="digital-status-select"
                  >
                    <option value="Ide / Konsep">💡 Ide / Konsep Awal</option>
                    <option value="Produksi Bahan">⚙️ Sedang Produksi Bahan</option>
                    <option value="Siap Rilis">🚀 Siap Rilis (Final Review)</option>
                    <option value="Sudah Rilis">✅ Sudah Rilis / Live</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1">Rencana Harga</label>
                  <div className="flex items-center gap-1.5">
                    <select
                      value={currency}
                      onChange={(e) => setCurrency(e.target.value as any)}
                      className="bg-neutral-950 border border-[#262626] text-amber-400 rounded-lg px-2 py-2 text-xs font-mono font-bold focus:outline-none"
                    >
                      <option value="IDR">Rp</option>
                      <option value="USD">$</option>
                    </select>
                    <input
                      type="number"
                      value={pricing}
                      onChange={(e) => setPricing(e.target.value)}
                      placeholder="99000"
                      className="w-full bg-neutral-950 border border-[#262626] focus:border-emerald-400 rounded-lg px-3 py-2 text-xs text-white focus:outline-none font-mono font-bold"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1">
                  Ide &amp; Konsep Produk (Deskripsi &amp; Nilai Jual)
                </label>
                <textarea
                  rows={3}
                  value={conceptNotes}
                  onChange={(e) => setConceptNotes(e.target.value)}
                  placeholder="Gagasan ide utama, siapa target pembeli, solusi apa yang diberikan produk ini..."
                  className="w-full bg-neutral-950 border border-[#262626] focus:border-emerald-400 rounded-lg p-3 text-xs text-white placeholder-neutral-600 focus:outline-none"
                  id="digital-concept-input"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-emerald-400 mb-1 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Jadwal Konten Promosi &amp; Rilis (Roadmap)</span>
                </label>
                <textarea
                  rows={3}
                  value={contentSchedule}
                  onChange={(e) => setContentSchedule(e.target.value)}
                  placeholder="Contoh:&#10;H-5: Teaser di Instagram & TikTok&#10;H-2: Early bird preorder&#10;H-Day: Video showcase YouTube & broadcast email"
                  className="w-full bg-neutral-950 border border-emerald-500/30 focus:border-emerald-400 rounded-lg p-3 text-xs text-white placeholder-neutral-600 focus:outline-none font-mono"
                  id="digital-schedule-input"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1">
                  Saluran Promosi / Kanal Distribusi
                </label>
                <input
                  type="text"
                  value={promoChannel}
                  onChange={(e) => setPromoChannel(e.target.value)}
                  placeholder="Misal: Instagram Reels, TikTok, YouTube Community, Twitter/X"
                  className="w-full bg-neutral-950 border border-[#262626] focus:border-emerald-400 rounded-lg px-3 py-2 text-xs text-white placeholder-neutral-600 focus:outline-none"
                  id="digital-channel-input"
                />
              </div>

              <div className="flex items-center justify-between p-3 bg-neutral-950 rounded-lg border border-[#262626]">
                <div className="flex items-center gap-2">
                  <Bell className="w-4 h-4 text-emerald-400" />
                  <div>
                    <p className="text-xs font-semibold text-white">Pengingat Jadwal Rilis</p>
                    <p className="text-[11px] text-neutral-400">Aktifkan peringatan menjelang hari rilis produk</p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={reminderActive}
                  onChange={(e) => setReminderActive(e.target.checked)}
                  className="w-4 h-4 rounded border-neutral-700 text-emerald-500 focus:ring-0 cursor-pointer"
                  id="digital-reminder-checkbox"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-xs font-bold text-neutral-300 transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white transition-colors cursor-pointer shadow-lg shadow-emerald-600/20"
                  id="save-digital-product-btn"
                >
                  {editingItem ? 'Simpan Perubahan' : 'Jadwalkan Rilis Produk'}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
