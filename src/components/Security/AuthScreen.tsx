import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Lock, 
  Mail, 
  KeyRound, 
  ArrowRight, 
  ShieldCheck, 
  Globe2, 
  AlertCircle,
  CheckCircle2,
  Smartphone
} from 'lucide-react';
import { 
  authenticateCredentials, 
  BigMAUser 
} from '../../utils/authService';

interface AuthScreenProps {
  onAuthenticated: (user: BigMAUser) => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onAuthenticated }) => {
  // Clean login state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // UI states
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!email.trim() || !password.trim()) {
      setErrorMsg('Email dan kata sandi wajib diisi.');
      return;
    }

    setLoading(true);

    try {
      const res = await authenticateCredentials(email, password);
      if (!res.success || !res.user) {
        setErrorMsg(res.error || 'Email atau kata sandi tidak cocok.');
        return;
      }
      setSuccessMsg('Berhasil masuk! Mengarahkan ke Kuis Pengaman...');
      setTimeout(() => {
        onAuthenticated(res.user!);
      }, 500);
    } catch (err: any) {
      setErrorMsg('Terjadi kesalahan saat masuk. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-[#E5E5E5] flex flex-col items-center justify-center p-4 sm:p-6 relative overflow-hidden font-sans select-none">
      {/* Background Ambience Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-80 h-80 bg-purple-500/5 rounded-full blur-3xl pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, scale: 0.96, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="w-full max-w-md bg-neutral-900/90 rounded-2xl border border-[#262626] shadow-2xl p-6 sm:p-8 relative backdrop-blur-md flex flex-col gap-5"
        id="auth-container-card"
      >
        {/* Brand & Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center gap-2 px-3 py-1 rounded-full bg-neutral-950 border border-amber-500/30 text-amber-400 text-xs font-mono font-bold tracking-wider uppercase mb-1 shadow-inner">
            <Globe2 className="w-3.5 h-3.5" />
            <span>Multi-Device Cloud Vault</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center justify-center gap-2">
            Big<span className="text-amber-400">MA</span>
            <span className="text-xs font-bold text-neutral-400 uppercase tracking-widest bg-neutral-800 px-2.5 py-0.5 rounded border border-neutral-700">
              Account Manajement
            </span>
          </h1>

          <p className="text-xs text-neutral-400 max-w-xs mx-auto">
            Akses dan sinkronisasi seluruh database akun, catatan, keuangan & deadline Anda dengan aman di semua device.
          </p>
        </div>

        {/* Login Title Banner */}
        <div className="p-3 bg-neutral-950 border border-[#262626] rounded-xl flex items-center justify-center gap-2 text-xs font-bold text-amber-400">
          <Lock className="w-4 h-4 text-amber-400" />
          <span>Masuk Akun BigMA Vault</span>
        </div>

        {/* Alerts / Error & Success Messages */}
        <AnimatePresence>
          {errorMsg && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="p-3 bg-rose-500/15 border border-rose-500/40 rounded-xl text-xs text-rose-300 flex items-start gap-2.5"
            >
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
              <span>{errorMsg}</span>
            </motion.div>
          )}

          {successMsg && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="p-3 bg-emerald-500/15 border border-emerald-500/40 rounded-xl text-xs text-emerald-300 flex items-start gap-2.5"
            >
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-400" />
              <span>{successMsg}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Auth Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="block text-xs font-medium text-neutral-300 mb-1">
              Email Akun
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Masukkan email akun"
                className="w-full bg-neutral-950 border border-[#262626] focus:border-amber-400 rounded-xl py-2.5 pl-9 pr-3 text-xs text-white placeholder-neutral-600 focus:outline-none focus:ring-1 focus:ring-amber-400 transition-colors font-mono"
                id="auth-email-input"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-300 mb-1">
              Kata Sandi
            </label>
            <div className="relative">
              <KeyRound className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Masukkan kata sandi"
                className="w-full bg-neutral-950 border border-[#262626] focus:border-amber-400 rounded-xl py-2.5 pl-9 pr-3 text-xs text-white placeholder-neutral-600 focus:outline-none focus:ring-1 focus:ring-amber-400 transition-colors font-mono"
                id="auth-password-input"
              />
            </div>
          </div>

          {/* Submit Button */}
          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-neutral-950 font-bold text-xs rounded-xl shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 cursor-pointer transition-all mt-4 disabled:opacity-50"
            id="auth-submit-btn"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-neutral-950 border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <span>Masuk & Lanjut ke Kuis Pengaman</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </motion.button>
        </form>

        {/* Security & Multi-Device Feature Badges */}
        <div className="pt-2 border-t border-[#262626] grid grid-cols-2 gap-2 text-[10px] text-neutral-400">
          <div className="flex items-center gap-1.5 p-2 rounded-lg bg-neutral-950/60 border border-[#222]">
            <Smartphone className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>Buka di HP, Laptop & PC</span>
          </div>
          <div className="flex items-center gap-1.5 p-2 rounded-lg bg-neutral-950/60 border border-[#222]">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>Kuis Pengaman Benang</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
