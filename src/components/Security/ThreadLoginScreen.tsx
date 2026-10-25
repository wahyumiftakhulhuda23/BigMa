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
  HelpCircle,
  Users,
  UserCheck,
  EyeOff,
  PlaySquare,
  Image as ImageIcon,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  Check
} from 'lucide-react';
import { UserRole } from '../../types';

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
  onUnlock: (role: UserRole) => void;
}

export const ThreadLoginScreen: React.FC<ThreadLoginScreenProps> = ({ 
  onUnlock 
}) => {
  // Mode selection: Admin (full master) or Guest (restricted content operator)
  const [activeRoleTab, setActiveRoleTab] = useState<UserRole>('admin');

  // Access Code State (PIN: 2000)
  const [accessCode, setAccessCode] = useState('');
  
  // Connections map: questionId -> answerId
  const [connections, setConnections] = useState<Record<string, string>>({});
  const [selectedQuestion, setSelectedQuestion] = useState<string | null>(null);
  const [statusState, setStatusState] = useState<{ type: 'idle' | 'success' | 'error'; message: string }>({
    type: 'idle',
    message: 'Masukkan kode akses brankas dan hubungkan seluruh benang pengaman ke tanggal yang tepat.',
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
    if (activeRoleTab === 'admin') {
      updateLines();
      const handleResize = () => updateLines();
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }
  }, [connections, selectedQuestion, activeRoleTab]);

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

  // Verify quiz answers and PIN code for Admin mode
  const handleVerifyAndUnlockAdmin = (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    // 1. Verify Access Code
    if (accessCode.trim() !== REQUIRED_ACCESS_CODE) {
      setStatusState({
        type: 'error',
        message: 'Kode Akses Brankas tidak valid.',
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
        message: 'Kode & Kuis Benang Valid! Membuka Brankas Admin BigMA...',
      });
      setTimeout(() => {
        onUnlock('admin');
      }, 700);
    } else {
      setStatusState({
        type: 'error',
        message: `Pasangan benang belum tepat (${correctCount}/4 benar). Periksa kembali tanggal masing-masing peristiwa!`,
      });
    }
  };

  // Handle immediate entry for Guest mode
  const handleUnlockGuest = () => {
    setIsUnlocked(true);
    setStatusState({
      type: 'success',
      message: 'Memasuki Mode Guest / Operator Konten...',
    });
    setTimeout(() => {
      onUnlock('guest');
    }, 400);
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
                : activeRoleTab === 'admin'
                ? 'bg-amber-500/10 text-amber-400 border-amber-500/30 shadow-lg shadow-amber-500/10'
                : 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30 shadow-lg shadow-indigo-500/10'
            }`}>
              {isUnlocked ? (
                <Unlock className="w-7 h-7 stroke-[2.5]" />
              ) : activeRoleTab === 'admin' ? (
                <Lock className="w-7 h-7 stroke-[2.5]" />
              ) : (
                <Users className="w-7 h-7 stroke-[2.5]" />
              )}
            </div>
            <div className="text-left">
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2">
                Big<span className="text-amber-400">MA</span>
                <span className="text-xs font-bold text-neutral-400 uppercase tracking-widest bg-neutral-800 px-2 py-0.5 rounded border border-neutral-700">
                  {activeRoleTab === 'admin' ? 'Admin Master Gate' : 'Guest Operator Gate'}
                </span>
              </h1>
              <p className="text-xs text-neutral-400">
                {activeRoleTab === 'admin' 
                  ? 'Mode Admin: Akses penuh keseluruhan akun, masukkan kode akses dan kuis benang.' 
                  : 'Mode Guest: Khusus operator Penjadwalan YouTube & Input Data Microstock.'}
              </p>
            </div>
          </div>
        </div>

        {/* Role Mode Switcher Tabs */}
        <div className="grid grid-cols-2 p-1.5 bg-neutral-950 border border-[#262626] rounded-xl gap-1.5 shadow-inner">
          <button
            type="button"
            onClick={() => setActiveRoleTab('admin')}
            className={`flex items-center justify-center gap-2.5 py-2.5 px-4 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeRoleTab === 'admin'
                ? 'bg-amber-500 text-neutral-950 shadow-md shadow-amber-500/25 ring-1 ring-amber-400'
                : 'text-neutral-400 hover:text-white hover:bg-neutral-900/60'
            }`}
            id="tab-login-admin"
          >
            <Shield className="w-4 h-4 shrink-0" />
            <div className="text-left leading-tight">
              <span className="block">Menu Admin</span>
              <span className={`text-[10px] block font-mono font-normal ${activeRoleTab === 'admin' ? 'text-neutral-900 font-semibold' : 'text-neutral-500'}`}>
                Kode Akses + Kuis Benang
              </span>
            </div>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveRoleTab('guest');
              onUnlock('guest');
            }}
            className={`flex items-center justify-center gap-2.5 py-2.5 px-4 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeRoleTab === 'guest'
                ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-md shadow-indigo-600/30 ring-1 ring-indigo-400'
                : 'text-neutral-400 hover:text-white hover:bg-neutral-900/60'
            }`}
            id="tab-login-guest"
          >
            <Users className="w-4 h-4 shrink-0" />
            <div className="text-left leading-tight">
              <span className="block">Menu Guest</span>
              <span className={`text-[10px] block font-mono font-normal ${activeRoleTab === 'guest' ? 'text-indigo-200' : 'text-neutral-500'}`}>
                YouTube &amp; Microstock
              </span>
            </div>
          </button>
        </div>

        {/* ---------------------------------------------------- */}
        {/* VIEW 1: GUEST MODE LOGIN PANEL                      */}
        {/* ---------------------------------------------------- */}
        {activeRoleTab === 'guest' && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="space-y-4"
          >
            <div className="p-4 rounded-xl bg-indigo-950/20 border border-indigo-500/30 space-y-3">
              <div className="flex items-center gap-2 text-indigo-400 font-bold text-xs uppercase tracking-wider">
                <Sparkles className="w-4 h-4" />
                <span>Portal Operator Konten &amp; Microstock (Guest Mode)</span>
              </div>
              <p className="text-xs text-neutral-300 leading-relaxed">
                Mode Guest dirancang untuk tim konten atau operator harian yang bertugas mengelola jadwal upload serta metrik microstock tanpa memerlukan kode akses admin.
              </p>

              {/* Permissions & Capabilities Breakdown */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
                {/* Allowed Actions */}
                <div className="p-3 rounded-lg bg-neutral-950/80 border border-emerald-500/30 space-y-1.5">
                  <div className="flex items-center gap-1.5 text-emerald-400 font-bold text-xs">
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                    <span>Fitur yang Dapat Diedit:</span>
                  </div>
                  <ul className="text-[11px] text-neutral-300 space-y-1 pl-1 font-sans">
                    <li className="flex items-start gap-1.5">
                      <PlaySquare className="w-3.5 h-3.5 text-red-400 shrink-0 mt-0.5" />
                      <span><strong>Penjadwalan YouTube:</strong> Jadwal Upload &amp; Status, Draft, Siap Upload, Monet, Jumlah Bahan, Keterangan, Aksi.</span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <ImageIcon className="w-3.5 h-3.5 text-indigo-400 shrink-0 mt-0.5" />
                      <span><strong>Data Microstock:</strong> Jumlah Item, New, Reject, Konsentrasi Akun, Aksi.</span>
                    </li>
                  </ul>
                </div>

                {/* Restricted & Masked */}
                <div className="p-3 rounded-lg bg-neutral-950/80 border border-rose-500/30 space-y-1.5">
                  <div className="flex items-center gap-1.5 text-rose-400 font-bold text-xs">
                    <EyeOff className="w-3.5 h-3.5 shrink-0" />
                    <span>Proteksi Kredensial &amp; Keamanan:</span>
                  </div>
                  <ul className="text-[11px] text-neutral-300 space-y-1 pl-1 font-sans">
                    <li className="flex items-start gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-400 shrink-0 mt-1.5" />
                      <span><strong>Kredensial Akun:</strong> Tidak bisa diedit, hanya admin yang dapat mengubah kredensial.</span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-400 shrink-0 mt-1.5" />
                      <span><strong>Gmail Disamarkan:</strong> Email master hanya tampil separuh, sisanya disamarkan (<code className="text-amber-300 font-mono text-[10px]">wah******@gmail.com</code>).</span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-400 shrink-0 mt-1.5" />
                      <span><strong>Proteksi Menu:</strong> Menu Keuangan, Master Gmail, Office, &amp; Project Dev disembunyikan.</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Guest Entry CTA Button */}
            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              type="button"
              onClick={handleUnlockGuest}
              className="w-full py-3.5 px-6 bg-gradient-to-r from-indigo-600 via-indigo-500 to-indigo-600 hover:from-indigo-500 hover:to-indigo-400 text-white font-bold text-sm rounded-xl shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2.5 cursor-pointer transition-all"
              id="btn-login-guest-submit"
            >
              <UserCheck className="w-5 h-5" />
              <span>Masuk Sebagai Guest (Operator YouTube &amp; Microstock)</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </motion.button>
          </motion.div>
        )}

        {/* ---------------------------------------------------- */}
        {/* VIEW 2: ADMIN MODE (PIN 2000 + KUIS BENANG)         */}
        {/* ---------------------------------------------------- */}
        {activeRoleTab === 'admin' && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="space-y-4"
          >
            {/* Section 1: Kode Akses Keamanan */}
            <div className="p-4 bg-neutral-950 border border-[#262626] rounded-xl flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <div className="w-9 h-9 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                  <KeyRound className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-white">1. Masukkan Kode Akses Brankas</p>
                  <p className="text-[11px] text-neutral-400">Otorisasi Admin Master: <span className="font-mono text-amber-400 font-bold">PIN Terproteksi</span></p>
                </div>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <input
                  type="password"
                  inputMode="numeric"
                  maxLength={10}
                  value={accessCode}
                  onChange={(e) => setAccessCode(e.target.value)}
                  placeholder="Masukkan PIN akses..."
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
              className={`p-3 rounded-xl border text-xs flex items-center gap-2.5 transition-colors ${
                statusState.type === 'error' 
                  ? 'bg-rose-500/10 border-rose-500/30 text-rose-300' 
                  : statusState.type === 'success'
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                  : 'bg-neutral-950 border-[#262626] text-neutral-400'
              }`}
            >
              {statusState.type === 'error' && <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />}
              {statusState.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
              {statusState.type === 'idle' && <HelpCircle className="w-4 h-4 text-amber-400 shrink-0" />}
              <span className="flex-1 font-medium">{statusState.message}</span>
            </motion.div>

            {/* Section 2: Kuis Benang Pengaman */}
            <div className="space-y-2">
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                  <LinkIcon className="w-3.5 h-3.5 text-amber-400" />
                  <span className="text-xs font-bold text-white uppercase tracking-wider">
                    2. Kuis Benang Pengaman ({totalConnected}/4 Terhubung)
                  </span>
                </div>
                <span className="text-[11px] text-neutral-400 font-mono">
                  Klik peristiwa &rarr; klik tanggal yang cocok
                </span>
              </div>

              {/* Yarn Interactive Board */}
              <div 
                ref={containerRef}
                className="relative bg-neutral-950 border border-[#262626] rounded-xl p-4 sm:p-5 min-h-[290px] flex items-center justify-between gap-4 overflow-hidden"
                id="yarn-board-interactive"
              >
                {/* SVG Lines Layer */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none z-10">
                  <defs>
                    {QUESTIONS.map(q => (
                      <filter key={`glow-${q.id}`} id={`glow-${q.id}`} x="-20%" y="-20%" width="140%" height="140%">
                        <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor={q.color} floodOpacity="0.8" />
                      </filter>
                    ))}
                  </defs>
                  {lines.map((line) => {
                    const dx = line.x2 - line.x1;
                    const curveIntensity = Math.min(Math.abs(dx) * 0.45, 120);
                    const pathData = `M ${line.x1} ${line.y1} C ${line.x1 + curveIntensity} ${line.y1}, ${line.x2 - curveIntensity} ${line.y2}, ${line.x2} ${line.y2}`;

                    return (
                      <g key={`${line.qId}-${line.ansId}`}>
                        {/* Glow Line */}
                        <path
                          d={pathData}
                          fill="none"
                          stroke={line.color}
                          strokeWidth="7"
                          strokeOpacity="0.3"
                          strokeLinecap="round"
                        />
                        {/* Solid Yarn Line */}
                        <path
                          d={pathData}
                          fill="none"
                          stroke={line.color}
                          strokeWidth="3.5"
                          strokeLinecap="round"
                          className="transition-all duration-300"
                        />
                        {/* Center Knot Pin */}
                        <circle
                          cx={(line.x1 + line.x2) / 2}
                          cy={(line.y1 + line.y2) / 2}
                          r="4"
                          fill="#FFFFFF"
                          stroke={line.color}
                          strokeWidth="2"
                        />
                      </g>
                    );
                  })}
                </svg>

                {/* Left Side: Questions */}
                <div className="flex flex-col gap-2.5 w-1/2 max-w-[260px] z-20">
                  {QUESTIONS.map((q) => {
                    const isSelected = selectedQuestion === q.id;
                    const isConnected = !!connections[q.id];

                    return (
                      <motion.button
                        key={q.id}
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                        type="button"
                        onClick={() => handleSelectQuestion(q.id)}
                        className={`relative p-3 rounded-xl text-left text-xs font-bold transition-all border flex items-center justify-between gap-2 cursor-pointer ${
                          isSelected
                            ? 'bg-neutral-800 text-white shadow-lg ring-2'
                            : isConnected
                            ? 'bg-neutral-900 border-neutral-700 text-neutral-200'
                            : 'bg-neutral-900/60 border-[#262626] text-neutral-300 hover:border-neutral-700 hover:bg-neutral-800/80'
                        }`}
                        style={{
                          borderColor: isSelected ? q.color : undefined,
                        }}
                      >
                        <span className="truncate">{q.label}</span>

                        {/* Anchor Dot Pin */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          {isConnected && (
                            <span 
                              onClick={(e) => handleDisconnect(q.id, e)}
                              className="w-4 h-4 rounded-full bg-neutral-800 hover:bg-rose-500/20 text-neutral-400 hover:text-rose-400 flex items-center justify-center text-[10px] transition-colors"
                              title="Lepas benang"
                            >
                              &times;
                            </span>
                          )}
                          <div
                            ref={(el) => { leftPinRefs.current[q.id] = el; }}
                            className={`w-3.5 h-3.5 rounded-full border-2 transition-all flex items-center justify-center ${
                              isSelected
                                ? 'scale-125 border-white'
                                : isConnected
                                ? 'border-neutral-400'
                                : 'border-neutral-600 bg-neutral-950'
                            }`}
                            style={{
                              backgroundColor: isConnected || isSelected ? q.color : undefined,
                            }}
                          />
                        </div>
                      </motion.button>
                    );
                  })}
                </div>

                {/* Right Side: Date Options */}
                <div className="flex flex-col gap-2.5 w-1/2 max-w-[260px] z-20">
                  {DATE_OPTIONS.map((opt) => {
                    const connectedQId = Object.keys(connections).find(q => connections[q] === opt.id);
                    const isConnected = !!connectedQId;
                    const connectedQData = QUESTIONS.find(q => q.id === connectedQId);

                    return (
                      <motion.button
                        key={opt.id}
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
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
                onClick={handleVerifyAndUnlockAdmin}
                className="w-full sm:w-auto flex-1 py-3 px-6 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-neutral-950 font-bold text-xs rounded-xl shadow-lg shadow-amber-500/25 flex items-center justify-center gap-2 cursor-pointer transition-all"
                id="verify-unlock-btn"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Buka Brankas Admin BigMA</span>
              </motion.button>
            </div>
          </motion.div>
        )}

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
