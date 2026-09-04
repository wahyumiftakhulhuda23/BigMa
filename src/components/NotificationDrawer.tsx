import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ProjectDeadline, PlatformAccount, AccountNote } from '../types';
import { getDeadlineUrgency, formatDateIndo } from '../utils/formatters';
import { Bell, AlertTriangle, Clock, CheckCircle2, X, Calendar as CalendarIcon, StickyNote } from 'lucide-react';

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  deadlines: ProjectDeadline[];
  accountNotes?: AccountNote[];
  platformAccounts: PlatformAccount[];
  onMarkComplete: (id: string) => void;
  onToggleNoteReminderStatus?: (id: string) => void;
  onNavigateCalendar: () => void;
  onNavigateNotes?: () => void;
}

export const NotificationDrawer: React.FC<NotificationDrawerProps> = ({
  isOpen,
  onClose,
  deadlines,
  accountNotes = [],
  platformAccounts,
  onMarkComplete,
  onToggleNoteReminderStatus,
  onNavigateCalendar,
  onNavigateNotes,
}) => {
  // Filter deadlines that are not completed
  const pendingDeadlines = deadlines.filter(d => d.status !== 'Selesai');
  
  // Filter account notes with active reminders
  const pendingNotes = accountNotes.filter(n => n.hasReminder && n.reminderDate && n.reminderStatus !== 'Selesai');

  // Categorize by urgency (Deadlines)
  const urgentDeadlines = pendingDeadlines.map(d => ({
    ...d,
    urgency: getDeadlineUrgency(d.dueDate, d.status),
    platformAccount: d.platformAccountId ? platformAccounts.find(p => p.id === d.platformAccountId) : null,
  })).sort((a, b) => {
    return a.urgency.daysRemaining - b.urgency.daysRemaining;
  });

  // Categorize note reminders
  const urgentNoteReminders = pendingNotes.map(n => ({
    ...n,
    urgency: getDeadlineUrgency(n.reminderDate!, 'Belum Selesai'),
    platformAccount: platformAccounts.find(p => p.id === n.platformAccountId),
  })).sort((a, b) => {
    return a.urgency.daysRemaining - b.urgency.daysRemaining;
  });

  const overdueDeadlines = urgentDeadlines.filter(d => d.urgency.isOverdue);
  const overdueNotes = urgentNoteReminders.filter(n => n.urgency.isOverdue);

  const dueTodayDeadlines = urgentDeadlines.filter(d => d.urgency.daysRemaining === 0);
  const dueTodayNotes = urgentNoteReminders.filter(n => n.urgency.daysRemaining === 0);

  const dueSoonDeadlines = urgentDeadlines.filter(d => d.urgency.daysRemaining > 0 && d.urgency.daysRemaining <= 3);
  const dueSoonNotes = urgentNoteReminders.filter(n => n.urgency.daysRemaining > 0 && n.urgency.daysRemaining <= 3);

  const totalUrgent = overdueDeadlines.length + overdueNotes.length + dueTodayDeadlines.length + dueTodayNotes.length + dueSoonDeadlines.length + dueSoonNotes.length;

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
                    {totalUrgent > 0 ? `${totalUrgent} tugas & pengingat membutuhkan perhatian` : 'Semua tenggat waktu aman'}
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
              {(overdueDeadlines.length > 0 || overdueNotes.length > 0) && (
                <div className="pt-2">
                  <div className="flex items-center gap-2 mb-2 text-rose-400 font-sans font-bold text-xs tracking-wider uppercase">
                    <AlertTriangle className="w-4 h-4" />
                    <span>Terlambat / Lewat Batas ({overdueDeadlines.length + overdueNotes.length})</span>
                  </div>
                  <div className="space-y-2.5">
                    {/* Project Deadlines */}
                    {overdueDeadlines.map(item => (
                      <div 
                        key={`dl-${item.id}`} 
                        className="p-3 bg-rose-500/10 border border-rose-500/25 rounded-xl flex flex-col gap-1.5"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="font-semibold text-sm text-neutral-100 leading-snug">{item.title}</h4>
                          <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-rose-500/20 text-rose-300 shrink-0 font-mono">
                            {item.urgency.label}
                          </span>
                        </div>
                        {item.platformAccount && (
                          <div className="text-xs text-neutral-400 flex items-center gap-1.5">
                            <span className="font-medium text-amber-300">[{item.platformAccount.platform}]:</span>
                            <span>{item.platformAccount.accountName}</span>
                          </div>
                        )}
                        <div className="flex items-center justify-between pt-1 border-t border-rose-500/20 mt-1">
                          <span className="text-xs text-rose-300 font-mono">Batas: {formatDateIndo(item.dueDate)}</span>
                          <button
                            onClick={() => onMarkComplete(item.id)}
                            className="text-xs font-sans font-bold text-emerald-400 bg-neutral-900 hover:bg-neutral-800 px-2.5 py-1 rounded-md border border-emerald-500/30 flex items-center gap-1 transition-colors cursor-pointer"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Selesai
                          </button>
                        </div>
                      </div>
                    ))}

                    {/* Account Notes Reminders */}
                    {overdueNotes.map(note => (
                      <div 
                        key={`note-${note.id}`} 
                        className="p-3 bg-rose-500/10 border border-rose-500/25 rounded-xl flex flex-col gap-1.5"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-1.5">
                            <StickyNote className="w-4 h-4 text-amber-400 shrink-0" />
                            <h4 className="font-semibold text-sm text-neutral-100 leading-snug">{note.title}</h4>
                          </div>
                          <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-rose-500/20 text-rose-300 shrink-0 font-mono">
                            {note.urgency.label}
                          </span>
                        </div>
                        <div className="text-xs text-neutral-400 flex items-center gap-1.5">
                          <span className="font-medium text-amber-300">[{note.platformAccount ? note.platformAccount.platform : 'Umum'}]:</span>
                          <span className="truncate">{note.platformAccount ? note.platformAccount.accountName : 'Catatan Master'}</span>
                        </div>
                        <div className="flex items-center justify-between pt-1 border-t border-rose-500/20 mt-1">
                          <span className="text-xs text-rose-300 font-mono">Pengingat: {formatDateIndo(note.reminderDate!)}</span>
                          {onToggleNoteReminderStatus && (
                            <button
                              onClick={() => onToggleNoteReminderStatus(note.id)}
                              className="text-xs font-sans font-bold text-emerald-400 bg-neutral-900 hover:bg-neutral-800 px-2.5 py-1 rounded-md border border-emerald-500/30 flex items-center gap-1 transition-colors cursor-pointer"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Selesai
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Due Today */}
              {(dueTodayDeadlines.length > 0 || dueTodayNotes.length > 0) && (
                <div className="pt-2">
                  <div className="flex items-center gap-2 mb-2 text-amber-400 font-sans font-bold text-xs tracking-wider uppercase">
                    <Clock className="w-4 h-4" />
                    <span>Jatuh Tempo Hari Ini ({dueTodayDeadlines.length + dueTodayNotes.length})</span>
                  </div>
                  <div className="space-y-2.5">
                    {dueTodayDeadlines.map(item => (
                      <div 
                        key={`today-dl-${item.id}`} 
                        className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl flex flex-col gap-1.5 shadow-xs"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="font-semibold text-sm text-neutral-100 leading-snug">{item.title}</h4>
                          <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-amber-500/20 text-amber-300 shrink-0 animate-pulse font-mono">
                            HARI INI
                          </span>
                        </div>
                        {item.platformAccount && (
                          <div className="text-xs text-neutral-400 flex items-center gap-1.5">
                            <span className="font-medium text-amber-300">[{item.platformAccount.platform}]:</span>
                            <span>{item.platformAccount.accountName}</span>
                          </div>
                        )}
                        <div className="flex items-center justify-between pt-1 border-t border-amber-500/20 mt-1">
                          <span className="text-xs text-amber-300 font-medium">Prioritas: {item.priority}</span>
                          <button
                            onClick={() => onMarkComplete(item.id)}
                            className="text-xs font-sans font-bold text-emerald-400 bg-neutral-900 hover:bg-neutral-800 px-2.5 py-1 rounded-md border border-emerald-500/30 flex items-center gap-1 transition-colors cursor-pointer"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Tandai Selesai
                          </button>
                        </div>
                      </div>
                    ))}

                    {dueTodayNotes.map(note => (
                      <div 
                        key={`today-note-${note.id}`} 
                        className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl flex flex-col gap-1.5 shadow-xs"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-1.5">
                            <StickyNote className="w-4 h-4 text-amber-400 shrink-0" />
                            <h4 className="font-semibold text-sm text-neutral-100 leading-snug">{note.title}</h4>
                          </div>
                          <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-amber-500/20 text-amber-300 shrink-0 animate-pulse font-mono">
                            PENGINGAT HARI INI
                          </span>
                        </div>
                        <div className="text-xs text-neutral-400 flex items-center gap-1.5">
                          <span className="font-medium text-amber-300">[{note.platformAccount ? note.platformAccount.platform : 'Umum'}]:</span>
                          <span className="truncate">{note.platformAccount ? note.platformAccount.accountName : 'Catatan Master'}</span>
                        </div>
                        <div className="flex items-center justify-between pt-1 border-t border-amber-500/20 mt-1">
                          <span className="text-xs text-amber-300 font-medium">Kategori: {note.category}</span>
                          {onToggleNoteReminderStatus && (
                            <button
                              onClick={() => onToggleNoteReminderStatus(note.id)}
                              className="text-xs font-sans font-bold text-emerald-400 bg-neutral-900 hover:bg-neutral-800 px-2.5 py-1 rounded-md border border-emerald-500/30 flex items-center gap-1 transition-colors cursor-pointer"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Tandai Selesai
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Due Soon (1-3 days) */}
              {(dueSoonDeadlines.length > 0 || dueSoonNotes.length > 0) && (
                <div className="pt-2">
                  <div className="flex items-center gap-2 mb-2 text-sky-400 font-sans font-bold text-xs tracking-wider uppercase">
                    <Clock className="w-4 h-4" />
                    <span>Mendekati Tenggat (1 - 3 Hari) ({dueSoonDeadlines.length + dueSoonNotes.length})</span>
                  </div>
                  <div className="space-y-2">
                    {dueSoonDeadlines.map(item => (
                      <div 
                        key={`soon-dl-${item.id}`} 
                        className="p-3 bg-sky-500/10 border border-sky-500/20 rounded-xl flex flex-col gap-1.5"
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

                    {dueSoonNotes.map(note => (
                      <div 
                        key={`soon-note-${note.id}`} 
                        className="p-3 bg-sky-500/10 border border-sky-500/20 rounded-xl flex flex-col gap-1.5"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-1.5">
                            <StickyNote className="w-4 h-4 text-amber-400 shrink-0" />
                            <h4 className="font-semibold text-sm text-neutral-100">{note.title}</h4>
                          </div>
                          <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-sky-500/20 text-sky-300 shrink-0 font-mono">
                            {note.urgency.label}
                          </span>
                        </div>
                        <div className="text-xs text-neutral-400">
                          {note.platformAccount ? `${note.platformAccount.platform} - ${note.platformAccount.accountName}` : 'Umum Master'}
                        </div>
                        <div className="flex items-center justify-between pt-1 border-t border-sky-500/20 mt-1">
                          <span className="text-xs text-neutral-400 font-mono">Pengingat: {formatDateIndo(note.reminderDate!)}</span>
                          {onToggleNoteReminderStatus && (
                            <button
                              onClick={() => onToggleNoteReminderStatus(note.id)}
                              className="text-xs font-sans font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 transition-colors cursor-pointer"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" /> Selesai
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {pendingDeadlines.length === 0 && pendingNotes.length === 0 && (
                <div className="py-12 text-center text-neutral-500">
                  <CheckCircle2 className="w-12 h-12 mx-auto text-emerald-400 mb-2 opacity-80" />
                  <p className="font-sans font-bold text-neutral-200">Semua Proyek &amp; Catatan Beres!</p>
                  <p className="text-xs text-neutral-500 mt-1">Tidak ada tenggat waktu atau pengingat aktif yang menunggu.</p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-3 border-t border-[#262626] bg-neutral-950 flex flex-col gap-2">
              <button
                onClick={() => {
                  onClose();
                  onNavigateCalendar();
                }}
                className="w-full py-2 px-3 bg-amber-400 hover:bg-amber-300 text-neutral-950 rounded-lg text-xs font-sans font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                id="view-full-calendar-btn"
              >
                <CalendarIcon className="w-4 h-4 stroke-[2.5]" />
                Buka Kalender Tenggat Waktu
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
