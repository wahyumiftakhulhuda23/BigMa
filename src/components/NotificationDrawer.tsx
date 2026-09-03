import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ProjectDeadline, PlatformAccount } from '../types';
import { getDeadlineUrgency, formatDateIndo } from '../utils/formatters';
import { Bell, AlertTriangle, Clock, CheckCircle2, X, Calendar as CalendarIcon } from 'lucide-react';

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  deadlines: ProjectDeadline[];
  platformAccounts: PlatformAccount[];
  onMarkComplete: (id: string) => void;
  onNavigateCalendar: () => void;
}

export const NotificationDrawer: React.FC<NotificationDrawerProps> = ({
  isOpen,
  onClose,
  deadlines,
  platformAccounts,
  onMarkComplete,
  onNavigateCalendar,
}) => {
  // Filter deadlines that are not completed
  const pendingDeadlines = deadlines.filter(d => d.status !== 'Selesai');
  
  // Categorize by urgency
  const urgentDeadlines = pendingDeadlines.map(d => ({
    ...d,
    urgency: getDeadlineUrgency(d.dueDate, d.status),
    platformAccount: d.platformAccountId ? platformAccounts.find(p => p.id === d.platformAccountId) : null,
  })).sort((a, b) => {
    return a.urgency.daysRemaining - b.urgency.daysRemaining;
  });

  const overdueList = urgentDeadlines.filter(d => d.urgency.isOverdue);
  const dueTodayList = urgentDeadlines.filter(d => d.urgency.daysRemaining === 0);
  const dueSoonList = urgentDeadlines.filter(d => d.urgency.daysRemaining > 0 && d.urgency.daysRemaining <= 3);
  const laterList = urgentDeadlines.filter(d => d.urgency.daysRemaining > 3);

  const totalUrgent = overdueList.length + dueTodayList.length + dueSoonList.length;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 flex justify-end bg-black/80 backdrop-blur-xs"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              onClose();
            }
          }}
        >
          <motion.div 
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="w-full max-w-md bg-neutral-900 h-full shadow-2xl flex flex-col border-l border-[#262626] text-[#E5E5E5]"
            id="notification-drawer-container"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-4 border-b border-[#262626] flex items-center justify-between bg-neutral-950 text-white">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-amber-500/10 text-amber-400 rounded-lg border border-amber-500/20">
                  <Bell className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-sans font-bold text-base tracking-tight text-neutral-100">Pengingat &amp; Notifikasi Tenggat</h3>
                  <p className="text-xs text-neutral-400">
                    {totalUrgent > 0 ? `${totalUrgent} tugas membutuhkan perhatian` : 'Semua tenggat waktu aman'}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
                id="close-notification-drawer-btn"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content list */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 divide-y divide-[#262626]">
              {/* Overdue Section */}
              {overdueList.length > 0 && (
                <div className="pt-2">
                  <div className="flex items-center gap-2 mb-2 text-rose-400 font-sans font-bold text-xs tracking-wider uppercase">
                    <AlertTriangle className="w-4 h-4" />
                    <span>Terlambat / Lewat Batas ({overdueList.length})</span>
                  </div>
                  <div className="space-y-2.5">
                    {overdueList.map(item => (
                      <div 
                        key={item.id} 
                        className="p-3 bg-rose-500/10 border border-rose-500/25 rounded-xl flex flex-col gap-1.5"
                        id={`deadline-item-${item.id}`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="font-semibold text-sm text-neutral-100 leading-snug">{item.title}</h4>
                          <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-rose-500/20 text-rose-300 shrink-0 font-mono">
                            {item.urgency.label}
                          </span>
                        </div>
                        {item.platformAccount && (
                          <div className="text-xs text-neutral-400 flex items-center gap-1.5">
                            <span className="font-medium text-neutral-200">{item.platformAccount.platform}:</span>
                            <span>{item.platformAccount.accountName}</span>
                          </div>
                        )}
                        {item.targetQuantity && (
                          <div className="text-xs text-neutral-400">Target: {item.targetQuantity}</div>
                        )}
                        <div className="flex items-center justify-between pt-1 border-t border-rose-500/20 mt-1">
                          <span className="text-xs text-rose-300 font-mono">Batas: {formatDateIndo(item.dueDate)}</span>
                          <button
                            onClick={() => onMarkComplete(item.id)}
                            className="text-xs font-sans font-bold text-emerald-400 bg-neutral-900 hover:bg-neutral-800 px-2.5 py-1 rounded-md border border-emerald-500/30 flex items-center gap-1 transition-colors cursor-pointer"
                            id={`mark-complete-${item.id}`}
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Tandai Selesai
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Due Today */}
              {dueTodayList.length > 0 && (
                <div className="pt-2">
                  <div className="flex items-center gap-2 mb-2 text-amber-400 font-sans font-bold text-xs tracking-wider uppercase">
                    <Clock className="w-4 h-4" />
                    <span>Jatuh Tempo Hari Ini ({dueTodayList.length})</span>
                  </div>
                  <div className="space-y-2.5">
                    {dueTodayList.map(item => (
                      <div 
                        key={item.id} 
                        className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl flex flex-col gap-1.5 shadow-xs"
                        id={`deadline-today-${item.id}`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="font-semibold text-sm text-neutral-100 leading-snug">{item.title}</h4>
                          <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-amber-500/20 text-amber-300 shrink-0 animate-pulse font-mono">
                            HARI INI
                          </span>
                        </div>
                        {item.platformAccount && (
                          <div className="text-xs text-neutral-400 flex items-center gap-1.5">
                            <span className="font-medium text-neutral-200">{item.platformAccount.platform}:</span>
                            <span>{item.platformAccount.accountName}</span>
                          </div>
                        )}
                        {item.targetQuantity && (
                          <div className="text-xs text-neutral-400">Target: {item.targetQuantity}</div>
                        )}
                        <div className="flex items-center justify-between pt-1 border-t border-amber-500/20 mt-1">
                          <span className="text-xs text-amber-300 font-medium">Prioritas: {item.priority}</span>
                          <button
                            onClick={() => onMarkComplete(item.id)}
                            className="text-xs font-sans font-bold text-emerald-400 bg-neutral-900 hover:bg-neutral-800 px-2.5 py-1 rounded-md border border-emerald-500/30 flex items-center gap-1 transition-colors cursor-pointer"
                            id={`mark-complete-today-${item.id}`}
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Tandai Selesai
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Due Soon (1-3 days) */}
              {dueSoonList.length > 0 && (
                <div className="pt-2">
                  <div className="flex items-center gap-2 mb-2 text-sky-400 font-sans font-bold text-xs tracking-wider uppercase">
                    <Clock className="w-4 h-4" />
                    <span>Mendekati Tenggat (1 - 3 Hari) ({dueSoonList.length})</span>
                  </div>
                  <div className="space-y-2">
                    {dueSoonList.map(item => (
                      <div 
                        key={item.id} 
                        className="p-3 bg-sky-500/10 border border-sky-500/20 rounded-xl flex flex-col gap-1.5"
                        id={`deadline-soon-${item.id}`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="font-semibold text-sm text-neutral-100">{item.title}</h4>
                          <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-sky-500/20 text-sky-300 shrink-0 font-mono">
                            {item.urgency.label}
                          </span>
                        </div>
                        {item.platformAccount && (
                          <div className="text-xs text-neutral-400">
                            {item.platformAccount.platform} - {item.platformAccount.accountName}
                          </div>
                        )}
                        <div className="flex items-center justify-between pt-1 border-t border-sky-500/20 mt-1">
                          <span className="text-xs text-neutral-400 font-mono">Tenggat: {formatDateIndo(item.dueDate)}</span>
                          <button
                            onClick={() => onMarkComplete(item.id)}
                            className="text-xs font-sans font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 transition-colors cursor-pointer"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" /> Selesai
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Other / Later */}
              {laterList.length > 0 && (
                <div className="pt-2">
                  <div className="text-neutral-400 font-sans font-bold text-xs tracking-wider uppercase mb-2">
                    Tenggat Mendatang ({laterList.length})
                  </div>
                  <div className="space-y-2">
                    {laterList.slice(0, 3).map(item => (
                      <div key={item.id} className="p-2.5 bg-neutral-950 border border-[#262626] rounded-lg text-xs flex justify-between items-center">
                        <div>
                          <span className="font-medium text-neutral-200">{item.title}</span>
                          <p className="text-neutral-500 font-mono">{formatDateIndo(item.dueDate)}</p>
                        </div>
                        <span className="text-neutral-400 font-medium font-mono">{item.urgency.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {pendingDeadlines.length === 0 && (
                <div className="py-12 text-center text-neutral-500">
                  <CheckCircle2 className="w-12 h-12 mx-auto text-emerald-400 mb-2 opacity-80" />
                  <p className="font-sans font-bold text-neutral-200">Semua Proyek &amp; Tugas Beres!</p>
                  <p className="text-xs text-neutral-500 mt-1">Tidak ada tenggat waktu aktif yang menunggu.</p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-3 border-t border-[#262626] bg-neutral-950 flex items-center justify-between">
              <button
                onClick={() => {
                  onClose();
                  onNavigateCalendar();
                }}
                className="w-full py-2 px-3 bg-amber-400 hover:bg-amber-300 text-neutral-950 rounded-lg text-xs font-sans font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                id="view-full-calendar-btn"
              >
                <CalendarIcon className="w-4 h-4 stroke-[2.5]" />
                Buka Kalender Tenggat Waktu Lengkap
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
