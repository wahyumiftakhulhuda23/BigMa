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

export type MonetizationStatus = 'Ya' | 'Tidak' | 'Hampir';

export interface YoutubeScheduleItem {
  id: string;
  platformAccountId: string;
  jadwal: string; // date format (e.g. YYYY-MM-DD or custom text date)
  draft: number; // angka
  siapUpload: number; // angka
  monet: MonetizationStatus; // dropdown: Ya, Tidak, Hampir
  jumlahBahan: number; // angka
  keterangan: string; // text
  updatedAt: string;
}

export interface MicrostockItem {
  id: string;
  platformAccountId: string;
  jumlahItem: number; // angka
  newItem: number; // angka
  reject: number; // angka
  konsentrasiAkun: string; // text
  updatedAt: string;
}

export interface OfficeTask {
  id: string;
  title: string;
  department?: string; // Keuangan, Administrasi, IT, SDM, Operasional, Umum
  priority: 'Rendah' | 'Sedang' | 'Tinggi' | 'Mendesak';
  status: 'Belum Mulai' | 'Sedang Dikerjakan' | 'Review' | 'Selesai';
  dueDate: string; // YYYY-MM-DD
  dueTime?: string; // HH:mm
  assignee?: string; // Penanggung Jawab / Rekan Kerja
  category?: 'Pekerjaan Rutin' | 'Proyek Kantor' | 'Rapat / Meeting' | 'Laporan & Surat' | 'Pengingat Dinas' | 'Lainnya';
  description?: string;
  reminderActive?: boolean;
  createdAt: string;
  updatedAt: string;
}

export type DevItemType = 'Bug' | 'Ide' | 'Maintenance';

export interface DevProjectItem {
  id: string;
  title: string;
  type: DevItemType; // Bug, Ide, atau Maintenance
  appName: string; // misal: BigMA Vault, POS Mobile, Web App Kasir, Landing Page, dll
  severity: 'Kritis' | 'Tinggi' | 'Sedang' | 'Rendah';
  status: 'Open' | 'Investigasi' | 'Dikerjakan' | 'Selesai' | 'Konsep' | 'Terjadwal';
  scheduledDate?: string; // YYYY-MM-DD untuk maintenance / deadline perbaikan
  scheduledTime?: string; // HH:mm
  description?: string; // Penjelasan bug / konsep ide / langkah perbaikan
  stackOrTech?: string; // React, TypeScript, Node.js, Tailwind, SQLite, Flutter, dll
  stepsToReproduce?: string; // Khusus Bug
  reminderActive?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DigitalProductItem {
  id: string;
  title: string; // Nama produk digital / konten
  category: 'Template' | 'UI Kit' | 'E-Book' | 'Preset & LUT' | 'Bundle' | 'Video Course' | 'Audio/SFX' | 'Software/Script' | 'Lainnya';
  platform: string; // Gumroad, Envato, Lemon Squeezy, Shopee, YouTube, Website Pribadi, dll
  releaseDate: string; // YYYY-MM-DD
  releaseTime?: string; // HH:mm
  status: 'Ide / Konsep' | 'Produksi Bahan' | 'Siap Rilis' | 'Sudah Rilis';
  pricing?: number;
  currency?: 'IDR' | 'USD';
  conceptNotes?: string; // Konsep & ide rilis
  contentSchedule?: string; // Rencana jadwal konten (teaser, launch, post-launch)
  promoChannel?: string; // Instagram Reels, TikTok, YouTube, Newsletter, dll
  reminderActive?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AppData {
  gmails: GmailAccount[];
  platformAccounts: PlatformAccount[];
  notes: AccountNote[];
  realtimeFinances: RealtimeFinance[];
  incomes: IncomeRecord[];
  deadlines: ProjectDeadline[];
  youtubeSchedules: YoutubeScheduleItem[];
  microstockItems: MicrostockItem[];
  officeTasks?: OfficeTask[];
  devProjects?: DevProjectItem[];
  digitalProducts?: DigitalProductItem[];
  settings: AppSettings;
}

export type TopMode = 'freelance' | 'office' | 'project-dev' | 'digital-product';

export type ActiveTab = 
  | 'gmail' 
  | 'platforms' 
  | 'youtube-schedule' 
  | 'microstock' 
  | 'notes' 
  | 'finance' 
  | 'income' 
  | 'calendar'
  | 'office-jobs'
  | 'office-notes'
  | 'office-calendar'
  | 'project-dev-all'
  | 'project-dev-bugs'
  | 'project-dev-ideas'
  | 'project-dev-maintenance'
  | 'digital-product-all'
  | 'digital-product-calendar'
  | 'digital-product-ideas';
