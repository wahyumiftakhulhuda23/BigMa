import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { AppData, GmailAccount, PlatformAccount, RealtimeFinance, IncomeRecord, ProjectDeadline } from '../types';
import { formatCurrency, formatDateIndo } from './formatters';

// Helper to download Excel
export function exportToExcel(data: Record<string, any>[], filename: string, sheetName: string = 'Data'): void {
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  XLSX.writeFile(workbook, `${filename}.xlsx`);
}

// Full All-in-One Workbook Export
export function exportFullStudioWorkbook(
  appDataOrGmails: AppData | GmailAccount[],
  platformAccountsArg?: PlatformAccount[],
  financesArg?: RealtimeFinance[],
  incomesArg?: IncomeRecord[],
  deadlinesArg?: ProjectDeadline[]
): void {
  let gmails: GmailAccount[];
  let platformAccounts: PlatformAccount[];
  let finances: RealtimeFinance[];
  let incomes: IncomeRecord[];
  let deadlines: ProjectDeadline[];

  if ('gmails' in appDataOrGmails) {
    gmails = appDataOrGmails.gmails;
    platformAccounts = appDataOrGmails.platformAccounts;
    finances = appDataOrGmails.realtimeFinances;
    incomes = appDataOrGmails.incomes;
    deadlines = appDataOrGmails.deadlines;
  } else {
    gmails = appDataOrGmails;
    platformAccounts = platformAccountsArg || [];
    finances = financesArg || [];
    incomes = incomesArg || [];
    deadlines = deadlinesArg || [];
  }

  const workbook = XLSX.utils.book_new();

  // 1. Gmail Master Sheet
  const gmailRows = gmails.map((g, idx) => {
    const linked = platformAccounts.filter(p => p.gmailId === g.id);
    const linkedSummary = linked.map(l => `${l.platform}: ${l.accountName}`).join('; ');
    return {
      No: idx + 1,
      Email: g.email,
      Password: g.password,
      'Kode 2FA': g.code2FA,
      'Email Pemulihan': g.recoveryEmail,
      'Password Pemulihan': g.recoveryPassword,
      'No HP Pemulihan': g.phoneRecovery || '-',
      'Akun Terkoneksi & Penting': g.connectedAccountsNote || '-',
      'Platform Terhubung': linkedSummary || 'Belum ada',
      'Total Akun Terhubung': linked.length,
      Catatan: g.notes || '-',
    };
  });
  const wsGmails = XLSX.utils.json_to_sheet(gmailRows);
  XLSX.utils.book_append_sheet(workbook, wsGmails, 'Database Gmail');

  // 2. Platform Accounts Sheet
  const platformRows = platformAccounts.map((p, idx) => {
    const gmail = gmails.find(g => g.id === p.gmailId);
    return {
      No: idx + 1,
      Platform: p.platform === 'Lainnya' && p.customPlatformName ? p.customPlatformName : p.platform,
      'Nama Akun / Channel': p.accountName,
      'Username / Handle': p.usernameOrHandle,
      'Gmail Terhubung': gmail?.email || '-',
      'Password Platform': p.platformPassword || '-',
      'Kredensial Khusus / PIN / API': p.customCredentials || '-',
      'URL Channel / Portfolio': p.channelOrProfileUrl || '-',
      Status: p.status,
      'Niche / Kategori': p.niche || '-',
      Catatan: p.notes || '-',
    };
  });
  const wsPlatforms = XLSX.utils.json_to_sheet(platformRows);
  XLSX.utils.book_append_sheet(workbook, wsPlatforms, 'Kelola Akun Platform');

  // 3. Realtime Finance Sheet
  const financeRows = finances.map((f, idx) => {
    const plat = platformAccounts.find(p => p.id === f.platformAccountId);
    const gmail = plat ? gmails.find(g => g.id === plat.gmailId) : null;
    return {
      No: idx + 1,
      Platform: plat?.platform || '-',
      'Nama Akun': plat?.accountName || '-',
      'Gmail Pengelola': gmail?.email || '-',
      'Saldo Tersedia': `${f.currency} ${f.availableBalance}`,
      'Pending Earnings': `${f.currency} ${f.pendingEarnings}`,
      'Ambang Batas Payout': `${f.currency} ${f.payoutThreshold}`,
      'Status Siap Payout': f.availableBalance >= f.payoutThreshold ? 'SIAP CASHOUT' : 'Belum Mencapai Batas',
      'Metode Pembayaran': f.paymentMethod,
      'Penerima / Rekening': f.accountHolder || '-',
      'Terakhir Update': formatDateIndo(f.lastUpdated),
    };
  });
  const wsFinance = XLSX.utils.json_to_sheet(financeRows);
  XLSX.utils.book_append_sheet(workbook, wsFinance, 'Keuangan Realtime');

  // 4. Income Records Sheet
  const incomeRows = incomes.map((inc, idx) => {
    const plat = platformAccounts.find(p => p.id === inc.platformAccountId);
    return {
      No: idx + 1,
      Tanggal: inc.date,
      Platform: plat?.platform || '-',
      'Nama Akun': plat?.accountName || '-',
      'Nominal Asli': `${inc.currency} ${inc.amount}`,
      'Kurs IDR': inc.exchangeRate,
      'Nominal (IDR)': inc.amountIdr,
      'Sumber Pembayaran': inc.paymentSource,
      'Kategori Pendapatan': inc.category,
      'No Invoice / Ref': inc.referenceNo || '-',
      Catatan: inc.notes || '-',
    };
  });
  const wsIncomes = XLSX.utils.json_to_sheet(incomeRows);
  XLSX.utils.book_append_sheet(workbook, wsIncomes, 'Database Pemasukan');

  // 5. Deadlines Sheet
  const deadlineRows = deadlines.map((dl, idx) => {
    const plat = dl.platformAccountId ? platformAccounts.find(p => p.id === dl.platformAccountId) : null;
    return {
      No: idx + 1,
      'Judul Tugas / Proyek': dl.title,
      'Platform Terkait': plat ? `${plat.platform} (${plat.accountName})` : 'Umum / Master',
      'Tenggat Waktu (Deadline)': dl.dueDate,
      Prioritas: dl.priority,
      Status: dl.status,
      'Target Kuantitas': dl.targetQuantity || '-',
      Catatan: dl.notes || '-',
    };
  });
  const wsDeadlines = XLSX.utils.json_to_sheet(deadlineRows);
  XLSX.utils.book_append_sheet(workbook, wsDeadlines, 'Kalender Deadline');

  const todayStr = new Date().toISOString().split('T')[0];
  XLSX.writeFile(workbook, `BigMA_Studio_Laporan_Lengkap_${todayStr}.xlsx`);
}

// Export PDF Helper
export function exportTableToPdf(options: {
  title: string;
  subtitle?: string;
  filename: string;
  headers: string[];
  rows: (string | number)[][];
  orientation?: 'portrait' | 'landscape';
}): void {
  const doc = new jsPDF({
    orientation: options.orientation || 'landscape',
    unit: 'pt',
    format: 'a4',
  });

  // BigMA Studio Header
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, doc.internal.pageSize.getWidth(), 65, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('STUDIO BigMA - SISTEM MANAJEMEN TERPADU', 35, 28);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(148, 163, 184); // slate-400
  const todayStr = new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  doc.text(`Dokumen: ${options.title} | Tanggal Cetak: ${todayStr}`, 35, 48);

  // Subtitle / Notes
  let startY = 85;
  if (options.subtitle) {
    doc.setTextColor(51, 65, 85);
    doc.setFontSize(10);
    doc.text(options.subtitle, 35, startY);
    startY += 18;
  }

  // AutoTable
  autoTable(doc, {
    startY: startY,
    head: [options.headers],
    body: options.rows,
    theme: 'grid',
    styles: {
      fontSize: 8,
      cellPadding: 5,
      textColor: [30, 41, 59],
      lineColor: [226, 232, 240],
      lineWidth: 0.5,
    },
    headStyles: {
      fillColor: [30, 41, 59], // Slate 800
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8.5,
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    margin: { left: 35, right: 35 },
  });

  // Footer page numbers
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text(
      `Halaman ${i} dari ${pageCount} - Dokumen Rahasia Internal Studio BigMA`,
      35,
      doc.internal.pageSize.getHeight() - 15
    );
  }

  doc.save(`${options.filename}.pdf`);
}
