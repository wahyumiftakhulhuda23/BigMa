import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  AppData, 
  GmailAccount, 
  PlatformAccount, 
  AccountNote,
  RealtimeFinance, 
  IncomeRecord, 
  ProjectDeadline, 
  AppSettings,
  ActiveTab 
} from './types';
import { loadAppData, saveAppData } from './utils/storage';
import { 
  saveUserAppDataToCloud, 
  loadUserAppDataFromCloud, 
  subscribeUserAppDataFromCloud 
} from './utils/cloudStorage';
import { exportFullStudioWorkbook } from './utils/exportUtils';
import { getDeadlineUrgency } from './utils/formatters';
import { auth, onAuthStateChanged, fbSignOut, User } from './lib/firebase';

// Security & Authentication Screens
import { AuthScreen } from './components/Security/AuthScreen';
import { ThreadLoginScreen } from './components/Security/ThreadLoginScreen';

// Navigation and Modals
import { Navbar } from './components/Navbar';
import { NotificationDrawer } from './components/NotificationDrawer';
import { BackupModal } from './components/BackupModal';

// Core Functional Modules
import { GmailTable } from './components/GmailDatabase/GmailTable';
import { GmailModal } from './components/GmailDatabase/GmailModal';

import { PlatformAccountsView } from './components/PlatformAccounts/PlatformAccountsView';
import { PlatformAccountModal } from './components/PlatformAccounts/PlatformAccountModal';

import { AccountNotesView } from './components/AccountNotes/AccountNotesView';
import { AccountNoteModal } from './components/AccountNotes/AccountNoteModal';

import { RealtimeFinanceView } from './components/RealtimeFinance/RealtimeFinanceView';
import { FinanceModal } from './components/RealtimeFinance/FinanceModal';

import { IncomeDatabaseView } from './components/IncomeDatabase/IncomeDatabaseView';
import { IncomeModal } from './components/IncomeDatabase/IncomeModal';

import { CalendarView } from './components/CalendarDeadlines/CalendarView';
import { DeadlineModal } from './components/CalendarDeadlines/DeadlineModal';
import { Lock, Cloud, ShieldCheck, Sparkles, RefreshCw } from 'lucide-react';

export default function App() {
  // 1. Firebase Authentication State
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState<boolean>(true);

  // 2. Thread Quiz Security Gate (Unlocks after successful yarn pairing for current session)
  const [isThreadUnlocked, setIsThreadUnlocked] = useState<boolean>(() => {
    return sessionStorage.getItem('bigma_yarn_unlocked') === 'true';
  });

  // 3. Core App Data State
  const [appData, setAppData] = useState<AppData>(() => loadAppData());
  const [activeTab, setActiveTab] = useState<ActiveTab>('gmail');
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);

  // Drawer & Modals
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isBackupOpen, setIsBackupOpen] = useState(false);

  // Modals state
  const [isGmailModalOpen, setIsGmailModalOpen] = useState(false);
  const [editingGmail, setEditingGmail] = useState<GmailAccount | null>(null);

  const [isPlatformModalOpen, setIsPlatformModalOpen] = useState(false);
  const [editingPlatform, setEditingPlatform] = useState<PlatformAccount | null>(null);
  const [preselectedPlatformName, setPreselectedPlatformName] = useState<string | undefined>();
  const [preselectedGmailId, setPreselectedGmailId] = useState<string | undefined>();

  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<AccountNote | null>(null);
  const [preselectedNotePlatformId, setPreselectedNotePlatformId] = useState<string | undefined>();

  const [isFinanceModalOpen, setIsFinanceModalOpen] = useState(false);
  const [editingFinance, setEditingFinance] = useState<RealtimeFinance | null>(null);
  const [preselectedFinancePlatformId, setPreselectedFinancePlatformId] = useState<string | undefined>();

  const [isIncomeModalOpen, setIsIncomeModalOpen] = useState(false);
  const [editingIncome, setEditingIncome] = useState<IncomeRecord | null>(null);
  const [prefillIncomeData, setPrefillIncomeData] = useState<{
    platformAccountId?: string;
    amount?: number;
    currency?: 'USD' | 'IDR' | 'EUR';
  }>({});

  const [isDeadlineModalOpen, setIsDeadlineModalOpen] = useState(false);
  const [editingDeadline, setEditingDeadline] = useState<ProjectDeadline | null>(null);
  const [preselectedDeadlineDate, setPreselectedDeadlineDate] = useState<string | undefined>();

  // ----------------------------------------------------
  // Listen to Firebase Auth state
  // ----------------------------------------------------
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        // Fetch cloud data for this user
        try {
          setIsSyncing(true);
          const cloudData = await loadUserAppDataFromCloud(user.uid);
          if (cloudData) {
            setAppData(cloudData);
            saveAppData(cloudData);
          } else {
            // New user or no cloud data yet: sync initial/local data to user's Firestore cloud
            const currentLocal = loadAppData();
            await saveUserAppDataToCloud(user.uid, currentLocal);
          }
          setLastSyncTime(new Date());
        } catch (err) {
          console.error('Error fetching initial cloud data:', err);
        } finally {
          setIsSyncing(false);
        }
      } else {
        // If user logged out, lock thread quiz and clear session
        sessionStorage.removeItem('bigma_yarn_unlocked');
        setIsThreadUnlocked(false);
      }
      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // ----------------------------------------------------
  // Real-time Firestore Remote Sync Subscription
  // ----------------------------------------------------
  useEffect(() => {
    if (!currentUser?.uid) return;

    const unsubscribe = subscribeUserAppDataFromCloud(currentUser.uid, (remoteData) => {
      // Update local state when changes happen from another device
      setAppData(remoteData);
      saveAppData(remoteData);
      setLastSyncTime(new Date());
    });

    return () => unsubscribe();
  }, [currentUser?.uid]);

  // Helper to persist state both locally and to Firestore Cloud
  const updateAndSyncData = useCallback((updater: (prev: AppData) => AppData) => {
    setAppData(prev => {
      const nextData = updater(prev);
      saveAppData(nextData);
      if (currentUser?.uid) {
        saveUserAppDataToCloud(currentUser.uid, nextData).then(() => {
          setLastSyncTime(new Date());
        });
      }
      return nextData;
    });
  }, [currentUser?.uid]);

  // Manual trigger for Cloud Sync
  const handleManualCloudSync = async (): Promise<boolean> => {
    if (!currentUser?.uid) return false;
    setIsSyncing(true);
    try {
      const success = await saveUserAppDataToCloud(currentUser.uid, appData);
      if (success) {
        setLastSyncTime(new Date());
      }
      return success;
    } finally {
      setIsSyncing(false);
    }
  };

  // ----------------------------------------------------
  // Auth & Security Handlers
  // ----------------------------------------------------
  const handleThreadUnlock = () => {
    sessionStorage.setItem('bigma_yarn_unlocked', 'true');
    setIsThreadUnlocked(true);
  };

  const handleLockSession = () => {
    sessionStorage.removeItem('bigma_yarn_unlocked');
    setIsThreadUnlocked(false);
  };

  const handleSignOut = async () => {
    sessionStorage.removeItem('bigma_yarn_unlocked');
    setIsThreadUnlocked(false);
    await fbSignOut(auth);
  };

  // Urgent notifications count
  const urgentCount = useMemo(() => {
    const deadlineCount = appData.deadlines.filter(d => {
      if (d.status === 'Selesai') return false;
      const urgency = getDeadlineUrgency(d.dueDate, d.status);
      return urgency.isOverdue || urgency.daysRemaining <= 3;
    }).length;

    const noteCount = (appData.notes || []).filter(n => {
      if (!n.hasReminder || !n.reminderDate || n.reminderStatus === 'Selesai') return false;
      const urgency = getDeadlineUrgency(n.reminderDate, 'Belum Selesai');
      return urgency.isOverdue || urgency.daysRemaining <= 3;
    }).length;

    return deadlineCount + noteCount;
  }, [appData.deadlines, appData.notes]);

  // ==========================================
  // CRUD HANDLERS FOR GMAIL DATABASE
  // ==========================================
  const handleSaveGmail = (gmail: GmailAccount) => {
    updateAndSyncData(prev => {
      const exists = prev.gmails.some(g => g.id === gmail.id);
      const newGmails = exists 
        ? prev.gmails.map(g => (g.id === gmail.id ? gmail : g))
        : [gmail, ...prev.gmails];
      return { ...prev, gmails: newGmails };
    });
  };

  const handleDeleteGmail = (id: string) => {
    updateAndSyncData(prev => ({
      ...prev,
      gmails: prev.gmails.filter(g => g.id !== id),
    }));
  };

  // ==========================================
  // CRUD HANDLERS FOR PLATFORM ACCOUNTS
  // ==========================================
  const handleSavePlatformAccount = (account: PlatformAccount) => {
    updateAndSyncData(prev => {
      const exists = prev.platformAccounts.some(p => p.id === account.id);
      const newAccounts = exists
        ? prev.platformAccounts.map(p => (p.id === account.id ? account : p))
        : [account, ...prev.platformAccounts];
      return { ...prev, platformAccounts: newAccounts };
    });
  };

  const handleDeletePlatformAccount = (id: string) => {
    updateAndSyncData(prev => ({
      ...prev,
      platformAccounts: prev.platformAccounts.filter(p => p.id !== id),
      notes: (prev.notes || []).filter(n => n.platformAccountId !== id),
      realtimeFinances: prev.realtimeFinances.filter(f => f.platformAccountId !== id),
      incomes: prev.incomes.filter(i => i.platformAccountId !== id),
      deadlines: prev.deadlines.filter(d => d.platformAccountId !== id),
    }));
  };

  // ==========================================
  // CRUD HANDLERS FOR ACCOUNT NOTES & REMINDERS
  // ==========================================
  const handleSaveNote = (note: AccountNote) => {
    updateAndSyncData(prev => {
      const currentNotes = prev.notes || [];
      const exists = currentNotes.some(n => n.id === note.id);
      const newNotes = exists
        ? currentNotes.map(n => (n.id === note.id ? note : n))
        : [note, ...currentNotes];
      return { ...prev, notes: newNotes };
    });
  };

  const handleDeleteNote = (id: string) => {
    updateAndSyncData(prev => ({
      ...prev,
      notes: (prev.notes || []).filter(n => n.id !== id),
    }));
  };

  const handleToggleNoteReminderStatus = (id: string, status: 'Pending' | 'Selesai') => {
    updateAndSyncData(prev => ({
      ...prev,
      notes: (prev.notes || []).map(n => n.id === id ? { ...n, reminderStatus: status } : n),
    }));
  };

  // ==========================================
  // CRUD HANDLERS FOR REALTIME FINANCE
  // ==========================================
  const handleSaveFinance = (finance: RealtimeFinance) => {
    updateAndSyncData(prev => {
      const exists = prev.realtimeFinances.some(f => f.id === finance.id);
      const newFinances = exists
        ? prev.realtimeFinances.map(f => (f.id === finance.id ? finance : f))
        : [finance, ...prev.realtimeFinances];
      return { ...prev, realtimeFinances: newFinances };
    });
  };

  const handleDeleteFinance = (id: string) => {
    updateAndSyncData(prev => ({
      ...prev,
      realtimeFinances: prev.realtimeFinances.filter(f => f.id !== id),
    }));
  };

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
    updateAndSyncData(prev => {
      const exists = prev.incomes.some(i => i.id === income.id);
      const newIncomes = exists
        ? prev.incomes.map(i => (i.id === income.id ? income : i))
        : [income, ...prev.incomes];
      return { ...prev, incomes: newIncomes };
    });
  };

  const handleDeleteIncome = (id: string) => {
    updateAndSyncData(prev => ({
      ...prev,
      incomes: prev.incomes.filter(i => i.id !== id),
    }));
  };

  // ==========================================
  // CRUD HANDLERS FOR DEADLINES & CALENDAR
  // ==========================================
  const handleSaveDeadline = (deadline: ProjectDeadline) => {
    updateAndSyncData(prev => {
      const exists = prev.deadlines.some(d => d.id === deadline.id);
      const newDeadlines = exists
        ? prev.deadlines.map(d => (d.id === deadline.id ? deadline : d))
        : [deadline, ...prev.deadlines];
      return { ...prev, deadlines: newDeadlines };
    });
  };

  const handleDeleteDeadline = (id: string) => {
    updateAndSyncData(prev => ({
      ...prev,
      deadlines: prev.deadlines.filter(d => d.id !== id),
    }));
  };

  const handleToggleDeadlineStatus = (id: string, newStatus: 'Belum Selesai' | 'Sedang Dikerjakan' | 'Selesai') => {
    updateAndSyncData(prev => ({
      ...prev,
      deadlines: prev.deadlines.map(d => (d.id === id ? { ...d, status: newStatus } : d)),
    }));
  };

  // Quick Add from Top Navbar
  const handleQuickAdd = (type: 'gmail' | 'platform' | 'note' | 'finance' | 'income' | 'deadline') => {
    if (type === 'gmail') {
      setEditingGmail(null);
      setIsGmailModalOpen(true);
    } else if (type === 'platform') {
      setEditingPlatform(null);
      setPreselectedPlatformName(undefined);
      setPreselectedGmailId(undefined);
      setIsPlatformModalOpen(true);
    } else if (type === 'note') {
      setEditingNote(null);
      setPreselectedNotePlatformId(undefined);
      setIsNoteModalOpen(true);
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

  // ----------------------------------------------------
  // 1. Initial Authentication Loading Splash
  // ----------------------------------------------------
  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex flex-col items-center justify-center p-4 text-[#E5E5E5] font-sans">
        <div className="w-12 h-12 border-3 border-amber-500/20 border-t-amber-400 rounded-full animate-spin mb-4" />
        <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
          Big<span className="text-amber-400">MA</span> Cloud Vault
        </h2>
        <p className="text-xs text-neutral-500 mt-1 font-mono">Memuat otentikasi & status sinkronisasi...</p>
      </div>
    );
  }

  // ----------------------------------------------------
  // 2. Step 1: User Not Logged In -> Show Auth Screen
  // ----------------------------------------------------
  if (!currentUser) {
    return <AuthScreen onAuthenticated={() => {}} />;
  }

  // ----------------------------------------------------
  // 3. Step 2: User Logged In but Thread Quiz Locked -> Show Thread Security Gate
  // ----------------------------------------------------
  if (!isThreadUnlocked) {
    return (
      <ThreadLoginScreen 
        onUnlock={handleThreadUnlock} 
        onSignOut={handleSignOut}
        userEmail={currentUser.email}
        userName={currentUser.displayName}
      />
    );
  }

  // ----------------------------------------------------
  // 4. Step 3: Main BigMA Studio Application Dashboard
  // ----------------------------------------------------
  return (
    <div className="min-h-screen bg-[#0A0A0A] flex flex-col antialiased text-[#E5E5E5]" id="bigma-studio-root">
      {/* Top Application Navigation Bar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        appData={appData}
        userEmail={currentUser.email}
        userName={currentUser.displayName}
        onSignOut={handleSignOut}
        onLockApp={handleLockSession}
        onOpenNotifications={() => setIsNotificationOpen(true)}
        onOpenBackupModal={() => setIsBackupOpen(true)}
        onExportAll={() => exportFullStudioWorkbook(
          appData.gmails,
          appData.platformAccounts,
          appData.realtimeFinances,
          appData.incomes,
          appData.deadlines
        )}
        onQuickAdd={handleQuickAdd}
      />

      {/* Main Content Area with Transitions */}
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
                onAddPlatformForGmail={(gmailId) => {
                  setEditingPlatform(null);
                  setPreselectedGmailId(gmailId);
                  setPreselectedPlatformName(undefined);
                  setIsPlatformModalOpen(true);
                }}
              />
            </motion.div>
          )}

          {/* Module 2: Kelola Akun Platform */}
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
                onAddAccount={(platformName) => {
                  setEditingPlatform(null);
                  setPreselectedPlatformName(platformName);
                  setPreselectedGmailId(undefined);
                  setIsPlatformModalOpen(true);
                }}
                onEditAccount={(account) => {
                  setEditingPlatform(account);
                  setPreselectedPlatformName(undefined);
                  setPreselectedGmailId(undefined);
                  setIsPlatformModalOpen(true);
                }}
                onDeleteAccount={handleDeletePlatformAccount}
                onAddNoteForAccount={(platformAccountId) => {
                  setEditingNote(null);
                  setPreselectedNotePlatformId(platformAccountId);
                  setIsNoteModalOpen(true);
                }}
                onAddFinanceForAccount={(platformAccountId) => {
                  setEditingFinance(null);
                  setPreselectedFinancePlatformId(platformAccountId);
                  setIsFinanceModalOpen(true);
                }}
              />
            </motion.div>
          )}

          {/* Module 3: Catatan Akun */}
          {activeTab === 'notes' && (
            <motion.div
              key="notes"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              <AccountNotesView
                notes={appData.notes || []}
                platformAccounts={appData.platformAccounts}
                onAddNote={() => {
                  setEditingNote(null);
                  setPreselectedNotePlatformId(undefined);
                  setIsNoteModalOpen(true);
                }}
                onEditNote={(note) => {
                  setEditingNote(note);
                  setPreselectedNotePlatformId(undefined);
                  setIsNoteModalOpen(true);
                }}
                onDeleteNote={handleDeleteNote}
                onToggleReminderStatus={handleToggleNoteReminderStatus}
              />
            </motion.div>
          )}

          {/* Module 4: Keuangan Realtime */}
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
                onEditFinance={(finance) => {
                  setEditingFinance(finance);
                  setPreselectedFinancePlatformId(undefined);
                  setIsFinanceModalOpen(true);
                }}
                onDeleteFinance={handleDeleteFinance}
                onCashoutToIncome={handleCashoutToIncome}
              />
            </motion.div>
          )}

          {/* Module 5: Database Pemasukan */}
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
                onEditIncome={(income) => {
                  setEditingIncome(income);
                  setPrefillIncomeData({});
                  setIsIncomeModalOpen(true);
                }}
                onDeleteIncome={handleDeleteIncome}
              />
            </motion.div>
          )}

          {/* Module 6: Kalender & Deadline */}
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
                onAddDeadline={(dateStr) => {
                  setEditingDeadline(null);
                  setPreselectedDeadlineDate(dateStr);
                  setIsDeadlineModalOpen(true);
                }}
                onEditDeadline={(deadline) => {
                  setEditingDeadline(deadline);
                  setPreselectedDeadlineDate(undefined);
                  setIsDeadlineModalOpen(true);
                }}
                onDeleteDeadline={handleDeleteDeadline}
                onToggleStatus={handleToggleDeadlineStatus}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer info */}
      <footer className="mt-auto border-t border-[#262626] bg-[#0A0A0A] py-4 px-4 sm:px-6 lg:px-8 text-neutral-500 text-xs font-sans">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-bold text-neutral-300">BigMA Studio Account Management</span>
            <span>&bull;</span>
            <span className="text-amber-400 font-mono">Vault v2.4 (Cloud Multi-Device)</span>
          </div>
          <div className="flex items-center gap-4 text-[11px]">
            <span className="flex items-center gap-1 text-emerald-400 font-mono">
              <Cloud className="w-3.5 h-3.5" />
              <span>Firebase Cloud Sync</span>
            </span>
            <span>&bull;</span>
            <button
              onClick={handleLockSession}
              className="text-neutral-400 hover:text-amber-400 flex items-center gap-1 transition-colors cursor-pointer"
            >
              <Lock className="w-3 h-3" />
              <span>Kunci Sesi</span>
            </button>
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

      {/* 3. Account Note Modal */}
      <AccountNoteModal
        isOpen={isNoteModalOpen}
        onClose={() => setIsNoteModalOpen(false)}
        onSave={handleSaveNote}
        platformAccounts={appData.platformAccounts}
        initialData={editingNote}
        preselectedPlatformId={preselectedNotePlatformId}
      />

      {/* 4. Realtime Finance Modal */}
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

      {/* 5. Income Record Modal */}
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

      {/* 6. Project Deadline Modal */}
      <DeadlineModal
        isOpen={isDeadlineModalOpen}
        onClose={() => setIsDeadlineModalOpen(false)}
        onSave={handleSaveDeadline}
        platformAccounts={appData.platformAccounts}
        initialData={editingDeadline}
        preselectedDate={preselectedDeadlineDate}
      />

      {/* Automated Deadline & Notes Notification Drawer */}
      <NotificationDrawer
        isOpen={isNotificationOpen}
        onClose={() => setIsNotificationOpen(false)}
        deadlines={appData.deadlines}
        accountNotes={appData.notes || []}
        platformAccounts={appData.platformAccounts}
        onMarkComplete={(id) => handleToggleDeadlineStatus(id, 'Selesai')}
        onToggleNoteReminderStatus={handleToggleNoteReminderStatus}
        onNavigateCalendar={() => {
          setActiveTab('calendar');
        }}
        onNavigateNotes={() => {
          setActiveTab('notes');
        }}
      />

      {/* Backup & Settings Modal with Firestore Cloud Sync */}
      <BackupModal
        isOpen={isBackupOpen}
        onClose={() => setIsBackupOpen(false)}
        appData={appData}
        userEmail={currentUser.email}
        onSyncCloud={handleManualCloudSync}
        isSyncing={isSyncing}
        lastSyncTime={lastSyncTime}
        onUpdateData={(newData) => updateAndSyncData(() => newData)}
        onRestoreData={(newData) => updateAndSyncData(() => newData)}
        onSaveSettings={(newSettings) => updateAndSyncData(prev => ({ ...prev, settings: newSettings }))}
      />
    </div>
  );
}
