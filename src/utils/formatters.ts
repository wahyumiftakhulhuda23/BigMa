export function formatCurrency(amount: number, currency: 'USD' | 'IDR' | 'EUR' = 'IDR'): string {
  if (currency === 'IDR') {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(amount || 0);
  } else if (currency === 'USD') {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount || 0);
  } else {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount || 0);
  }
}

export function formatDateIndo(dateStr: string): string {
  if (!dateStr) return '-';
  try {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const d = new Date(year, month, day);
      return d.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    }
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? dateStr : d.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

export function getDeadlineUrgency(dueDateStr: string, status: string): {
  label: string;
  badgeColor: string;
  isOverdue: boolean;
  daysRemaining: number;
} {
  if (status === 'Selesai') {
    return { label: 'Selesai', badgeColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30', isOverdue: false, daysRemaining: 999 };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const parts = dueDateStr.split('-');
  let targetDate = new Date(dueDateStr);
  if (parts.length === 3) {
    targetDate = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
  }
  targetDate.setHours(0, 0, 0, 0);

  const diffTime = targetDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return {
      label: `Terlambat ${Math.abs(diffDays)} hari`,
      badgeColor: 'bg-rose-500/15 text-rose-400 border-rose-500/30 font-semibold',
      isOverdue: true,
      daysRemaining: diffDays,
    };
  } else if (diffDays === 0) {
    return {
      label: 'Jatuh Tempo HARI INI',
      badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/50 font-bold animate-pulse',
      isOverdue: false,
      daysRemaining: 0,
    };
  } else if (diffDays === 1) {
    return {
      label: 'Besok (1 hari lagi)',
      badgeColor: 'bg-orange-500/15 text-orange-400 border-orange-500/30 font-medium',
      isOverdue: false,
      daysRemaining: 1,
    };
  } else if (diffDays <= 3) {
    return {
      label: `${diffDays} hari lagi`,
      badgeColor: 'bg-amber-500/10 text-amber-400/90 border-amber-500/30',
      isOverdue: false,
      daysRemaining: diffDays,
    };
  } else {
    return {
      label: `${diffDays} hari lagi`,
      badgeColor: 'bg-neutral-800 text-neutral-300 border-neutral-700',
      isOverdue: false,
      daysRemaining: diffDays,
    };
  }
}
