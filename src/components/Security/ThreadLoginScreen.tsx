import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Lock, 
  Unlock, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle, 
  Link as LinkIcon, 
  KeyRound, 
  Shield,
  Smartphone,
  Globe2,
  HelpCircle
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

const REQUIRED_ACCESS_CODE = '2000';

interface ThreadLoginScreenProps {
  onUnlock: () => void;
}

export const ThreadLoginScreen: React.FC<ThreadLoginScreenProps> = ({ 
  onUnlock 
}) => {
  // Access Code State (PIN: 2000)
  const [accessCode, setAccessCode] = useState('');
  
  // Connections map: questionId -> answerId
  const [connections, setConnections] = useState<Record<string, string>>({});
  const [selectedQuestion, setSelectedQuestion] = useState<string | null>(null);
  const [statusState, setStatusState] = useState<{ type: 'idle' | 'success' | 'error'; message: string }>({
    type: 'idle',
    message: 'Masukkan kode akses brankas (2000) dan hubungkan seluruh benang pengaman ke tanggal yang tepat.',
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
      message: 'Benang terpasang. Lanjutkan atau klik Buka Brankas jika sudah selesai.',
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
      message: 'Semua benang telah direset. Silakan hubungkan kembali.',
    });
  };

  // Verify quiz answers and PIN code
  const handleVerifyAndUnlock = (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    // 1. Verify Access Code
    if (accessCode.trim() !== REQUIRED_ACCESS_CODE) {
      setStatusState({
        type: 'error',
        message: 'Kode Akses Brankas tidak valid. Masukkan kode: 2000',
      });
      return;
    }

    // 2. Verify Yarn Connections count
    const connectedCount = Object.keys(connections).length;
    if (connectedCount < 4) {
      setStatusState({
        type: 'error',
        message: `Baru ${connectedCount} dari 4 benang terhubung. Lengkapi semua 4 benang pengaman!`,
      });
      return;
    }

    // 3. Verify Yarn Connections accuracy
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
        message: 'Kode & Kuis Benang Valid! Membuka Brankas Cloud BigMA...',
      });
      setTimeout(() => {
        onUnlock();
      }, 700);
    } else {
      setStatusState({
        type: 'error',
        message: `Pasangan benang belum tepat (${correctCount}/4 benar). Periksa kembali tanggal masing-masing peristiwa!`,
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
        className="w-full max-w-3xl bg-neutral-900/95 rounded-2xl border border-[#262626] shadow-2xl p-5 sm:p-7 relative backdrop-blur-md flex flex-col gap-5"
        id="security-gate-container"
      >
        {/* Header Security Gate */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center gap-2 px-3.5 py-1 rounded-full bg-neutral-950 border border-emerald-500/30 text-emerald-400 text-xs font-mono font-bold tracking-wider uppercase mb-1 shadow-inner">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <Globe2 className="w-3.5 h-3.5" />
            <span>Multi-Device Lifetime Cloud Sync (Firestore Aktif)</span>
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
                  Cloud Security Gate
                </span>
              </h1>
              <p className="text-xs text-neutral-400">
                Masukkan kode akses <b>2000</b> dan pasangkan 4 benang pengaman untuk membuka brankas cloud.
              </p>
            </div>
          </div>
        </div>

        {/* Section 1: Kode Akses Keamanan (PIN: 2000) */}
        <div className="p-4 bg-neutral-950 border border-[#262626] rounded-xl flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="w-9 h-9 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
              <KeyRound className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-white">1. Kode Akses Brankas</p>
              <p className="text-[11px] text-neutral-400">Syarat kode masuk: <span className="font-mono text-amber-400 font-bold">2000</span></p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <input
              type="password"
              inputMode="numeric"
              maxLength={10}
              value={accessCode}
              onChange={(e) => setAccessCode(e.target.value)}
              placeholder="Ketik kode 2000..."
              className="w-full sm:w-44 bg-neutral-900 border border-[#333] focus:border-amber-400 rounded-lg px-3 py-2 text-xs font-mono font-bold text-center tracking-widest text-white placeholder-neutral-600 focus:outline-none focus:ring-1 focus:ring-amber-400 transition-colors"
              id="security-gate-pin-input"
            />
            {accessCode === REQUIRED_ACCESS_CODE && (
              <span className="p-1.5 bg-emerald-500/10 text-emerald-400 rounded-lg border border-emerald-500/30 text-xs font-bold shrink-0">
                ✓ Valid
              </span>
            )}
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
            {totalConnected}/4 Benang
          </div>
        </motion.div>

        {/* Section 2: Interactive Thread Quiz Area */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs px-1 text-neutral-400">
            <span className="font-bold text-white">2. Kuis Benang Pengaman:</span>
            <span className="text-[11px]">Klik nama di kiri lalu klik tanggal yang cocok di kanan</span>
          </div>

          <div 
            ref={containerRef} 
            className="relative min-h-[300px] bg-neutral-950/90 rounded-xl border border-[#262626] p-4 sm:p-6 flex justify-between items-center"
          >
            {/* SVG Canvas for Strings / Yarn Lines */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none z-10">
              <defs>
                <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
              </defs>

              {lines.map((line) => {
                // Curved bezier path
                const dx = Math.abs(line.x2 - line.x1);
                const cp1x = line.x1 + dx * 0.45;
                const cp1y = line.y1;
                const cp2x = line.x2 - dx * 0.45;
                const cp2y = line.y2;

                const pathData = `M ${line.x1} ${line.y1} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${line.x2} ${line.y2}`;

                return (
                  <g key={`${line.qId}-${line.ansId}`}>
                    {/* Shadow / Glow Line */}
                    <path
                      d={pathData}
                      fill="none"
                      stroke={line.color}
                      strokeWidth="5"
                      strokeOpacity="0.4"
                      filter="url(#glow)"
                    />
                    {/* Core Yarn Cord */}
                    <path
                      d={pathData}
                      fill="none"
                      stroke={line.color}
                      strokeWidth="2.5"
                      strokeDasharray="4 2"
                      className="animate-pulse"
                    />
                    {/* End anchor pin rings */}
                    <circle cx={line.x1} cy={line.y1} r="4" fill={line.color} />
                    <circle cx={line.x2} cy={line.y2} r="4" fill={line.color} />
                  </g>
                );
              })}
            </svg>

            {/* Left Column: Questions / Events */}
            <div className="flex flex-col gap-3.5 z-20 w-[46%] sm:w-60">
              <p className="text-[10px] font-mono text-neutral-500 uppercase tracking-wider mb-1 font-bold">
                Nama / Peristiwa
              </p>
              {QUESTIONS.map((q) => {
                const isSelected = selectedQuestion === q.id;
                const isConnected = !!connections[q.id];

                return (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    key={q.id}
                    type="button"
                    onClick={() => handleSelectQuestion(q.id)}
                    className={`relative p-3 rounded-xl text-left text-xs font-semibold transition-all border flex items-center justify-between gap-2 cursor-pointer ${
                      isSelected
                        ? 'bg-neutral-800 border-amber-400 text-white shadow-lg ring-1 ring-amber-400'
                        : isConnected
                        ? 'bg-neutral-900 border-neutral-700 text-neutral-200'
                        : 'bg-neutral-900/60 border-[#262626] text-neutral-400 hover:text-neutral-200 hover:border-neutral-700'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <div 
                        className="w-2.5 h-2.5 rounded-full shrink-0" 
                        style={{ backgroundColor: q.color }}
                      />
                      <span className="truncate">{q.label}</span>
                    </div>

                    {/* Left Pin Anchor Point */}
                    <div
                      ref={(el) => { leftPinRefs.current[q.id] = el; }}
                      className={`w-3.5 h-3.5 rounded-full border-2 transition-all flex items-center justify-center shrink-0 ${
                        isConnected
                          ? 'border-white bg-amber-400'
                          : isSelected
                          ? 'border-amber-400 bg-amber-400/30 animate-ping'
                          : 'border-neutral-600 bg-neutral-950'
                      }`}
                    />

                    {/* Disconnect button if connected */}
                    {isConnected && (
                      <button
                        type="button"
                        onClick={(e) => handleDisconnect(q.id, e)}
                        className="absolute -top-1.5 -left-1.5 w-4 h-4 rounded-full bg-rose-500 text-white flex items-center justify-center text-[10px] hover:bg-rose-600 shadow-sm"
                        title="Lepas benang"
                      >
                        ×
                      </button>
                    )}
                  </motion.button>
                );
              })}
            </div>

            {/* Right Column: Date Targets */}
            <div className="flex flex-col gap-3.5 z-20 w-[46%] sm:w-60">
              <p className="text-[10px] font-mono text-neutral-500 uppercase tracking-wider mb-1 font-bold text-right">
                Pilihan Tanggal
              </p>
              {DATE_OPTIONS.map((opt) => {
                const connectedQId = Object.keys(connections).find(qId => connections[qId] === opt.id);
                const isConnected = !!connectedQId;
                const connectedQData = connectedQId ? QUESTIONS.find(q => q.id === connectedQId) : null;

                return (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    key={opt.id}
                    type="button"
                    onClick={() => handleSelectDate(opt.id)}
                    className={`relative p-3 rounded-xl text-right text-xs font-mono font-bold transition-all border flex items-center justify-between gap-2 cursor-pointer ${
                      isConnected
                        ? 'bg-neutral-900 border-neutral-700 text-white'
                        : selectedQuestion
                        ? 'bg-neutral-900 border-dashed border-amber-500/40 text-neutral-300 hover:border-amber-400 hover:bg-neutral-800'
                        : 'bg-neutral-900/60 border-[#262626] text-neutral-400 hover:text-neutral-200 hover:border-neutral-700'
                    }`}
                  >
                    {/* Right Pin Anchor Point */}
                    <div
                      ref={(el) => { rightPinRefs.current[opt.id] = el; }}
                      className={`w-3.5 h-3.5 rounded-full border-2 transition-all flex items-center justify-center shrink-0 ${
                        isConnected
                          ? 'border-white'
                          : selectedQuestion
                          ? 'border-amber-400 bg-amber-400/20'
                          : 'border-neutral-600 bg-neutral-950'
                      }`}
                      style={{
                        backgroundColor: connectedQData ? connectedQData.color : undefined,
                      }}
                    />

                    <span className="truncate">{opt.dateText}</span>
                  </motion.button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Action Controls & Unlock Button */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
          <button
            type="button"
            onClick={handleReset}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-neutral-950 hover:bg-neutral-800 text-neutral-400 hover:text-white border border-[#262626] text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
            id="reset-yarn-btn"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Reset Benang</span>
          </button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="button"
            onClick={handleVerifyAndUnlock}
            className="w-full sm:w-auto flex-1 py-3 px-6 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-neutral-950 font-bold text-xs rounded-xl shadow-lg shadow-amber-500/25 flex items-center justify-center gap-2 cursor-pointer transition-all"
            id="verify-unlock-btn"
          >
            <Shield className="w-4 h-4" />
            <span>Buka Brankas Cloud BigMA</span>
          </motion.button>
        </div>

        {/* Multi-Device Lifetime Cloud Badges */}
        <div className="pt-2 border-t border-[#262626] grid grid-cols-2 gap-2 text-[10px] text-neutral-400">
          <div className="flex items-center gap-1.5 p-2 rounded-lg bg-neutral-950/60 border border-[#222]">
            <Smartphone className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>HP, Tablet, Laptop &amp; PC</span>
          </div>
          <div className="flex items-center gap-1.5 p-2 rounded-lg bg-neutral-950/60 border border-[#222]">
            <Globe2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>Sinkronisasi Otomatis Seumur Hidup</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
