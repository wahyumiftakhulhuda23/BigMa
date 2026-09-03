import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  AppData, 
  GmailAccount, 
  PlatformAccount, 
  RealtimeFinance, 
  IncomeRecord, 
  ProjectDeadline, 
  AppSettings 
} from './types';
import { loadAppData, saveAppData } from './utils/storage';
import { exportFullStudioWorkbook } from './utils/exportUtils';
import { getDeadlineUrgency } from './utils/formatters';

// Navigation and Modals
import { Navbar } from './components/Navbar';
import { NotificationDrawer } from './components/NotificationDrawer';
import { BackupModal } from './components/BackupModal';

// Five Core Functional Modules
import { GmailTable } from './components/GmailDatabase/GmailTable';
import { GmailModal } from './components/GmailDatabase/GmailModal';

import { PlatformAccountsView } from './components/PlatformAccounts/PlatformAccountsView';
import { PlatformAccountModal } from './components/PlatformAccounts/PlatformAccountModal';

import { RealtimeFinanceView } from './components/RealtimeFinance/RealtimeFinanceView';
import { FinanceModal } from './components/RealtimeFinance/FinanceModal';

import { IncomeDatabaseView } from './components/IncomeDatabase/IncomeDatabaseView';
import { IncomeModal } from './components/IncomeDatabase/IncomeModal';

import { CalendarView } from './components/CalendarDeadlines/CalendarView';
import { DeadlineModal } from './components/CalendarDeadlines/DeadlineModal';

export default function App() {
  const [appData, setAppData] = useState<AppData>(() => loadAppData());
  const [activeTab, setActiveTab] = useState<'gmail' | 'platforms' | 'finance' | 'income' | 'calendar'>('gmail');

  // Drawer & Backup Modals
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isBackupOpen, setIsBackupOpen] = useState(false);

  // 1. Gmail Modal state
  const [isGmailModalOpen, setIsGmailModalOpen] = useState(false);
  const [editingGmail, setEditingGmail] = useState<GmailAccount | null>(null);

  // 2. Platform Account Modal state
  const [isPlatformModalOpen, setIsPlatformModalOpen] = useState(false);
  const [editingPlatform, setEditingPlatform] = useState<PlatformAccount | null>(null);
  const [preselectedPlatformName, setPreselectedPlatformName] = useState<string | undefined>();
  const [preselectedGmailId, setPreselectedGmailId] = useState<string | undefined>();

  // 3. Finance Modal state
  const [isFinanceModalOpen, setIsFinanceModalOpen] = useState(false);
  const [editingFinance, setEditingFinance] = useState<RealtimeFinance | null>(null);
  const [preselectedFinancePlatformId, setPreselectedFinancePlatformId] = useState<string | undefined>();

  // 4. Income Modal state
  const [isIncomeModalOpen, setIsIncomeModalOpen] = useState(false);
  const [editingIncome, setEditingIncome] = useState<IncomeRecord | null>(null);
  const [prefillIncomeData, setPrefillIncomeData] = useState<{
    platformAccountId?: string;
    amount?: number;
    currency?: 'USD' | 'IDR' | 'EUR';
  }>({});

  // 5. Deadline Modal state
  const [isDeadlineModalOpen, setIsDeadlineModalOpen] = useState(false);
  const [editingDeadline, setEditingDeadline] = useState<ProjectDeadline | null>(null);
  const [preselectedDeadlineDate, setPreselectedDeadlineDate] = useState<string | undefined>();

  // Persist whenever appData updates
  useEffect(() => {
    saveAppData(appData);
  }, [appData]);

  // Urgent deadlines count for bell badge in Navbar
  const urgentDeadlineCount = useMemo(() => {
    return appData.deadlines.filter(d => {
      if (d.status === 'Selesai') return false;
      const urgency = getDeadlineUrgency(d.dueDate, d.status);
      return urgency.isOverdue || urgency.daysRemaining <= 3;
    }).length;
  }, [appData.deadlines]);

  // ==========================================
  // CRUD HANDLERS FOR GMAIL DATABASE
  // ==========================================
  const handleSaveGmail = (gmail: GmailAccount) => {
    setAppData(prev => {
      const exists = prev.gmails.some(g => g.id === gmail.id);
      const newGmails = exists 
        ? prev.gmails.map(g => (g.id === gmail.id ? gmail : g))
        : [gmail, ...prev.gmails];
      return { ...prev, gmails: newGmails };
    });
  };

  const handleDeleteGmail = (id: string) => {
    setAppData(prev => {
      // Also unassign or keep platform accounts consistent
      return {
        ...prev,
        gmails: prev.gmails.filter(g => g.id !== id),
      };
    });
  };

  // ==========================================
  // CRUD HANDLERS FOR PLATFORM ACCOUNTS
  // ==========================================
  const handleSavePlatformAccount = (account: PlatformAccount) => {
    setAppData(prev => {
      const exists = prev.platformAccounts.some(p => p.id === account.id);
      const newAccounts = exists
        ? prev.platformAccounts.map(p => (p.id === account.id ? account : p))
        : [account, ...prev.platformAccounts];
      return { ...prev, platformAccounts: newAccounts };
    });
  };

  const handleDeletePlatformAccount = (id: string) => {
    setAppData(prev => {
      return {
        ...prev,
        platformAccounts: prev.platformAccounts.filter(p => p.id !== id),
        realtimeFinances: prev.realtimeFinances.filter(f => f.platformAccountId !== id),
      };
    });
  };

  // ==========================================
  // CRUD HANDLERS FOR REALTIME FINANCE
  // ==========================================
  const handleSaveFinance = (finance: RealtimeFinance) => {
    setAppData(prev => {
      const exists = prev.realtimeFinances.some(f => f.id === finance.id);
      const newFinances = exists
        ? prev.realtimeFinances.map(f => (f.id === finance.id ? finance : f))
        : [finance, ...prev.realtimeFinances];
      return { ...prev, realtimeFinances: newFinances };
    });
  };

  const handleDeleteFinance = (id: string) => {
    setAppData(prev => ({
      ...prev,
      realtimeFinances: prev.realtimeFinances.filter(f => f.id !== id),
    }));
  };

  // Cashout action from Realtime Finance to Income Database
  const handleCashoutToIncome = (finance: RealtimeFinance) => {
    setPrefillIncomeData({
      platformAccountId: finance.platformAccountId,
      amount: finance.availableBalance,
      currency: finance.currency,
    });
    setEditingIncome(null);
    setIsIncomeModalOpen(true);
  };

  // ==========================================
  // CRUD HANDLERS FOR INCOME DATABASE
  // ==========================================
  const handleSaveIncome = (income: IncomeRecord) => {
    setAppData(prev => {
      const exists = prev.incomes.some(i => i.id === income.id);
      const newIncomes = exists
        ? prev.incomes.map(i => (i.id === income.id ? income : i))
        : [income, ...prev.incomes];
      return { ...prev, incomes: newIncomes };
    });
  };

  const handleDeleteIncome = (id: string) => {
    setAppData(prev => ({
      ...prev,
      incomes: prev.incomes.filter(i => i.id !== id),
    }));
  };

  // ==========================================
  // CRUD HANDLERS FOR DEADLINES & CALENDAR
  // ==========================================
  const handleSaveDeadline = (deadline: ProjectDeadline) => {
    setAppData(prev => {
      const exists = prev.deadlines.some(d => d.id === deadline.id);
      const newDeadlines = exists
        ? prev.deadlines.map(d => (d.id === deadline.id ? deadline : d))
        : [deadline, ...prev.deadlines];
      return { ...prev, deadlines: newDeadlines };
    });
  };

  const handleDeleteDeadline = (id: string) => {
    setAppData(prev => ({
      ...prev,
      deadlines: prev.deadlines.filter(d => d.id !== id),
    }));
  };

  const handleToggleDeadlineStatus = (id: string, newStatus: 'Belum Selesai' | 'Dalam Proses' | 'Selesai') => {
    setAppData(prev => ({
      ...prev,
      deadlines: prev.deadlines.map(d => (d.id === id ? { ...d, status: newStatus } : d)),
    }));
  };

  // ==========================================
  // QUICK ADD SHORTCUTS FROM NAVBAR
  // ==========================================
  const handleQuickAdd = (type: 'gmail' | 'platform' | 'finance' | 'income' | 'deadline') => {
    if (type === 'gmail') {
      setEditingGmail(null);
      setIsGmailModalOpen(true);
    } else if (type === 'platform') {
      setEditingPlatform(null);
      setPreselectedPlatformName(undefined);
      setPreselectedGmailId(undefined);
      setIsPlatformModalOpen(true);
    } else if (type === 'finance') {
      setEditingFinance(null);
      setPreselectedFinancePlatformId(undefined);
      setIsFinanceModalOpen(true);
    } else if (type === 'income') {
      setEditingIncome(null);
      setPrefillIncomeData({});
      setIsIncomeModalOpen(true);
    } else if (type === 'deadline') {
      setEditingDeadline(null);
      setPreselectedDeadlineDate(undefined);
      setIsDeadlineModalOpen(true);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex flex-col antialiased text-[#E5E5E5]" id="bigma-studio-root">
      {/* Top Application Navigation Bar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        appData={appData}
        onOpenNotifications={() => setIsNotificationOpen(true)}
        onOpenBackupModal={() => setIsBackupOpen(true)}
        onExportAll={() => exportFullStudioWorkbook(appData)}
        onQuickAdd={handleQuickAdd}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8" id="main-content-area">
        <AnimatePresence mode="wait">
          {/* Module 1: Database Gmail */}
          {activeTab === 'gmail' && (
            <motion.div
              key="gmail"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              <GmailTable
                gmails={appData.gmails}
                platformAccounts={appData.platformAccounts}
                onAddGmail={() => {
                  setEditingGmail(null);
                  setIsGmailModalOpen(true);
                }}
                onEditGmail={(gmail) => {
                  setEditingGmail(gmail);
                  setIsGmailModalOpen(true);
                }}
                onDeleteGmail={handleDeleteGmail}
                onManagePlatformForGmail={(gmailId) => {
                  setPreselectedGmailId(gmailId);
                  setActiveTab('platforms');
                }}
              />
            </motion.div>
          )}

          {/* Module 2: Kelola Akun (Platform & Kredensial Khusus) */}
          {activeTab === 'platforms' && (
            <motion.div
              key="platforms"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              <PlatformAccountsView
                platformAccounts={appData.platformAccounts}
                gmails={appData.gmails}
                onAddAccount={(platform) => {
                  setEditingPlatform(null);
                  setPreselectedPlatformName(typeof platform === 'string' ? platform : undefined);
                  setPreselectedGmailId(undefined);
                  setIsPlatformModalOpen(true);
                }}
                onEditAccount={(acc) => {
                  setEditingPlatform(acc);
                  setPreselectedPlatformName(undefined);
                  setPreselectedGmailId(undefined);
                  setIsPlatformModalOpen(true);
                }}
                onDeleteAccount={handleDeletePlatformAccount}
                onQuickUpdateFinance={(platId) => {
                  setPreselectedFinancePlatformId(platId);
                  setActiveTab('finance');
                }}
                onQuickAddIncome={(platId) => {
                  setPrefillIncomeData({ platformAccountId: platId });
                  setActiveTab('income');
                }}
              />
            </motion.div>
          )}

          {/* Module 3: Keuangan Realtime */}
          {activeTab === 'finance' && (
            <motion.div
              key="finance"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              <RealtimeFinanceView
                finances={appData.realtimeFinances}
                platformAccounts={appData.platformAccounts}
                gmails={appData.gmails}
                settings={appData.settings}
                onAddFinance={() => {
                  setEditingFinance(null);
                  setPreselectedFinancePlatformId(undefined);
                  setIsFinanceModalOpen(true);
                }}
                onEditFinance={(fin) => {
                  setEditingFinance(fin);
                  setIsFinanceModalOpen(true);
                }}
                onDeleteFinance={handleDeleteFinance}
                onCashoutToIncome={handleCashoutToIncome}
              />
            </motion.div>
          )}

          {/* Module 4: Database Pemasukan & Grafik Bulanan */}
          {activeTab === 'income' && (
            <motion.div
              key="income"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              <IncomeDatabaseView
                incomes={appData.incomes}
                platformAccounts={appData.platformAccounts}
                settings={appData.settings}
                onAddIncome={() => {
                  setEditingIncome(null);
                  setPrefillIncomeData({});
                  setIsIncomeModalOpen(true);
                }}
                onEditIncome={(inc) => {
                  setEditingIncome(inc);
                  setIsIncomeModalOpen(true);
                }}
                onDeleteIncome={handleDeleteIncome}
              />
            </motion.div>
          )}

          {/* Module 5: Kalender & Tenggat Waktu Proyek */}
          {activeTab === 'calendar' && (
            <motion.div
              key="calendar"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              <CalendarView
                deadlines={appData.deadlines}
                platformAccounts={appData.platformAccounts}
                onAddDeadline={(preDate) => {
                  setEditingDeadline(null);
                  setPreselectedDeadlineDate(preDate);
                  setIsDeadlineModalOpen(true);
                }}
                onEditDeadline={(dl) => {
                  setEditingDeadline(dl);
                  setIsDeadlineModalOpen(true);
                }}
                onDeleteDeadline={handleDeleteDeadline}
                onToggleStatus={handleToggleDeadlineStatus}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer with BigMA Account Manajement branding */}
      <footer className="border-t border-[#262626] bg-neutral-950 py-4 px-6 text-xs text-neutral-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center space-x-3 text-[11px] text-neutral-400 font-sans">
            <span className="text-white font-black tracking-tight">Big<span className="text-amber-400">MA</span></span>
            <span className="text-neutral-600">•</span>
            <span className="font-semibold text-neutral-400 uppercase text-[10px] tracking-wider">Account Manajement</span>
            <span className="text-neutral-600">•</span>
            <span className="text-emerald-400 flex items-center gap-1 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              Sistem Aktif
            </span>
          </div>
          <div className="text-[10px] text-neutral-500 tracking-wider font-mono">
            &copy; 2026 BigMA &bull; Excel, PDF &amp; JSON Storage Vault
          </div>
        </div>
      </footer>

      {/* ==================================================== */}
      {/* ALL INTERACTIVE MODALS & DRAWERS */}
      {/* ==================================================== */}

      {/* 1. Gmail Modal */}
      <GmailModal
        isOpen={isGmailModalOpen}
        onClose={() => setIsGmailModalOpen(false)}
        onSave={handleSaveGmail}
        initialData={editingGmail}
      />

      {/* 2. Platform Account Modal */}
      <PlatformAccountModal
        isOpen={isPlatformModalOpen}
        onClose={() => setIsPlatformModalOpen(false)}
        onSave={handleSavePlatformAccount}
        gmails={appData.gmails}
        initialData={editingPlatform}
        preselectedPlatform={preselectedPlatformName}
        preselectedGmailId={preselectedGmailId}
      />

      {/* 3. Realtime Finance Modal */}
      <FinanceModal
        isOpen={isFinanceModalOpen}
        onClose={() => setIsFinanceModalOpen(false)}
        onSave={handleSaveFinance}
        platformAccounts={appData.platformAccounts}
        gmails={appData.gmails}
        settings={appData.settings}
        initialData={editingFinance}
        preselectedPlatformAccountId={preselectedFinancePlatformId}
      />

      {/* 4. Income Record Modal */}
      <IncomeModal
        isOpen={isIncomeModalOpen}
        onClose={() => setIsIncomeModalOpen(false)}
        onSave={handleSaveIncome}
        platformAccounts={appData.platformAccounts}
        settings={appData.settings}
        initialData={editingIncome}
        preselectedPlatformAccountId={prefillIncomeData.platformAccountId}
        prefillAmount={prefillIncomeData.amount}
        prefillCurrency={prefillIncomeData.currency}
      />

      {/* 5. Project Deadline Modal */}
      <DeadlineModal
        isOpen={isDeadlineModalOpen}
        onClose={() => setIsDeadlineModalOpen(false)}
        onSave={handleSaveDeadline}
        platformAccounts={appData.platformAccounts}
        initialData={editingDeadline}
        preselectedDate={preselectedDeadlineDate}
      />

      {/* Automated Deadline Notification Drawer */}
      <NotificationDrawer
        isOpen={isNotificationOpen}
        onClose={() => setIsNotificationOpen(false)}
        deadlines={appData.deadlines}
        platformAccounts={appData.platformAccounts}
        onToggleStatus={handleToggleDeadlineStatus}
        onOpenDeadlineModal={(dl) => {
          setIsNotificationOpen(false);
          setEditingDeadline(dl);
          setIsDeadlineModalOpen(true);
        }}
      />

      {/* Backup & Settings Modal */}
      <BackupModal
        isOpen={isBackupOpen}
        onClose={() => setIsBackupOpen(false)}
        appData={appData}
        onRestoreData={(newData) => setAppData(newData)}
        onSaveSettings={(newSettings) => setAppData(prev => ({ ...prev, settings: newSettings }))}
      />
    </div>
  );
}
