import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ActiveTab, AppData, TopMode } from '../types';
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
  Lock,
  Cloud,
  PlaySquare,
  Image as ImageIcon,
  Building2,
  Briefcase,
  Code2,
  Bug,
  Lightbulb,
  Wrench,
  ShoppingBag,
  Rocket,
  PanelLeftClose,
  PanelLeftOpen,
  Menu,
  X,
  User as UserIcon
} from 'lucide-react';
import { formatCurrency, getDeadlineUrgency } from '../utils/formatters';

interface SidebarProps {
  topMode: TopMode;
  setTopMode: (mode: TopMode) => void;
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  appData: AppData;
  onOpenNotifications: () => void;
  onOpenBackupModal: () => void;
  onExportAll?: () => void;
  onQuickAdd: (type: 'gmail' | 'platform' | 'note' | 'finance' | 'income' | 'deadline' | 'youtube' | 'microstock' | 'office' | 'dev-bug' | 'dev-idea' | 'dev-maint' | 'digital-product') => void;
  userEmail?: string | null;
  userName?: string | null;
  onLockApp?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  topMode,
  setTopMode,
  activeTab,
  setActiveTab,
  appData,
  onOpenNotifications,
  onOpenBackupModal,
  onExportAll,
  onQuickAdd,
  userEmail,
  userName,
  onLockApp,
}) => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  // Compute urgent notification count (deadlines + urgent note reminders + overdue office tasks)
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

  const urgentOfficeCount = (appData.officeTasks || []).filter(o => {
    if (o.status === 'Selesai') return false;
    const urgency = getDeadlineUrgency(o.dueDate, o.status);
    return urgency.isOverdue || urgency.daysRemaining <= 1;
  }).length;

  const totalUrgent = urgentDeadlineCount + urgentNoteCount + urgentOfficeCount;

  // Counts
  const totalYoutubeAccounts = (appData.platformAccounts || []).filter(p => {
    const plat = (p.platform || '').toLowerCase();
    const cust = (p.customPlatformName || '').toLowerCase();
    return plat.includes('youtube') || cust.includes('youtube') || p.platform === 'YouTube';
  }).length;

  const totalMicrostockAccounts = (appData.platformAccounts || []).filter(p => {
    const plat = (p.platform || '').toLowerCase();
    return !plat.includes('youtube');
  }).length;

  // Freelance Tabs
  const freelanceNavTabs: { 
    id: ActiveTab; 
    label: string; 
    icon: React.FC<{ className?: string }>; 
    count?: number; 
    countColor?: string;
    isHighlight?: boolean;
    highlightBadge?: string;
  }[] = [
    { id: 'gmail', label: '1. Database Gmail', icon: KeyRound, count: appData.gmails.length },
    { id: 'platforms', label: '2. Kelola Akun Platform', icon: Layers, count: appData.platformAccounts.length },
    { 
      id: 'youtube-schedule', 
      label: 'Penjadwalan YouTube', 
      icon: PlaySquare, 
      count: totalYoutubeAccounts,
      isHighlight: true,
      highlightBadge: 'Highlight #1',
      countColor: 'bg-red-500/20 text-red-300 border-red-500/40 font-bold',
    },
    { 
      id: 'microstock', 
      label: 'Data Microstock', 
      icon: ImageIcon, 
      count: totalMicrostockAccounts,
      isHighlight: true,
      highlightBadge: 'Highlight #2',
      countColor: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40 font-bold',
    },
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

  // Office Tabs
  const officeNavTabs: {
    id: ActiveTab;
    label: string;
    icon: React.FC<{ className?: string }>;
    count?: number;
    countColor?: string;
    isHighlight?: boolean;
    highlightBadge?: string;
  }[] = [
    { 
      id: 'office-jobs', 
      label: '1. Pengingat Pekerjaan Kantor', 
      icon: Building2, 
      count: (appData.officeTasks || []).length,
      countColor: 'bg-blue-500/20 text-blue-300 border-blue-500/40 font-bold'
    },
    { id: 'notes', label: '2. Catatan & SOP Office', icon: StickyNote, count: (appData.notes || []).length },
    { id: 'calendar', label: '3. Kalender & Agenda Dinas', icon: Calendar },
  ];

  // Project Dev Tabs
  const projectDevNavTabs: {
    id: ActiveTab;
    label: string;
    icon: React.FC<{ className?: string }>;
    count?: number;
    countColor?: string;
    isHighlight?: boolean;
    highlightBadge?: string;
  }[] = [
    { 
      id: 'project-dev-all', 
      label: '1. Semua Project Dev', 
      icon: Code2, 
      count: (appData.devProjects || []).length,
      countColor: 'bg-purple-500/20 text-purple-300 border-purple-500/40 font-bold'
    },
    { 
      id: 'project-dev-bugs', 
      label: '2. Manajemen Bug', 
      icon: Bug, 
      count: (appData.devProjects || []).filter(i => i.type === 'Bug' && i.status !== 'Selesai').length,
      countColor: 'bg-rose-500/20 text-rose-300 border-rose-500/40 font-bold'
    },
    { 
      id: 'project-dev-ideas', 
      label: '3. Ide & Konsep Fitur', 
      icon: Lightbulb, 
      count: (appData.devProjects || []).filter(i => i.type === 'Ide').length,
      countColor: 'bg-amber-500/20 text-amber-300 border-amber-500/40 font-bold'
    },
    { 
      id: 'project-dev-maintenance', 
      label: '4. Pengingat Maintenance', 
      icon: Wrench, 
      count: (appData.devProjects || []).filter(i => i.type === 'Maintenance' && i.status !== 'Selesai').length,
      countColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 font-bold'
    },
  ];

  // Digital Product Tabs
  const digitalProductNavTabs: {
    id: ActiveTab;
    label: string;
    icon: React.FC<{ className?: string }>;
    count?: number;
    countColor?: string;
    isHighlight?: boolean;
    highlightBadge?: string;
  }[] = [
    { 
      id: 'digital-product-all', 
      label: '1. Semua Produk Digital', 
      icon: ShoppingBag, 
      count: (appData.digitalProducts || []).length,
      countColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 font-bold'
    },
    { 
      id: 'digital-product-calendar', 
      label: '2. Jadwal Konten Rilis', 
      icon: Calendar, 
      count: (appData.digitalProducts || []).filter(p => p.status !== 'Sudah Rilis').length,
      countColor: 'bg-teal-500/20 text-teal-300 border-teal-500/40 font-bold'
    },
    { 
      id: 'digital-product-ideas', 
      label: '3. Ide & Konsep Rilis', 
      icon: Sparkles, 
      count: (appData.digitalProducts || []).filter(p => p.status === 'Ide / Konsep').length,
      countColor: 'bg-amber-500/20 text-amber-300 border-amber-500/40 font-bold'
    },
  ];

  const currentTabs = 
    topMode === 'freelance' 
      ? freelanceNavTabs 
      : topMode === 'office' 
      ? officeNavTabs 
      : topMode === 'project-dev' 
      ? projectDevNavTabs 
      : digitalProductNavTabs;

  return (
    <>
      {/* Mobile Top Navbar with Hamburger */}
      <div className="lg:hidden sticky top-0 z-40 bg-[#0A0A0A]/95 backdrop-blur-md text-[#E5E5E5] border-b border-[#262626] px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="p-2 rounded-lg bg-neutral-900 border border-[#262626] text-amber-400"
            id="mobile-menu-toggle"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center font-black text-neutral-950 text-sm shadow-md">
              B
            </div>
            <span className="font-black text-base text-white tracking-tight">Big<span className="text-amber-400">MA</span></span>
          </div>
        </div>

        {/* Top Mode Quick Switcher Mobile */}
        <div className="flex items-center gap-1 bg-neutral-950 p-1 rounded-xl border border-[#262626] overflow-x-auto max-w-[200px] scrollbar-none">
          <button
            onClick={() => {
              setTopMode('freelance');
              setActiveTab('gmail');
            }}
            className={`px-2 py-1 rounded-lg text-[10px] font-bold whitespace-nowrap transition-all ${
              topMode === 'freelance'
                ? 'bg-amber-500 text-neutral-950 shadow-md'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            Freelance
          </button>
          <button
            onClick={() => {
              setTopMode('office');
              setActiveTab('office-jobs');
            }}
            className={`px-2 py-1 rounded-lg text-[10px] font-bold whitespace-nowrap transition-all ${
              topMode === 'office'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            Office
          </button>
          <button
            onClick={() => {
              setTopMode('project-dev');
              setActiveTab('project-dev-all');
            }}
            className={`px-2 py-1 rounded-lg text-[10px] font-bold whitespace-nowrap transition-all ${
              topMode === 'project-dev'
                ? 'bg-purple-600 text-white shadow-md'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            Dev
          </button>
          <button
            onClick={() => {
              setTopMode('digital-product');
              setActiveTab('digital-product-all');
            }}
            className={`px-2 py-1 rounded-lg text-[10px] font-bold whitespace-nowrap transition-all ${
              topMode === 'digital-product'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            Produk
          </button>
        </div>
      </div>

      {/* Backdrop for Mobile Sidebar Drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setMobileOpen(false)}
            className="lg:hidden fixed inset-0 bg-black/80 z-40 backdrop-blur-xs"
          />
        )}
      </AnimatePresence>

      {/* Main Sidebar Container */}
      <aside
        className={`fixed top-0 left-0 bottom-0 z-50 bg-[#0A0A0A] border-r border-[#262626] text-[#E5E5E5] flex flex-col justify-between transition-all duration-300 select-none ${
          mobileOpen ? 'translate-x-0 w-72' : '-translate-x-full lg:translate-x-0'
        } ${collapsed ? 'lg:w-20' : 'lg:w-72'}`}
      >
        {/* Top Header: Brand Identity & Collapse Button */}
        <div>
          <div className="p-4 border-b border-[#262626] flex items-center justify-between">
            {!collapsed && (
              <motion.div 
                className="flex items-center gap-3 cursor-pointer"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <div className="relative">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 via-amber-600 to-amber-700 flex items-center justify-center font-sans font-black text-neutral-950 text-lg shadow-lg shadow-amber-500/20 ring-1 ring-amber-400/30">
                    B
                  </div>
                  <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-neutral-950" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h1 className="text-lg font-black tracking-tight text-white leading-none">
                      Big<span className="text-amber-400">MA</span>
                    </h1>
                    <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30">
                      PRO
                    </span>
                  </div>
                  <p className="text-[9px] font-bold tracking-widest text-neutral-400 uppercase mt-0.5">
                    Account Manajement
                  </p>
                </div>
              </motion.div>
            )}

            {collapsed && (
              <div className="mx-auto w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center font-black text-neutral-950 text-lg shadow-lg">
                B
              </div>
            )}

            {/* Desktop Toggle Collapse Button */}
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="hidden lg:flex p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-900 transition-colors"
              title={collapsed ? 'Perluas Sidebar' : 'Ciutkan Sidebar'}
            >
              {collapsed ? <PanelLeftOpen className="w-5 h-5" /> : <PanelLeftClose className="w-5 h-5" />}
            </button>
          </div>

          {/* Mode Switcher Buttons (4 Highlight Spaces) */}
          {!collapsed ? (
            <div className="p-3 border-b border-[#262626] bg-neutral-950/80">
              <p className="text-[10px] font-mono font-bold text-neutral-500 uppercase tracking-widest mb-2 px-1">
                Pilih Mode Ruang Kerja:
              </p>
              <div className="grid grid-cols-2 gap-2">
                {/* Mode 1: Freelance */}
                <button
                  type="button"
                  onClick={() => {
                    setTopMode('freelance');
                    setActiveTab('gmail');
                  }}
                  className={`p-2 rounded-xl border flex flex-col items-center justify-center text-center transition-all cursor-pointer ${
                    topMode === 'freelance'
                      ? 'bg-amber-500/20 border-amber-500/50 text-amber-300 shadow-md ring-1 ring-amber-400/40'
                      : 'bg-neutral-900/60 border-[#262626] text-neutral-400 hover:text-white hover:bg-neutral-900'
                  }`}
                  id="mode-freelance-btn"
                >
                  <Briefcase className="w-3.5 h-3.5 mb-1 text-amber-400" />
                  <span className="text-[11px] font-bold leading-none">1. Freelance</span>
                  <span className="text-[9px] text-neutral-500 mt-0.5">Database Full</span>
                </button>

                {/* Mode 2: Office */}
                <button
                  type="button"
                  onClick={() => {
                    setTopMode('office');
                    setActiveTab('office-jobs');
                  }}
                  className={`p-2 rounded-xl border flex flex-col items-center justify-center text-center transition-all cursor-pointer ${
                    topMode === 'office'
                      ? 'bg-blue-600/25 border-blue-500/50 text-blue-300 shadow-md ring-1 ring-blue-400/40'
                      : 'bg-neutral-900/60 border-[#262626] text-neutral-400 hover:text-white hover:bg-neutral-900'
                  }`}
                  id="mode-office-btn"
                >
                  <Building2 className="w-3.5 h-3.5 mb-1 text-blue-400" />
                  <span className="text-[11px] font-bold leading-none">2. Office</span>
                  <span className="text-[9px] text-neutral-500 mt-0.5">Tugas Kantor</span>
                </button>

                {/* Mode 3: Project Dev */}
                <button
                  type="button"
                  onClick={() => {
                    setTopMode('project-dev');
                    setActiveTab('project-dev-all');
                  }}
                  className={`p-2 rounded-xl border flex flex-col items-center justify-center text-center transition-all cursor-pointer ${
                    topMode === 'project-dev'
                      ? 'bg-purple-600/25 border-purple-500/50 text-purple-300 shadow-md ring-1 ring-purple-400/40'
                      : 'bg-neutral-900/60 border-[#262626] text-neutral-400 hover:text-white hover:bg-neutral-900'
                  }`}
                  id="mode-project-dev-btn"
                >
                  <Code2 className="w-3.5 h-3.5 mb-1 text-purple-400" />
                  <span className="text-[11px] font-bold leading-none">3. Project Dev</span>
                  <span className="text-[9px] text-neutral-500 mt-0.5">Bug, Ide, Maint</span>
                </button>

                {/* Mode 4: Digital Produk */}
                <button
                  type="button"
                  onClick={() => {
                    setTopMode('digital-product');
                    setActiveTab('digital-product-all');
                  }}
                  className={`p-2 rounded-xl border flex flex-col items-center justify-center text-center transition-all cursor-pointer ${
                    topMode === 'digital-product'
                      ? 'bg-emerald-600/25 border-emerald-500/50 text-emerald-300 shadow-md ring-1 ring-emerald-400/40'
                      : 'bg-neutral-900/60 border-[#262626] text-neutral-400 hover:text-white hover:bg-neutral-900'
                  }`}
                  id="mode-digital-product-btn"
                >
                  <ShoppingBag className="w-3.5 h-3.5 mb-1 text-emerald-400" />
                  <span className="text-[11px] font-bold leading-none">4. Digital Produk</span>
                  <span className="text-[9px] text-neutral-500 mt-0.5">Jadwal &amp; Rilis</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="py-3 border-b border-[#262626] flex flex-col items-center gap-2">
              <button
                onClick={() => {
                  setTopMode('freelance');
                  setActiveTab('gmail');
                }}
                className={`p-2 rounded-xl border ${
                  topMode === 'freelance' ? 'bg-amber-500/20 border-amber-500/50 text-amber-400' : 'bg-neutral-900 text-neutral-400'
                }`}
                title="1. Freelance Mode"
              >
                <Briefcase className="w-4 h-4" />
              </button>
              <button
                onClick={() => {
                  setTopMode('office');
                  setActiveTab('office-jobs');
                }}
                className={`p-2 rounded-xl border ${
                  topMode === 'office' ? 'bg-blue-600/20 border-blue-500/50 text-blue-400' : 'bg-neutral-900 text-neutral-400'
                }`}
                title="2. Office Mode"
              >
                <Building2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => {
                  setTopMode('project-dev');
                  setActiveTab('project-dev-all');
                }}
                className={`p-2 rounded-xl border ${
                  topMode === 'project-dev' ? 'bg-purple-600/20 border-purple-500/50 text-purple-400' : 'bg-neutral-900 text-neutral-400'
                }`}
                title="3. Project Dev Mode"
              >
                <Code2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => {
                  setTopMode('digital-product');
                  setActiveTab('digital-product-all');
                }}
                className={`p-2 rounded-xl border ${
                  topMode === 'digital-product' ? 'bg-emerald-600/20 border-emerald-500/50 text-emerald-400' : 'bg-neutral-900 text-neutral-400'
                }`}
                title="4. Digital Produk Mode"
              >
                <ShoppingBag className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Navigation Menu Links */}
          <div className="p-3 space-y-1 overflow-y-auto max-h-[calc(100vh-280px)]">
            {!collapsed && (
              <div className="px-2 py-1 text-[10px] font-mono font-bold text-neutral-500 uppercase tracking-widest flex items-center justify-between">
                <span>
                  Menu {
                    topMode === 'freelance' 
                      ? 'Freelance Studio' 
                      : topMode === 'office' 
                      ? 'Daftar Kantor' 
                      : topMode === 'project-dev' 
                      ? 'Project Dev' 
                      : 'Digital Produk'
                  }
                </span>
                <span className="text-amber-400 font-normal">{currentTabs.length} Tab</span>
              </div>
            )}

            {currentTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                    setMobileOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-neutral-800 border border-[#383838] text-white shadow-md'
                      : 'text-neutral-400 hover:text-white hover:bg-neutral-900/60'
                  }`}
                  id={`sidebar-tab-${tab.id}-btn`}
                  title={tab.label}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? (topMode === 'office' ? 'text-blue-400' : 'text-amber-400') : 'text-neutral-500'}`} />
                    {!collapsed && (
                      <span className="truncate">{tab.label}</span>
                    )}
                  </div>

                  {!collapsed && (
                    <div className="flex items-center gap-1 shrink-0">
                      {tab.isHighlight && (
                        <span className="text-[9px] font-black uppercase px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
                          {tab.highlightBadge}
                        </span>
                      )}
                      {tab.count !== undefined && (
                        <span className={`px-1.5 py-0.2 rounded text-[10px] font-mono border ${
                          tab.countColor || (isActive ? 'bg-neutral-900 text-amber-300 border-neutral-700' : 'bg-neutral-950 text-neutral-500 border-[#262626]')
                        }`}>
                          {tab.count}
                        </span>
                      )}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Sidebar Footer & Actions Toolbar */}
        <div className="p-3 border-t border-[#262626] bg-neutral-950 space-y-2">
          {/* Kurs Ticker in expanded sidebar */}
          {!collapsed && (
            <div className="px-3 py-2 rounded-xl bg-neutral-900 border border-[#262626] text-xs flex items-center justify-between">
              <span className="text-[10px] font-bold text-neutral-500 uppercase">Kurs USD:</span>
              <span className="font-mono font-bold text-emerald-400">{formatCurrency(appData.settings.usdToIdrRate, 'IDR')}</span>
            </div>
          )}

          {/* Quick Add Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setQuickAddOpen(!quickAddOpen)}
              className={`w-full py-2 px-3 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-neutral-950 rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-md cursor-pointer ${
                collapsed ? 'p-2.5' : ''
              }`}
              id="sidebar-quick-add-btn"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              {!collapsed && <span>+ Tambah Data</span>}
            </button>

            <AnimatePresence>
              {quickAddOpen && (
                <>
                  <div className="fixed inset-0 z-20" onClick={() => setQuickAddOpen(false)} />
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95, y: -4 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -4 }}
                    className="absolute bottom-12 left-0 w-60 bg-[#141414] text-[#E5E5E5] rounded-xl shadow-2xl border border-[#262626] py-1.5 z-30 space-y-0.5"
                  >
                    <div className="px-3 py-1 text-[10px] font-bold text-neutral-500 uppercase border-b border-[#262626] mb-1 flex items-center justify-between">
                      <span>Aksi Cepat Data</span>
                      <Sparkles className="w-3 h-3 text-amber-400" />
                    </div>

                    <button
                      onClick={() => { setQuickAddOpen(false); onQuickAdd('office'); }}
                      className="w-full text-left px-3 py-1.5 text-xs hover:bg-neutral-800 flex items-center gap-2.5 text-blue-300 font-bold"
                    >
                      <Building2 className="w-3.5 h-3.5 text-blue-400" />
                      <span>Pekerjaan Kantor Baru</span>
                    </button>

                    <button
                      onClick={() => { setQuickAddOpen(false); onQuickAdd('dev-bug'); }}
                      className="w-full text-left px-3 py-1.5 text-xs hover:bg-neutral-800 flex items-center gap-2.5 text-rose-300 font-bold"
                    >
                      <Bug className="w-3.5 h-3.5 text-rose-400" />
                      <span>Lapor Bug Baru (Dev)</span>
                    </button>

                    <button
                      onClick={() => { setQuickAddOpen(false); onQuickAdd('dev-idea'); }}
                      className="w-full text-left px-3 py-1.5 text-xs hover:bg-neutral-800 flex items-center gap-2.5 text-amber-300 font-bold"
                    >
                      <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
                      <span>Ide / Konsep Fitur Baru (Dev)</span>
                    </button>

                    <button
                      onClick={() => { setQuickAddOpen(false); onQuickAdd('dev-maint'); }}
                      className="w-full text-left px-3 py-1.5 text-xs hover:bg-neutral-800 flex items-center gap-2.5 text-cyan-300 font-bold"
                    >
                      <Wrench className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Maintenance / Perbaikan (Dev)</span>
                    </button>

                    <button
                      onClick={() => { setQuickAddOpen(false); onQuickAdd('digital-product'); }}
                      className="w-full text-left px-3 py-1.5 text-xs hover:bg-neutral-800 flex items-center gap-2.5 text-emerald-300 font-bold"
                    >
                      <ShoppingBag className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Rilis Produk Digital Baru</span>
                    </button>

                    <button
                      onClick={() => { setQuickAddOpen(false); onQuickAdd('gmail'); }}
                      className="w-full text-left px-3 py-1.5 text-xs hover:bg-neutral-800 flex items-center gap-2.5 text-neutral-200"
                    >
                      <Mail className="w-3.5 h-3.5 text-rose-400" />
                      <span>Master Gmail Baru</span>
                    </button>

                    <button
                      onClick={() => { setQuickAddOpen(false); onQuickAdd('platform'); }}
                      className="w-full text-left px-3 py-1.5 text-xs hover:bg-neutral-800 flex items-center gap-2.5 text-neutral-200"
                    >
                      <Layers className="w-3.5 h-3.5 text-sky-400" />
                      <span>Akun Platform Baru</span>
                    </button>

                    <button
                      onClick={() => { setQuickAddOpen(false); onQuickAdd('note'); }}
                      className="w-full text-left px-3 py-1.5 text-xs hover:bg-neutral-800 flex items-center gap-2.5 text-neutral-200"
                    >
                      <StickyNote className="w-3.5 h-3.5 text-amber-400" />
                      <span>Catatan / SOP Baru</span>
                    </button>

                    <button
                      onClick={() => { setQuickAddOpen(false); onQuickAdd('income'); }}
                      className="w-full text-left px-3 py-1.5 text-xs hover:bg-neutral-800 flex items-center gap-2.5 text-neutral-200"
                    >
                      <CircleDollarSign className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Catat Pemasukan</span>
                    </button>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>

          {/* Bottom Icons Toolbar */}
          <div className="flex items-center justify-between pt-1">
            {/* Bell Notifications */}
            <button
              onClick={onOpenNotifications}
              className="relative p-2 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-900 cursor-pointer"
              title="Notifikasi & Pengingat"
            >
              <Bell className="w-4 h-4" />
              {totalUrgent > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-4 h-4 px-1 bg-amber-500 text-neutral-950 text-[9px] font-black rounded-full flex items-center justify-center">
                  {totalUrgent}
                </span>
              )}
            </button>

            {/* Export Excel */}
            {onExportAll && (
              <button
                onClick={onExportAll}
                className="p-2 rounded-lg text-neutral-400 hover:text-emerald-400 hover:bg-neutral-900 cursor-pointer"
                title="Export Excel (.xlsx)"
              >
                <FileSpreadsheet className="w-4 h-4" />
              </button>
            )}

            {/* Settings Modal */}
            <button
              onClick={onOpenBackupModal}
              className="p-2 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-900 cursor-pointer"
              title="Pengaturan & Backup"
            >
              <Settings2 className="w-4 h-4" />
            </button>

            {/* Lock App */}
            {onLockApp && (
              <button
                onClick={onLockApp}
                className="p-2 rounded-lg text-neutral-400 hover:text-amber-400 hover:bg-neutral-900 cursor-pointer"
                title="Kunci Brankas Security Gate"
              >
                <Lock className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </aside>
    </>
  );
};
