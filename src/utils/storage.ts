import { AppData, GmailAccount, PlatformAccount, RealtimeFinance, IncomeRecord, ProjectDeadline } from '../types';

// Updated storage key to ensure fresh deploy initializes with empty tables
const STORAGE_KEY = 'bigma_account_management_store_v1';

export const initialStarterData: AppData = {
  settings: {
    usdToIdrRate: 16250,
    eurToIdrRate: 17400,
    studioName: 'BigMA',
  },
  gmails: [],
  platformAccounts: [],
  notes: [],
  realtimeFinances: [],
  incomes: [],
  deadlines: [],
};

// Optional sample data template for testing or demo reset
export const demoSampleData: AppData = {
  settings: {
    usdToIdrRate: 16250,
    eurToIdrRate: 17400,
    studioName: 'BigMA',
  },
  gmails: [
    {
      id: 'gm-1',
      email: 'founder.bigma@gmail.com',
      password: 'BigMA*SecurePass2026#',
      code2FA: 'JBSWY3DPEHPK3PXP (Backup: 8192-4821)',
      recoveryEmail: 'recovery.bigma@gmail.com',
      recoveryPassword: 'Recovery#Secret99',
      phoneRecovery: '+62 812-3456-7890',
      connectedAccountsNote: 'Google AdSense, YouTube Partner Program, Payoneer Primary',
      notes: 'Email master utama founder BigMA',
      createdAt: '2025-01-10',
      updatedAt: '2026-08-20',
    },
  ],
  platformAccounts: [
    {
      id: 'plat-1',
      gmailId: 'gm-1',
      platform: 'YouTube',
      accountName: 'BigMA Motion & Visuals',
      usernameOrHandle: '@bigma_motion',
      platformPassword: 'Login Google Master',
      customCredentials: 'Channel ID: UC-9938BigMA',
      channelOrProfileUrl: 'https://youtube.com/@bigma_motion',
      status: 'Aktif',
      niche: 'Motion Graphics, 3D Loop',
      notes: 'Monetized 100%',
      createdAt: '2025-01-15',
    },
  ],
  notes: [],
  realtimeFinances: [
    {
      id: 'rf-1',
      platformAccountId: 'plat-1',
      availableBalance: 485.6,
      pendingEarnings: 160.2,
      currency: 'USD',
      payoutThreshold: 100,
      paymentMethod: 'Wire Transfer / Bank Mandiri',
      accountHolder: 'Wahyu Huda',
      lastUpdated: '2026-09-02',
      notes: 'AdSense dikirim tiap tanggal 21-26',
    },
  ],
  incomes: [],
  deadlines: [],
};

export function loadAppData(): AppData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      // Save initial empty data on first deploy
      saveAppData(initialStarterData);
      return initialStarterData;
    }
    const parsed = JSON.parse(raw);
    return {
      settings: parsed.settings || initialStarterData.settings,
      gmails: Array.isArray(parsed.gmails) ? parsed.gmails : [],
      platformAccounts: Array.isArray(parsed.platformAccounts) ? parsed.platformAccounts : [],
      notes: Array.isArray(parsed.notes) ? parsed.notes : [],
      realtimeFinances: Array.isArray(parsed.realtimeFinances) ? parsed.realtimeFinances : [],
      incomes: Array.isArray(parsed.incomes) ? parsed.incomes : [],
      deadlines: Array.isArray(parsed.deadlines) ? parsed.deadlines : [],
    };
  } catch (err) {
    console.error('Error loading data from localStorage, using clean initial data:', err);
    return initialStarterData;
  }
}

export function saveAppData(data: AppData): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (err) {
    console.error('Error saving data to localStorage:', err);
  }
}

export function resetToDefaultData(): AppData {
  saveAppData(initialStarterData);
  return initialStarterData;
}

export function loadDemoSampleData(): AppData {
  saveAppData(demoSampleData);
  return demoSampleData;
}

export function downloadJsonBackup(data: AppData): void {
  const jsonStr = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  const dateStr = new Date().toISOString().split('T')[0];
  link.download = `bigma_account_management_backup_${dateStr}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

