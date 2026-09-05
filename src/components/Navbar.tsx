import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ActiveTab, AppData } from '../types';
import { 
  KeyRound, 
  Layers, 
  Wallet, 
  TrendingUp, 
  Calendar, 
  Bell, 
  Settings2, 
  Plus, 
  ChevronDown, 
  Mail, 
  CircleDollarSign, 
  Clock,
  FileSpreadsheet,
  StickyNote,
  Sparkles,
  LogOut,
  Lock,
  Cloud,
  User as UserIcon
} from 'lucide-react';
import { formatCurrency, getDeadlineUrgency } from '../utils/formatters';

interface NavbarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  appData: AppData;
  onOpenNotifications: () => void;
  onOpenBackupModal: () => void;
  onExportAll?: () => void;
  onQuickAdd: (type: 'gmail' | 'platform' | 'note' | 'finance' | 'income' | 'deadline') => void;
  userEmail?: string | null;
  userName?: string | null;
  onSignOut?: () => void;
  onLockApp?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  appData,
  onOpenNotifications,
  onOpenBackupModal,
  onExportAll,
  onQuickAdd,
  userEmail,
  userName,
  onSignOut,
  onLockApp,
}) => {
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  // Compute urgent notification count (deadlines + urgent note reminders)
  const urgentDeadlineCount = appData.deadlines.filter(d => {
    if (d.status === 'Selesai') return false;
    const urgency = getDeadlineUrgency(d.dueDate, d.status);
    return urgency.isOverdue || urgency.daysRemaining <= 3;
  }).length;

  const urgentNoteCount = (appData.notes || []).filter(n => {
    if (!n.hasReminder || !n.reminderDate || n.reminderStatus === 'Selesai') return false;
    const urgency = getDeadlineUrgency(n.reminderDate, 'Belum Selesai');
    return urgency.isOverdue || urgency.daysRemaining <= 3;
  }).length;

  const totalUrgent = urgentDeadlineCount + urgentNoteCount;

  const navTabs: { id: ActiveTab; label: string; icon: React.FC<{ className?: string }>; count?: number; countColor?: string }[] = [
    { id: 'gmail', label: '1. Database Gmail', icon: KeyRound, count: appData.gmails.length },
    { id: 'platforms', label: '2. Kelola Akun Platform', icon: Layers, count: appData.platformAccounts.length },
    { id: 'notes', label: '3. Catatan Akun', icon: StickyNote, count: (appData.notes || []).length },
    { id: 'finance', label: '4. Keuangan Realtime', icon: Wallet },
    { id: 'income', label: '5. Database Pemasukan', icon: TrendingUp, count: appData.incomes.length },
    { 
      id: 'calendar', 
      label: '6. Kalender & Deadline', 
      icon: Calendar, 
      count: totalUrgent > 0 ? totalUrgent : undefined,
      countColor: totalUrgent > 0 ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' : undefined 
    },
  ];

  return (
    <header className="sticky top-0 z-40 bg-[#0A0A0A]/95 backdrop-blur-md text-[#E5E5E5] border-b border-[#262626] shadow-xl">
      {/* Top Bar: Brand, Quick Tickers, Actions */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Identity: BigMA with Strong Bold Sans-Serif Font & Tagline */}
          <motion.div 
            className="flex items-center gap-3 cursor-pointer select-none"
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
          >
            <div className="relative">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 via-amber-600 to-amber-700 flex items-center justify-center font-sans font-black text-neutral-950 text-lg shadow-lg shadow-amber-500/20 ring-1 ring-amber-400/30">
                B
              </div>
              <motion.div 
                className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-neutral-950" 
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ repeat: Infinity, duration: 2.5 }}
                title="System Operational"
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-sans font-black tracking-tight text-white leading-none">
                  Big<span className="text-amber-400">MA</span>
                </h1>
                <span className="text-[9px] font-sans font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30">
                  PRO
                </span>
              </div>
              <p className="text-[10px] font-sans font-bold tracking-widest text-neutral-400 uppercase mt-0.5">
                Account Manajement
              </p>
            </div>
          </motion.div>

          {/* Center Info Tickers with Micro Animations */}
          <div className="hidden md:flex items-center gap-3 text-xs">
            <motion.div 
              className="px-3 py-1.5 rounded-lg bg-neutral-900/70 border border-[#262626] text-neutral-300 flex items-center gap-2 hover:border-neutral-700 transition-colors"
              whileHover={{ y: -1 }}
            >
              <span className="text-neutral-500 font-sans font-bold text-[10px] uppercase tracking-wider">Kurs USD:</span>
              <span className="font-mono font-bold text-emerald-400">{formatCurrency(appData.settings.usdToIdrRate, 'IDR')}</span>
            </motion.div>
            <motion.div 
              className="px-3 py-1.5 rounded-lg bg-neutral-900/70 border border-[#262626] text-neutral-300 flex items-center gap-2 hover:border-neutral-700 transition-colors"
              whileHover={{ y: -1 }}
            >
              <span className="text-neutral-500 font-sans font-bold text-[10px] uppercase tracking-wider">Total Akun:</span>
              <span className="font-mono font-bold text-amber-400">{appData.platformAccounts.length} Akun</span>
            </motion.div>
          </div>

          {/* Right Action Icons & Admin Profile */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            {/* Export All Excel Button */}
            {onExportAll && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onExportAll}
                className="hidden sm:flex text-xs px-3 py-1.5 border border-neutral-700/80 hover:border-emerald-500/50 bg-neutral-900/60 hover:bg-neutral-800 text-neutral-300 hover:text-white transition-all rounded-lg items-center gap-1.5 cursor-pointer font-medium"
                title="Unduh seluruh database ke Excel (.xlsx)"
                id="navbar-export-all-btn"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                <span>Export Excel</span>
              </motion.button>
            )}

            {/* Quick Add Dropdown */}
            <div className="relative">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setQuickAddOpen(!quickAddOpen)}
                className="px-3.5 py-1.5 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-neutral-950 rounded-lg text-xs font-sans font-bold flex items-center gap-1.5 transition-all shadow-md shadow-amber-500/20 cursor-pointer"
                id="quick-add-btn"
              >
                <Plus className="w-3.5 h-3.5 stroke-[3]" />
                <span>Tambah Data</span>
                <motion.div
                  animate={{ rotate: quickAddOpen ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <ChevronDown className="w-3 h-3" />
                </motion.div>
              </motion.button>

              <AnimatePresence>
                {quickAddOpen && (
                  <>
                    <div className="fixed inset-0 z-20" onClick={() => setQuickAddOpen(false)} />
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.95, y: -4 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: -4 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 mt-2 w-56 bg-[#141414] text-[#E5E5E5] rounded-xl shadow-2xl border border-[#262626] py-1.5 z-30"
                    >
                      <div className="px-3 py-1 text-[10px] font-sans font-black text-neutral-500 uppercase tracking-widest border-b border-[#262626]/60 pb-1.5 mb-1 flex items-center justify-between">
                        <span>Aksi Cepat</span>
                        <Sparkles className="w-3 h-3 text-amber-400" />
                      </div>
                      <button
                        onClick={() => {
                          setQuickAddOpen(false);
                          onQuickAdd('gmail');
                        }}
                        className="w-full text-left px-3 py-2 text-xs hover:bg-neutral-800/80 flex items-center gap-2.5 text-neutral-200 transition-colors cursor-pointer"
                        id="quick-add-gmail-opt"
                      >
                        <div className="p-1 rounded bg-rose-500/10 text-rose-400">
                          <Mail className="w-3.5 h-3.5" />
                        </div>
                        <span>Akun Master Gmail Baru</span>
                      </button>
                      <button
                        onClick={() => {
                          setQuickAddOpen(false);
                          onQuickAdd('platform');
                        }}
                        className="w-full text-left px-3 py-2 text-xs hover:bg-neutral-800/80 flex items-center gap-2.5 text-neutral-200 transition-colors cursor-pointer"
                        id="quick-add-platform-opt"
                      >
                        <div className="p-1 rounded bg-sky-500/10 text-sky-400">
                          <Layers className="w-3.5 h-3.5" />
                        </div>
                        <span>Akun Platform Baru</span>
                      </button>
                      <button
                        onClick={() => {
                          setQuickAddOpen(false);
                          onQuickAdd('note');
                        }}
                        className="w-full text-left px-3 py-2 text-xs hover:bg-neutral-800/80 flex items-center gap-2.5 text-neutral-200 transition-colors cursor-pointer"
                        id="quick-add-note-opt"
                      >
                        <div className="p-1 rounded bg-amber-500/10 text-amber-400">
                          <StickyNote className="w-3.5 h-3.5" />
                        </div>
                        <span>Catatan Akun / Pengingat</span>
                      </button>
                      <button
                        onClick={() => {
                          setQuickAddOpen(false);
                          onQuickAdd('income');
                        }}
                        className="w-full text-left px-3 py-2 text-xs hover:bg-neutral-800/80 flex items-center gap-2.5 text-neutral-200 transition-colors cursor-pointer"
                        id="quick-add-income-opt"
                      >
                        <div className="p-1 rounded bg-emerald-500/10 text-emerald-400">
                          <CircleDollarSign className="w-3.5 h-3.5" />
                        </div>
                        <span>Catat Pemasukan</span>
                      </button>
                      <button
                        onClick={() => {
                          setQuickAddOpen(false);
                          onQuickAdd('deadline');
                        }}
                        className="w-full text-left px-3 py-2 text-xs hover:bg-neutral-800/80 flex items-center gap-2.5 text-neutral-200 transition-colors cursor-pointer"
                        id="quick-add-deadline-opt"
                      >
                        <div className="p-1 rounded bg-purple-500/10 text-purple-400">
                          <Clock className="w-3.5 h-3.5" />
                        </div>
                        <span>Jadwal Tenggat Baru</span>
                      </button>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            {/* Notification Bell with Urgent Ping */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onOpenNotifications}
              className="relative p-2 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-900 border border-transparent hover:border-[#262626] transition-colors cursor-pointer"
              id="navbar-notification-btn"
              title="Notifikasi & Pengingat Tenggat"
            >
              <Bell className="w-4 h-4" />
              {totalUrgent > 0 && (
                <motion.span 
                  initial={{ scale: 0 }}
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                  className="absolute -top-0.5 -right-0.5 min-w-4 h-4 px-1 bg-amber-500 text-neutral-950 text-[9px] font-sans font-black rounded-full flex items-center justify-center shadow-sm shadow-amber-500/50"
                >
                  {totalUrgent}
                </motion.span>
              )}
            </motion.button>

            {/* Backup & Settings Modal Trigger */}
            <motion.button
              whileHover={{ scale: 1.05, rotate: 15 }}
              whileTap={{ scale: 0.95 }}
              onClick={onOpenBackupModal}
              className="p-2 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-900 border border-transparent hover:border-[#262626] transition-all cursor-pointer"
              id="navbar-backup-modal-btn"
              title="Pengaturan & Cadangan Data"
            >
              <Settings2 className="w-4 h-4" />
            </motion.button>

            {/* Administrator Profile Pill & User Menu */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center space-x-2 pl-2 border-l border-[#262626] hover:opacity-90 transition-opacity cursor-pointer"
                id="navbar-user-profile-btn"
              >
                <div className="hidden md:block text-right">
                  <p className="text-xs font-sans font-bold text-neutral-200 leading-tight truncate max-w-[110px]">
                    {userName || 'BigMA Studio'}
                  </p>
                  <p className="text-[9px] text-amber-400/90 font-mono flex items-center justify-end gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    Cloud Vault
                  </p>
                </div>
                <div className="w-8 h-8 rounded-lg bg-neutral-900 border border-amber-500/40 flex items-center justify-center text-xs font-mono font-bold text-amber-400 shadow-inner">
                  BM
                </div>
              </button>

              <AnimatePresence>
                {userMenuOpen && (
                  <>
                    <div className="fixed inset-0 z-20" onClick={() => setUserMenuOpen(false)} />
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.95, y: -4 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: -4 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 mt-2 w-64 bg-[#141414] text-[#E5E5E5] rounded-xl shadow-2xl border border-[#262626] p-2 z-30 space-y-1"
                    >
                      <div className="p-2.5 bg-neutral-950 rounded-lg border border-[#262626] mb-1">
                        <p className="text-xs font-bold text-white truncate">
                          BigMA Master Cloud Vault
                        </p>
                        <p className="text-[11px] text-neutral-400 font-mono truncate">
                          Multi-Device Lifetime Sync
                        </p>
                        <div className="mt-2 pt-2 border-t border-[#262626] flex items-center justify-between text-[10px] text-neutral-400">
                          <span className="flex items-center gap-1 text-emerald-400">
                            <Cloud className="w-3 h-3" />
                            <span>Sinkron Real-time Aktif</span>
                          </span>
                          <span className="text-amber-400 font-mono">Kode: 2000</span>
                        </div>
                      </div>

                      {onLockApp && (
                        <button
                          type="button"
                          onClick={() => {
                            setUserMenuOpen(false);
                            onLockApp();
                          }}
                          className="w-full text-left px-3 py-2 text-xs rounded-lg hover:bg-neutral-800 text-neutral-300 hover:text-amber-300 flex items-center gap-2.5 transition-colors cursor-pointer"
                        >
                          <Lock className="w-3.5 h-3.5 text-amber-400" />
                          <span>Kunci Brankas (PIN 2000 &amp; Benang)</span>
                        </button>
                      )}
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Nav: 6 Main Menus with animated active tab indicator */}
      <div className="bg-neutral-950/90 border-t border-[#262626] px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex items-center gap-1.5 sm:gap-2 overflow-x-auto scrollbar-none py-2">
          {navTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-sans font-bold whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? 'text-white'
                    : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900/40'
                }`}
                id={`tab-${tab.id}-btn`}
              >
                {/* Active Tab Animated Background */}
                {isActive && (
                  <motion.div
                    layoutId="activeTabPill"
                    className="absolute inset-0 bg-neutral-900 border border-[#383838] rounded-lg shadow-md"
                    transition={{ type: 'spring', stiffness: 450, damping: 35 }}
                  />
                )}

                <span className="relative z-10 flex items-center gap-2">
                  <div className={`w-1.5 h-1.5 rounded-full transition-colors ${isActive ? 'bg-amber-400 shadow-sm shadow-amber-400' : 'bg-neutral-700'}`} />
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-amber-400' : 'text-neutral-400'}`} />
                  <span>{tab.label}</span>
                  {tab.count !== undefined && (
                    <span className={`px-1.5 py-0.2 rounded text-[10px] font-mono border ${
                      tab.countColor || (isActive ? 'bg-neutral-800 text-amber-300 border-neutral-700' : 'bg-neutral-900 text-neutral-500 border-[#262626]')
                    }`}>
                      {tab.count}
                    </span>
                  )}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};
