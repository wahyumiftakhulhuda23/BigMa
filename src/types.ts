export interface GmailAccount {
  id: string;
  email: string;
  password: string;
  code2FA: string;
  recoveryEmail: string;
  recoveryPassword: string;
  phoneRecovery?: string;
  connectedAccountsNote: string; // Kolom lanjutan akun penting lainnya
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PlatformAccount {
  id: string;
  gmailId: string; // Data kunci basis operasional
  platform: string; // Adobe Stock, Shutterstock, Vecteezy, YouTube, Freepik, Envato, TikTok, dll
  customPlatformName?: string;
  accountName: string; // Nama akun / channel masing-masing
  usernameOrHandle: string;
  platformPassword?: string; // Kredensial khusus
  customCredentials?: string; // Kredensial khusus lainnya (PIN, API, dll)
  channelOrProfileUrl?: string;
  status: 'Aktif' | 'Review' | 'Suspended' | 'Nonaktif';
  niche?: string;
  notes?: string;
  createdAt: string;
}

export interface RealtimeFinance {
  id: string;
  platformAccountId: string;
  availableBalance: number; // Saldo tersedia saat ini
  pendingEarnings: number; // Estimasi pendapatan belum cair
  currency: 'USD' | 'IDR' | 'EUR';
  payoutThreshold: number; // Ambang batas payout
  paymentMethod: string; // Paypal, Payoneer, Wire Transfer, BCA, dll
  accountHolder?: string; // Email akun pembayaran / nomor rekening
  lastUpdated: string;
  notes?: string;
}

export interface IncomeRecord {
  id: string;
  platformAccountId: string;
  date: string; // YYYY-MM-DD
  amount: number;
  currency: 'USD' | 'IDR' | 'EUR';
  exchangeRate: number; // Kurs konversi ke IDR
  amountIdr: number; // Nilai IDR
  paymentSource: string; // Paypal, Payoneer, Wire Transfer, BCA, dll
  category: string; // Royalty Microstock, AdSense, Direct Sale, Freelance, dll
  referenceNo?: string;
  notes?: string;
  createdAt: string;
}

export interface ProjectDeadline {
  id: string;
  title: string;
  platformAccountId?: string;
  dueDate: string; // YYYY-MM-DD
  priority: 'Rendah' | 'Sedang' | 'Tinggi' | 'Mendesak';
  status: 'Belum Selesai' | 'Dalam Proses' | 'Selesai';
  targetQuantity?: string; // misal: "60 Vektor", "2 Video"
  notes?: string;
  createdAt: string;
}

export interface AccountNote {
  id: string;
  platformAccountId: string; // ID PlatformAccount atau 'master' / 'general'
  title: string;
  content: string;
  category: 'Kredensial & PIN' | 'Strategi & Niche' | 'Peringatan & Rule' | 'Jadwal Konten' | 'Log Update' | 'Umum';
  priority: 'Rendah' | 'Sedang' | 'Tinggi' | 'Mendesak';
  hasReminder: boolean;
  reminderDate?: string; // YYYY-MM-DD
  reminderTime?: string; // HH:mm
  reminderStatus?: 'Pending' | 'Selesai';
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface AppSettings {
  usdToIdrRate: number;
  eurToIdrRate: number;
  studioName: string;
}

export interface AppData {
  gmails: GmailAccount[];
  platformAccounts: PlatformAccount[];
  notes: AccountNote[];
  realtimeFinances: RealtimeFinance[];
  incomes: IncomeRecord[];
  deadlines: ProjectDeadline[];
  settings: AppSettings;
}

export type ActiveTab = 'gmail' | 'platforms' | 'notes' | 'finance' | 'income' | 'calendar';
