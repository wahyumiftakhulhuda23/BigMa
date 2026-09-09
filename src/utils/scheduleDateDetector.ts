/**
 * Schedule Date Detector and Formatter for BigMA YouTube Scheduling
 * Accurately parses multiple date formats, day numbers, and relative dates,
 * computing overdue status, today deadline, or days remaining with rich color classifications.
 */

export interface ScheduleDateStatus {
  isValid: boolean;
  dateStr: string; // normalized YYYY-MM-DD if valid, or raw input
  displayDate: string; // e.g. "12 Sep 2026"
  diffDays: number | null; // negative for overdue, 0 for today, positive for upcoming
  statusType: 'overdue' | 'today' | 'tomorrow' | 'upcoming' | 'none';
  statusLabel: string; // "Jadwal Terlewat", "Terakhir Hari Ini!", "Jadwal Besok", "Tersisa X Hari"
  statusSubtext: string; // "Terlewat X hari yang lalu", "Jadwal upload hari ini", "Tersisa X hari lagi"
  badgeClasses: {
    container: string;
    text: string;
    border: string;
    dot: string;
    rowHighlight: string;
  };
}

/**
 * Parse an input string into a valid local Date object at midnight 00:00:00
 */
export function parseScheduleDateInput(input: string | number | undefined | null): Date | null {
  if (input === undefined || input === null) return null;
  const raw = String(input).trim();
  if (!raw) return null;

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth(); // 0-indexed

  // 1. Single or double digit number (e.g. "15" or "5") -> Day of current month
  if (/^\d{1,2}$/.test(raw)) {
    const day = parseInt(raw, 10);
    if (day >= 1 && day <= 31) {
      const candidate = new Date(currentYear, currentMonth, day);
      return candidate;
    }
  }

  // 2. Relative day format like "+2", "+1", "0", "-1"
  if (/^[+-]?\d+$/.test(raw)) {
    const offset = parseInt(raw, 10);
    const candidate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + offset);
    return candidate;
  }

  // 3. ISO format YYYY-MM-DD (e.g. "2026-09-15")
  const isoMatch = raw.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/);
  if (isoMatch) {
    const year = parseInt(isoMatch[1], 10);
    const month = parseInt(isoMatch[2], 10) - 1;
    const day = parseInt(isoMatch[3], 10);
    const candidate = new Date(year, month, day);
    if (!isNaN(candidate.getTime())) return candidate;
  }

  // 4. Indonesian / European format DD/MM/YYYY or DD-MM-YYYY (e.g. "15/09/2026" or "15-09-2026")
  const idMatch = raw.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/);
  if (idMatch) {
    const day = parseInt(idMatch[1], 10);
    const month = parseInt(idMatch[2], 10) - 1;
    const year = parseInt(idMatch[3], 10);
    const candidate = new Date(year, month, day);
    if (!isNaN(candidate.getTime())) return candidate;
  }

  // 5. Native Date parse fallback
  const parsed = new Date(raw);
  if (!isNaN(parsed.getTime())) {
    return new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());
  }

  return null;
}

/**
 * Detect schedule status, auto-generate labels and colors
 */
export function detectScheduleStatus(input: string | number | undefined | null): ScheduleDateStatus {
  const parsedDate = parseScheduleDateInput(input);

  if (!parsedDate) {
    return {
      isValid: false,
      dateStr: String(input || ''),
      displayDate: String(input || '-'),
      diffDays: null,
      statusType: 'none',
      statusLabel: 'Belum Terjadwal',
      statusSubtext: 'Klik atau ketik tanggal upload',
      badgeClasses: {
        container: 'bg-neutral-900/60 border-neutral-800 text-neutral-400',
        text: 'text-neutral-400',
        border: 'border-neutral-800',
        dot: 'bg-neutral-600',
        rowHighlight: '',
      },
    };
  }

  // Standardize today to 00:00:00 local time
  const today = new Date();
  const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const targetMidnight = new Date(parsedDate.getFullYear(), parsedDate.getMonth(), parsedDate.getDate());

  const msPerDay = 1000 * 60 * 60 * 24;
  const diffDays = Math.round((targetMidnight.getTime() - todayMidnight.getTime()) / msPerDay);

  // ISO string for <input type="date">
  const yyyy = targetMidnight.getFullYear();
  const mm = String(targetMidnight.getMonth() + 1).padStart(2, '0');
  const dd = String(targetMidnight.getDate()).padStart(2, '0');
  const isoDate = `${yyyy}-${mm}-${dd}`;

  // Indonesian short display date
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  const displayDate = `${targetMidnight.getDate()} ${months[targetMidnight.getMonth()]} ${targetMidnight.getFullYear()}`;

  // Overdue (Jadwal Terlewat)
  if (diffDays < 0) {
    const overdueCount = Math.abs(diffDays);
    return {
      isValid: true,
      dateStr: isoDate,
      displayDate,
      diffDays,
      statusType: 'overdue',
      statusLabel: '⚠️ Jadwal Terlewat',
      statusSubtext: `Terlewat ${overdueCount} hari yang lalu`,
      badgeClasses: {
        container: 'bg-rose-950/40 border-rose-500/50 text-rose-300 shadow-sm shadow-rose-900/30',
        text: 'text-rose-300 font-bold',
        border: 'border-rose-500/50',
        dot: 'bg-rose-500 animate-pulse',
        rowHighlight: 'border-l-4 border-l-rose-500 bg-rose-950/10',
      },
    };
  }

  // Today (Terakhir Hari Ini!)
  if (diffDays === 0) {
    return {
      isValid: true,
      dateStr: isoDate,
      displayDate,
      diffDays: 0,
      statusType: 'today',
      statusLabel: '⚡ Terakhir Hari Ini!',
      statusSubtext: 'Jadwal upload hari ini',
      badgeClasses: {
        container: 'bg-amber-950/50 border-amber-400/60 text-amber-200 shadow-md shadow-amber-900/30 ring-1 ring-amber-500/30',
        text: 'text-amber-200 font-black',
        border: 'border-amber-400/60',
        dot: 'bg-amber-400 animate-ping',
        rowHighlight: 'border-l-4 border-l-amber-400 bg-amber-950/15',
      },
    };
  }

  // Tomorrow (Besok)
  if (diffDays === 1) {
    return {
      isValid: true,
      dateStr: isoDate,
      displayDate,
      diffDays: 1,
      statusType: 'tomorrow',
      statusLabel: '⏰ Jadwal Besok',
      statusSubtext: 'Tersisa 1 hari lagi',
      badgeClasses: {
        container: 'bg-sky-950/40 border-sky-500/40 text-sky-300 shadow-sm shadow-sky-900/20',
        text: 'text-sky-300 font-bold',
        border: 'border-sky-500/40',
        dot: 'bg-sky-400',
        rowHighlight: 'border-l-4 border-l-sky-400 bg-sky-950/10',
      },
    };
  }

  // Upcoming (Akan Datang)
  return {
    isValid: true,
    dateStr: isoDate,
    displayDate,
    diffDays,
    statusType: 'upcoming',
    statusLabel: `📅 ${diffDays} Hari Lagi`,
    statusSubtext: `Tersisa ${diffDays} hari lagi`,
    badgeClasses: {
      container: 'bg-emerald-950/30 border-emerald-500/40 text-emerald-300 shadow-sm shadow-emerald-900/20',
      text: 'text-emerald-300 font-semibold',
      border: 'border-emerald-500/40',
      dot: 'bg-emerald-400',
      rowHighlight: 'border-l-4 border-l-emerald-500/60',
    },
  };
}
