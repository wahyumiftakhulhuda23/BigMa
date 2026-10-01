import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { DigitalProductItem } from '../../types';
import { 
  ShoppingBag, 
  Plus, 
  Search, 
  Calendar, 
  Clock, 
  DollarSign, 
  Tag, 
  Share2, 
  Filter, 
  Edit, 
  Trash2, 
  Copy, 
  ExternalLink,
  Layers,
  Sparkles,
  Rocket,
  CheckCircle2,
  AlertCircle,
  Lightbulb
} from 'lucide-react';
import { getDeadlineUrgency, formatCurrency } from '../../utils/formatters';

interface DigitalProductViewProps {
  products: DigitalProductItem[];
  onAddProduct: () => void;
  onEditProduct: (product: DigitalProductItem) => void;
  onDeleteProduct: (id: string) => void;
  onUpdateProduct: (product: DigitalProductItem) => void;
}

export const DigitalProductView: React.FC<DigitalProductViewProps> = ({
  products = [],
  onAddProduct,
  onEditProduct,
  onDeleteProduct,
  onUpdateProduct,
}) => {
  const [activeFilter, setActiveFilter] = useState<string>('Semua');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Semua');
  const [selectedPlatform, setSelectedPlatform] = useState<string>('Semua');

  // Stats calculation
  const stats = useMemo(() => {
    let ideaCount = 0;
    let productionCount = 0;
    let readyCount = 0;
    let launchedCount = 0;
    let upcomingUrgent = 0;

    products.forEach(p => {
      if (p.status === 'Sudah Rilis') {
        launchedCount++;
      } else {
        if (p.status === 'Ide / Konsep') ideaCount++;
        if (p.status === 'Produksi Bahan') productionCount++;
        if (p.status === 'Siap Rilis') readyCount++;

        const urgency = getDeadlineUrgency(p.releaseDate, 'Dalam Proses');
        if (urgency.daysRemaining >= 0 && urgency.daysRemaining <= 7) {
          upcomingUrgent++;
        }
      }
    });

    return {
      total: products.length,
      ideaCount,
      productionCount,
      readyCount,
      launchedCount,
      upcomingUrgent,
    };
  }, [products]);

  // Unique categories & platforms
  const categoryList = useMemo(() => {
    const set = new Set<string>();
    products.forEach(p => { if (p.category) set.add(p.category); });
    return ['Semua', ...Array.from(set)];
  }, [products]);

  const platformList = useMemo(() => {
    const set = new Set<string>();
    products.forEach(p => { if (p.platform) set.add(p.platform); });
    return ['Semua', ...Array.from(set)];
  }, [products]);

  // Filtered items
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      if (activeFilter !== 'Semua' && p.status !== activeFilter) return false;
      if (selectedCategory !== 'Semua' && p.category !== selectedCategory) return false;
      if (selectedPlatform !== 'Semua' && p.platform !== selectedPlatform) return false;

      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchTitle = p.title.toLowerCase().includes(q);
        const matchCategory = p.category.toLowerCase().includes(q);
        const matchPlatform = (p.platform || '').toLowerCase().includes(q);
        const matchConcept = (p.conceptNotes || '').toLowerCase().includes(q);
        const matchSchedule = (p.contentSchedule || '').toLowerCase().includes(q);
        const matchPromo = (p.promoChannel || '').toLowerCase().includes(q);
        return matchTitle || matchCategory || matchPlatform || matchConcept || matchSchedule || matchPromo;
      }

      return true;
    });
  }, [products, activeFilter, selectedCategory, selectedPlatform, searchTerm]);

  const getStatusBadge = (status: DigitalProductItem['status']) => {
    switch (status) {
      case 'Sudah Rilis':
        return <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1"><CheckCircle2 className="w-3 h-3 text-emerald-400" /> Sudah Rilis</span>;
      case 'Siap Rilis':
        return <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-teal-500/20 text-teal-300 border border-teal-500/40 flex items-center gap-1"><Rocket className="w-3 h-3 text-teal-400" /> Siap Rilis</span>;
      case 'Produksi Bahan':
        return <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1"><Clock className="w-3 h-3 text-amber-400" /> Produksi Bahan</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/40 flex items-center gap-1"><Lightbulb className="w-3 h-3 text-purple-400" /> Ide / Konsep</span>;
    }
  };

  return (
    <div className="space-y-6 pb-12 font-sans select-none">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-emerald-950/70 via-neutral-900 to-teal-950/60 p-6 rounded-2xl border border-emerald-500/30 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-mono font-bold uppercase tracking-wider flex items-center gap-1.5">
                <ShoppingBag className="w-3.5 h-3.5 text-emerald-400" />
                Digital Product &amp; Content Release
              </span>
              <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/30 text-[10px] font-bold">
                Jadwal &amp; Rilis
              </span>
            </div>
            <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
              Manajemen Produk Digital &amp; Konten Rilis
            </h2>
            <p className="text-xs text-neutral-400 mt-1 max-w-xl">
              Kelola ide produk digital, konsep konten, rancangan harga, jadwal tanggal peluncuran, dan rencana promosi rilis secara terstruktur.
            </p>
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onAddProduct}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-600/25 flex items-center justify-center gap-2 cursor-pointer transition-all shrink-0"
            id="add-digital-product-btn"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>+ Jadwalkan Rilis Produk</span>
          </motion.button>
        </div>

        {/* Tickers */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
          <div className="p-3.5 bg-neutral-950/70 rounded-xl border border-[#262626] flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Total Produk Digital</p>
              <p className="text-xl font-black text-white font-mono mt-0.5">{stats.total}</p>
            </div>
            <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>

          <div className="p-3.5 bg-neutral-950/70 rounded-xl border border-[#262626] flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Ide &amp; Konsep Awal</p>
              <p className="text-xl font-black text-purple-400 font-mono mt-0.5">{stats.ideaCount}</p>
            </div>
            <div className="p-2.5 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <Lightbulb className="w-4 h-4" />
            </div>
          </div>

          <div className="p-3.5 bg-neutral-950/70 rounded-xl border border-[#262626] flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Siap / Dalam Produksi</p>
              <p className="text-xl font-black text-teal-400 font-mono mt-0.5">{stats.readyCount + stats.productionCount}</p>
            </div>
            <div className="p-2.5 rounded-lg bg-teal-500/10 text-teal-400 border border-teal-500/20">
              <Rocket className="w-4 h-4" />
            </div>
          </div>

          <div className="p-3.5 bg-neutral-950/70 rounded-xl border border-[#262626] flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Rilis Minggu Ini</p>
              <p className="text-xl font-black text-amber-400 font-mono mt-0.5">{stats.upcomingUrgent} Produk</p>
            </div>
            <div className="p-2.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
        </div>
      </div>

      {/* Mode Sub-Tabs Filter */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {['Semua', 'Ide / Konsep', 'Produksi Bahan', 'Siap Rilis', 'Sudah Rilis'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveFilter(tab)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeFilter === tab
                ? 'bg-emerald-600 text-white shadow-md'
                : 'bg-neutral-900 border border-[#262626] text-neutral-400 hover:text-white'
            }`}
          >
            {tab} ({tab === 'Semua' ? products.length : products.filter(p => p.status === tab).length})
          </button>
        ))}
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 bg-neutral-900 rounded-xl border border-[#262626] flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cari produk digital, platform, jadwal..."
            className="w-full bg-neutral-950 border border-[#262626] focus:border-emerald-400 rounded-lg py-2 pl-9 pr-3 text-xs text-white placeholder-neutral-500 focus:outline-none"
            id="digital-search-input"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Category filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-neutral-950 border border-[#262626] text-white rounded-lg px-2.5 py-1.5 text-xs focus:outline-none"
          >
            {categoryList.map(cat => (
              <option key={cat} value={cat}>Kategori: {cat}</option>
            ))}
          </select>

          {/* Platform filter */}
          <select
            value={selectedPlatform}
            onChange={(e) => setSelectedPlatform(e.target.value)}
            className="bg-neutral-950 border border-[#262626] text-white rounded-lg px-2.5 py-1.5 text-xs focus:outline-none"
          >
            {platformList.map(plat => (
              <option key={plat} value={plat}>Platform: {plat}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-neutral-900 rounded-xl border border-[#262626] overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-neutral-950 border-b border-[#262626] text-neutral-400 uppercase font-mono text-[10px]">
              <tr>
                <th className="py-3 px-4">Nama Produk &amp; Ide Konsep</th>
                <th className="py-3 px-4">Kategori &amp; Platform</th>
                <th className="py-3 px-4">Estimasi Harga</th>
                <th className="py-3 px-4">Jadwal Rilis Kapan</th>
                <th className="py-3 px-4">Status Progres</th>
                <th className="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#262626]/60">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-neutral-500">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <ShoppingBag className="w-8 h-8 text-neutral-700" />
                      <p className="text-xs font-semibold">Belum ada jadwal produk digital di kategori ini</p>
                      <button
                        onClick={onAddProduct}
                        className="mt-1 text-xs text-emerald-400 hover:underline font-bold"
                      >
                        + Jadwalkan Rilis Produk Digital Pertama
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredProducts.map(p => {
                  const urgency = getDeadlineUrgency(p.releaseDate, p.status === 'Sudah Rilis' ? 'Selesai' : 'Dalam Proses');
                  return (
                    <tr
                      key={p.id}
                      className={`hover:bg-neutral-800/50 transition-colors ${
                        p.status === 'Sudah Rilis' ? 'opacity-70 bg-neutral-950/30' : ''
                      }`}
                    >
                      {/* Title & Concept */}
                      <td className="py-3 px-4 max-w-sm">
                        <div className="font-bold text-white text-xs leading-snug">
                          {p.title}
                        </div>

                        {p.conceptNotes && (
                          <p className="text-[11px] text-neutral-400 mt-1 line-clamp-1">
                            {p.conceptNotes}
                          </p>
                        )}

                        {p.contentSchedule && (
                          <div className="text-[10px] text-emerald-300/90 font-mono bg-emerald-950/30 p-1.5 rounded mt-1 border border-emerald-500/20 line-clamp-1">
                            Jadwal Konten: {p.contentSchedule.replace(/\n/g, ' • ')}
                          </div>
                        )}
                      </td>

                      {/* Category & Platform */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-neutral-950 border border-[#262626] text-neutral-200 font-bold">
                          <span>{p.category}</span>
                        </div>
                        <div className="text-[10px] text-emerald-400 font-mono mt-1">
                          {p.platform || 'Gumroad'}
                        </div>
                        {p.promoChannel && (
                          <div className="text-[10px] text-neutral-500 truncate max-w-[140px] mt-0.5">
                            Promo: {p.promoChannel}
                          </div>
                        )}
                      </td>

                      {/* Pricing */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        {p.pricing ? (
                          <div className="font-mono font-bold text-xs text-amber-400">
                            {p.currency === 'USD' ? `$${p.pricing}` : formatCurrency(p.pricing, 'IDR')}
                          </div>
                        ) : (
                          <span className="text-neutral-500 text-[11px]">Free / N/A</span>
                        )}
                      </td>

                      {/* Release Date */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="font-mono font-bold text-xs text-white flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-neutral-400" />
                          <span>{p.releaseDate} {p.releaseTime ? `(${p.releaseTime})` : ''}</span>
                        </div>
                        {p.status !== 'Sudah Rilis' && (
                          <div className="mt-1">
                            {urgency.isOverdue ? (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40">
                                Terlewat {Math.abs(urgency.daysRemaining)} Hari
                              </span>
                            ) : urgency.daysRemaining === 0 ? (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                                🚀 Rilis Hari Ini
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-neutral-800 text-neutral-400">
                                {urgency.daysRemaining} Hari Lagi
                              </span>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Status Dropdown */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <select
                          value={p.status}
                          onChange={(e) => onUpdateProduct({ ...p, status: e.target.value as any })}
                          className="bg-neutral-950 border border-[#262626] text-white rounded-lg px-2 py-1 text-xs focus:outline-none cursor-pointer"
                        >
                          <option value="Ide / Konsep">Ide / Konsep</option>
                          <option value="Produksi Bahan">Produksi Bahan</option>
                          <option value="Siap Rilis">Siap Rilis</option>
                          <option value="Sudah Rilis">Sudah Rilis</option>
                        </select>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => onEditProduct(p)}
                            className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
                            title="Edit"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              const dup: DigitalProductItem = {
                                ...p,
                                id: `digi-${Date.now()}`,
                                title: `${p.title} (Salinan)`,
                                createdAt: new Date().toISOString().split('T')[0],
                              };
                              onUpdateProduct(dup);
                            }}
                            className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
                            title="Duplikat"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onDeleteProduct(p.id)}
                            className="p-1.5 rounded-lg text-neutral-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                            title="Hapus"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
