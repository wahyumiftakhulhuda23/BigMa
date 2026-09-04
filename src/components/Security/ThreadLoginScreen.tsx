import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Lock, 
  Unlock, 
  ShieldCheck, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles, 
  Link as LinkIcon, 
  X, 
  KeyRound, 
  Shield,
  LogOut,
  User
} from 'lucide-react';

interface QuestionItem {
  id: string;
  label: string;
  correctAnswerId: string;
  color: string;
  glowColor: string;
}

interface DateOption {
  id: string;
  dateText: string;
}

const QUESTIONS: QuestionItem[] = [
  { 
    id: 'kaysan', 
    label: 'Tanggal lahir kaysan', 
    correctAnswerId: 'ans_kaysan',
    color: '#F59E0B', // Amber
    glowColor: 'rgba(245, 158, 11, 0.4)'
  },
  { 
    id: 'ibu_lahir', 
    label: 'Tanggal Lahir ibu', 
    correctAnswerId: 'ans_ibu_lahir',
    color: '#EC4899', // Pink
    glowColor: 'rgba(236, 72, 153, 0.4)'
  },
  { 
    id: 'ibu_meninggal', 
    label: 'Tanggal ibu meninggal', 
    correctAnswerId: 'ans_ibu_meninggal',
    color: '#8B5CF6', // Purple
    glowColor: 'rgba(139, 92, 246, 0.4)'
  },
  { 
    id: 'ilman', 
    label: 'Tanggal lahir ilman', 
    correctAnswerId: 'ans_ilman',
    color: '#06B6D4', // Cyan
    glowColor: 'rgba(6, 182, 212, 0.4)'
  },
];

// Shuffled dates on right side to make the yarn quiz interactive
const DATE_OPTIONS: DateOption[] = [
  { id: 'ans_ibu_meninggal', dateText: '22 Agustus 2026' },
  { id: 'ans_kaysan', dateText: '13 November 2025' },
  { id: 'ans_ilman', dateText: '24 Maret 2007' },
  { id: 'ans_ibu_lahir', dateText: '17 Maret 1973' },
];

interface ThreadLoginScreenProps {
  onUnlock: () => void;
  onSignOut?: () => void;
  userEmail?: string | null;
  userName?: string | null;
}

export const ThreadLoginScreen: React.FC<ThreadLoginScreenProps> = ({ 
  onUnlock, 
  onSignOut,
  userEmail,
  userName 
}) => {
  // connections map: questionId -> answerId
  const [connections, setConnections] = useState<Record<string, string>>({});
  const [selectedQuestion, setSelectedQuestion] = useState<string | null>(null);
  const [statusState, setStatusState] = useState<{ type: 'idle' | 'success' | 'error'; message: string }>({
    type: 'idle',
    message: 'Tarik benang pengaman dengan menghubungkan setiap peristiwa ke tanggal yang tepat.',
  });
  const [isUnlocked, setIsUnlocked] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const leftPinRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const rightPinRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // Line coordinates for SVG rendering
  const [lines, setLines] = useState<{
    qId: string;
    ansId: string;
    x1: number;
    y1: number;
    x2: number;
    y2: number;
    color: string;
  }[]>([]);

  // Calculate SVG line paths based on DOM pin positions
  const updateLines = () => {
    if (!containerRef.current) return;
    const containerRect = containerRef.current.getBoundingClientRect();

    const newLines: typeof lines = [];
    Object.entries(connections).forEach(([qId, ansId]) => {
      const leftEl = leftPinRefs.current[qId];
      const rightEl = rightPinRefs.current[ansId];
      const qData = QUESTIONS.find(q => q.id === qId);

      if (leftEl && rightEl && qData) {
        const leftRect = leftEl.getBoundingClientRect();
        const rightRect = rightEl.getBoundingClientRect();

        const x1 = leftRect.right - containerRect.left;
        const y1 = leftRect.top + leftRect.height / 2 - containerRect.top;
        const x2 = rightRect.left - containerRect.left;
        const y2 = rightRect.top + rightRect.height / 2 - containerRect.top;

        newLines.push({
          qId,
          ansId,
          x1,
          y1,
          x2,
          y2,
          color: qData.color,
        });
      }
    });

    setLines(newLines);
  };

  useEffect(() => {
    updateLines();
    const handleResize = () => updateLines();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [connections, selectedQuestion]);

  // Handle clicking left item
  const handleSelectQuestion = (qId: string) => {
    if (selectedQuestion === qId) {
      setSelectedQuestion(null);
    } else {
      setSelectedQuestion(qId);
    }
  };

  // Handle clicking right item (Date)
  const handleSelectDate = (ansId: string) => {
    if (!selectedQuestion) {
      // If clicking date without question, check if any question is already connected to it
      const currentQ = Object.keys(connections).find(q => connections[q] === ansId);
      if (currentQ) {
        // Disconnect
        setConnections(prev => {
          const next = { ...prev };
          delete next[currentQ];
          return next;
        });
      }
      return;
    }

    // Connect selectedQuestion to this ansId
    setConnections(prev => {
      const next = { ...prev };
      // Remove any other question connected to this date
      Object.keys(next).forEach(k => {
        if (next[k] === ansId) {
          delete next[k];
        }
      });
      next[selectedQuestion] = ansId;
      return next;
    });

    setSelectedQuestion(null);
    setStatusState({
      type: 'idle',
      message: 'Benang terpasang. Lanjutkan ke pasangan berikutnya atau verifikasi jika sudah lengkap.',
    });
  };

  // Disconnect specific question
  const handleDisconnect = (qId: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setConnections(prev => {
      const next = { ...prev };
      delete next[qId];
      return next;
    });
  };

  // Reset all
  const handleReset = () => {
    setConnections({});
    setSelectedQuestion(null);
    setStatusState({
      type: 'idle',
      message: 'Semua benang telah direset. Silakan pasangkan kembali.',
    });
  };

  // Verify quiz answers
  const handleVerify = () => {
    const connectedCount = Object.keys(connections).length;
    if (connectedCount < 4) {
      setStatusState({
        type: 'error',
        message: `Baru ${connectedCount} dari 4 benang yang terhubung. Hubungkan semua 4 benang terlebih dahulu!`,
      });
      return;
    }

    let correctCount = 0;
    QUESTIONS.forEach(q => {
      if (connections[q.id] === q.correctAnswerId) {
        correctCount++;
      }
    });

    if (correctCount === 4) {
      setIsUnlocked(true);
      setStatusState({
        type: 'success',
        message: 'Kunci Benang Berhasil! Membuka Brankas BigMA...',
      });
      setTimeout(() => {
        onUnlock();
      }, 1000);
    } else {
      setStatusState({
        type: 'error',
        message: `Ada pasangan yang tidak cocok (${correctCount}/4 benar). Periksa kembali tanggal masing-masing peristiwa!`,
      });
    }
  };

  const totalConnected = Object.keys(connections).length;

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-[#E5E5E5] flex flex-col items-center justify-center p-4 sm:p-6 relative overflow-hidden select-none font-sans">
      {/* Background Ambience Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-80 h-80 bg-purple-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Main Container Card */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.96, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="w-full max-w-3xl bg-neutral-900/90 rounded-2xl border border-[#262626] shadow-2xl p-5 sm:p-7 relative backdrop-blur-md flex flex-col gap-6"
      >
        {/* User Account Bar & Logout */}
        {userEmail && (
          <div className="flex items-center justify-between pb-3 border-b border-[#262626] text-xs">
            <div className="flex items-center gap-2 text-neutral-300">
              <div className="w-6 h-6 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center font-bold text-[10px]">
                {userName ? userName.charAt(0).toUpperCase() : userEmail.charAt(0).toUpperCase()}
              </div>
              <div className="flex flex-col">
                <span className="font-semibold text-white leading-none">
                  {userName || userEmail.split('@')[0]}
                </span>
                <span className="text-[10px] text-neutral-500 font-mono">
                  {userEmail}
                </span>
              </div>
            </div>

            {onSignOut && (
              <button
                type="button"
                onClick={onSignOut}
                className="px-2.5 py-1 rounded-lg bg-neutral-950 hover:bg-neutral-800 text-neutral-400 hover:text-rose-300 border border-[#333] hover:border-rose-500/40 text-[11px] font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Ganti atau keluar dari akun"
              >
                <LogOut className="w-3 h-3" />
                <span>Ganti Akun</span>
              </button>
            )}
          </div>
        )}

        {/* Header Security Gate */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center gap-2 px-3 py-1 rounded-full bg-neutral-950 border border-amber-500/30 text-amber-400 text-xs font-mono font-bold tracking-wider uppercase mb-1 shadow-inner">
            <Shield className="w-3.5 h-3.5" />
            <span>Kuis Pengaman Brankas Benang</span>
          </div>

          <div className="flex items-center justify-center gap-3">
            <div className={`p-3 rounded-2xl border transition-all duration-300 ${
              isUnlocked 
                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40 shadow-lg shadow-emerald-500/20 scale-110' 
                : 'bg-amber-500/10 text-amber-400 border-amber-500/30 shadow-lg shadow-amber-500/10'
            }`}>
              {isUnlocked ? <Unlock className="w-7 h-7 stroke-[2.5]" /> : <Lock className="w-7 h-7 stroke-[2.5]" />}
            </div>
            <div className="text-left">
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2">
                Big<span className="text-amber-400">MA</span>
                <span className="text-xs font-bold text-neutral-400 uppercase tracking-widest bg-neutral-800 px-2 py-0.5 rounded border border-neutral-700">
                  Security Gate
                </span>
              </h1>
              <p className="text-xs text-neutral-400">
                Cocokkan setiap nama / peristiwa di sebelah kiri ke tanggal yang benar di sebelah kanan menggunakan tarikan benang.
              </p>
            </div>
          </div>
        </div>

        {/* Status Notification */}
        <motion.div 
          animate={{ 
            scale: statusState.type === 'error' ? [1, 1.02, 0.98, 1] : 1 
          }}
          transition={{ duration: 0.3 }}
          className={`p-3 rounded-xl text-xs flex items-center justify-between gap-3 border transition-colors ${
            statusState.type === 'success'
              ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
              : statusState.type === 'error'
              ? 'bg-rose-500/15 border-rose-500/40 text-rose-300'
              : 'bg-neutral-950 border-[#262626] text-neutral-300'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {statusState.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : statusState.type === 'error' ? (
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            ) : (
              <LinkIcon className="w-4 h-4 text-amber-400 shrink-0" />
            )}
            <span className="font-medium">{statusState.message}</span>
          </div>

          <div className="text-[11px] font-mono font-bold text-neutral-400 shrink-0 bg-neutral-900 px-2.5 py-1 rounded-lg border border-[#333]">
            {totalConnected}/4 Terhubung
          </div>
        </motion.div>

        {/* Interactive Thread Area */}
        <div 
          ref={containerRef} 
          className="relative min-h-[300px] bg-neutral-950/90 rounded-xl border border-[#262626] p-4 sm:p-6 flex justify-between items-center"
        >
          {/* SVG Canvas for Strings / Yarn Lines */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none z-10 overflow-visible">
            <defs>
              <filter id="yarn-glow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            {lines.map((line) => {
              // Create smooth bezier curve for natural yarn string look
              const dx = Math.abs(line.x2 - line.x1) * 0.5;
              const pathD = `M ${line.x1} ${line.y1} C ${line.x1 + dx} ${line.y1}, ${line.x2 - dx} ${line.y2}, ${line.x2} ${line.y2}`;

              return (
                <g key={`${line.qId}-${line.ansId}`}>
                  {/* Outer Yarn Glow */}
                  <path
                    d={pathD}
                    fill="none"
                    stroke={line.color}
                    strokeWidth="7"
                    strokeOpacity="0.25"
                    strokeLinecap="round"
                  />
                  {/* Main Thread Line */}
                  <path
                    d={pathD}
                    fill="none"
                    stroke={line.color}
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    strokeDasharray="8,4"
                    filter="url(#yarn-glow)"
                    className="animate-[dash_20s_linear_infinite]"
                  />
                  {/* Connection Node Circles */}
                  <circle cx={line.x1} cy={line.y1} r="4.5" fill={line.color} stroke="#0A0A0A" strokeWidth="1.5" />
                  <circle cx={line.x2} cy={line.y2} r="4.5" fill={line.color} stroke="#0A0A0A" strokeWidth="1.5" />
                </g>
              );
            })}
          </svg>

          {/* Left Column: Questions / Events */}
          <div className="w-[45%] sm:w-[42%] space-y-3 z-20">
            <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-neutral-400 mb-2">
              1. Pilih Nama / Peristiwa
            </div>
            {QUESTIONS.map((q) => {
              const isSelected = selectedQuestion === q.id;
              const isConnected = !!connections[q.id];

              return (
                <div key={q.id} className="relative group">
                  <motion.button
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={() => handleSelectQuestion(q.id)}
                    className={`w-full text-left p-3 rounded-xl border text-xs font-semibold flex items-center justify-between gap-2 transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-amber-500/20 text-white border-amber-400 shadow-lg shadow-amber-500/20 ring-2 ring-amber-400/40'
                        : isConnected
                        ? 'bg-neutral-900 text-neutral-100 border-[#383838]'
                        : 'bg-neutral-900/70 text-neutral-300 border-[#262626] hover:border-neutral-700 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-2.5 h-2.5 rounded-full shrink-0 shadow-xs" 
                        style={{ backgroundColor: q.color }} 
                      />
                      <span className="leading-tight">{q.label}</span>
                    </div>

                    {/* Right connector Pin on left card */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      {isConnected && (
                        <span
                          role="button"
                          tabIndex={0}
                          onClick={(e) => handleDisconnect(q.id, e)}
                          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleDisconnect(q.id, e as any); }}
                          className="p-1 rounded hover:bg-neutral-800 text-neutral-500 hover:text-rose-400 transition-colors cursor-pointer"
                          title="Lepas benang ini"
                        >
                          <X className="w-3.5 h-3.5" />
                        </span>
                      )}
                      <div
                        ref={(el) => { leftPinRefs.current[q.id] = el; }}
                        className={`w-4 h-4 rounded-full border-2 transition-all flex items-center justify-center ${
                          isConnected
                            ? 'border-white bg-neutral-950'
                            : isSelected
                            ? 'border-amber-400 bg-amber-400 animate-ping'
                            : 'border-neutral-500 bg-neutral-900 group-hover:border-amber-400'
                        }`}
                        style={{
                          borderColor: isConnected ? q.color : undefined,
                          backgroundColor: isConnected ? q.color : undefined,
                        }}
                      />
                    </div>
                  </motion.button>
                </div>
              );
            })}
          </div>

          {/* Center Guide Divider */}
          <div className="hidden sm:flex flex-col items-center justify-center text-neutral-700 z-0 px-2 text-[10px] font-mono tracking-widest uppercase">
            <span className="rotate-90 my-2 text-neutral-600 font-bold">&bull; &bull; &bull;</span>
          </div>

          {/* Right Column: Shuffled Date Options */}
          <div className="w-[45%] sm:w-[42%] space-y-3 z-20">
            <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-neutral-400 mb-2 text-right">
              2. Pasangkan ke Tanggal
            </div>
            {DATE_OPTIONS.map((opt) => {
              // Find if any question is connected to this date
              const connectedQId = Object.keys(connections).find(q => connections[q] === opt.id);
              const connectedQ = connectedQId ? QUESTIONS.find(q => q.id === connectedQId) : null;
              const isTargeted = selectedQuestion && !connectedQ;

              return (
                <div key={opt.id} className="relative group">
                  <motion.button
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={() => handleSelectDate(opt.id)}
                    className={`w-full text-right p-3 rounded-xl border text-xs font-mono font-bold flex items-center justify-between gap-2 transition-all cursor-pointer ${
                      connectedQ
                        ? 'bg-neutral-900 text-white border-[#383838]'
                        : isTargeted
                        ? 'bg-neutral-900/90 text-amber-300 border-dashed border-amber-500/60 shadow-md shadow-amber-500/10 animate-pulse'
                        : 'bg-neutral-900/70 text-neutral-300 border-[#262626] hover:border-neutral-700 hover:text-white'
                    }`}
                  >
                    {/* Left Pin on Right Date Card */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      <div
                        ref={(el) => { rightPinRefs.current[opt.id] = el; }}
                        className={`w-4 h-4 rounded-full border-2 transition-all flex items-center justify-center ${
                          connectedQ
                            ? 'border-white bg-neutral-950'
                            : isTargeted
                            ? 'border-amber-400 bg-amber-400/50'
                            : 'border-neutral-500 bg-neutral-900 group-hover:border-amber-400'
                        }`}
                        style={{
                          borderColor: connectedQ ? connectedQ.color : undefined,
                          backgroundColor: connectedQ ? connectedQ.color : undefined,
                        }}
                      />
                    </div>

                    <div className="flex flex-col items-end">
                      <span className="leading-tight text-neutral-100">{opt.dateText}</span>
                      {connectedQ && (
                        <span 
                          className="text-[9px] font-sans font-medium px-1.5 py-0.2 rounded mt-0.5 truncate max-w-[130px]"
                          style={{ color: connectedQ.color }}
                        >
                          {connectedQ.label}
                        </span>
                      )}
                    </div>
                  </motion.button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Bottom Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
          <button
            type="button"
            onClick={handleReset}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-[#262626] hover:border-neutral-700 bg-neutral-950 hover:bg-neutral-800 text-xs font-medium text-neutral-400 hover:text-neutral-200 flex items-center justify-center gap-2 transition-colors cursor-pointer"
            id="reset-yarn-quiz-btn"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Reset Benang</span>
          </button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleVerify}
            disabled={isUnlocked}
            className={`w-full sm:w-auto px-6 py-2.5 rounded-xl text-xs font-sans font-black flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer ${
              isUnlocked
                ? 'bg-emerald-500 text-neutral-950 shadow-emerald-500/30'
                : totalConnected === 4
                ? 'bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-neutral-950 shadow-amber-500/25 ring-2 ring-amber-400/50 animate-pulse'
                : 'bg-neutral-800 text-neutral-400 border border-[#333] hover:text-neutral-200'
            }`}
            id="verify-yarn-quiz-btn"
          >
            {isUnlocked ? (
              <>
                <Sparkles className="w-4 h-4 stroke-[3]" />
                <span>Brankas Berhasil Terbuka!</span>
              </>
            ) : (
              <>
                <KeyRound className="w-4 h-4 stroke-[3]" />
                <span>Buka Kunci Brankas BigMA</span>
              </>
            )}
          </motion.button>
        </div>

        {/* Footer Note */}
        <div className="text-center text-[11px] text-neutral-500 border-t border-[#262626] pt-3">
          Sistem Verifikasi Multi-Kunci &bull; BigMA Account Manajement Vault &bull; &copy; 2026
        </div>
      </motion.div>
    </div>
  );
};
