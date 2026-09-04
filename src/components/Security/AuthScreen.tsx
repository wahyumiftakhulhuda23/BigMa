import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Lock, 
  Mail, 
  KeyRound, 
  User as UserIcon, 
  ArrowRight, 
  Sparkles, 
  ShieldCheck, 
  Globe2, 
  AlertCircle,
  CheckCircle2,
  Layers,
  Smartphone
} from 'lucide-react';
import { 
  auth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInWithPopup, 
  googleProvider,
  updateProfile 
} from '../../lib/firebase';

interface AuthScreenProps {
  onAuthenticated: () => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onAuthenticated }) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  
  // Form fields
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // UI states
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Helper to format Firebase Auth errors into clear Indonesian
  const getFriendlyErrorMessage = (error: any): string => {
    const code = error?.code || '';
    switch (code) {
      case 'auth/email-already-in-use':
        return 'Email ini sudah terdaftar. Silakan gunakan tab Masuk Akun.';
      case 'auth/invalid-email':
        return 'Format email tidak valid. Periksa kembali penulisan email.';
      case 'auth/weak-password':
        return 'Kata sandi terlalu pendek. Gunakan minimal 6 karakter.';
      case 'auth/user-not-found':
      case 'auth/wrong-password':
      case 'auth/invalid-credential':
        return 'Email atau kata sandi tidak cocok. Mohon periksa kembali.';
      case 'auth/too-many-requests':
        return 'Terlalu banyak percobaan gagal. Silakan tunggu beberapa saat lagi.';
      case 'auth/popup-closed-by-user':
        return 'Jendela login Google ditutup sebelum selesai.';
      case 'auth/network-request-failed':
        return 'Gagal terhubung ke jaringan internet. Periksa koneksi Anda.';
      default:
        return error?.message || 'Terjadi kesalahan autentikasi. Silakan coba lagi.';
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!email.trim() || !password.trim()) {
      setErrorMsg('Email dan kata sandi wajib diisi.');
      return;
    }

    if (mode === 'register') {
      if (password.length < 6) {
        setErrorMsg('Kata sandi minimal 6 karakter.');
        return;
      }
      if (password !== confirmPassword) {
        setErrorMsg('Konfirmasi kata sandi tidak sesuai.');
        return;
      }
    }

    setLoading(true);

    try {
      if (mode === 'register') {
        const userCred = await createUserWithEmailAndPassword(auth, email.trim(), password);
        if (displayName.trim() && userCred.user) {
          await updateProfile(userCred.user, { displayName: displayName.trim() });
        }
        setSuccessMsg('Pendaftaran akun berhasil! Mengarahkan ke Verifikasi Pengaman...');
      } else {
        await signInWithEmailAndPassword(auth, email.trim(), password);
        setSuccessMsg('Berhasil masuk! Mengarahkan ke Verifikasi Pengaman...');
      }

      setTimeout(() => {
        onAuthenticated();
      }, 700);
    } catch (err: any) {
      setErrorMsg(getFriendlyErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setErrorMsg(null);
    setSuccessMsg(null);
    setGoogleLoading(true);

    try {
      await signInWithPopup(auth, googleProvider);
      setSuccessMsg('Login dengan Google berhasil! Mengarahkan ke Verifikasi Pengaman...');
      setTimeout(() => {
        onAuthenticated();
      }, 700);
    } catch (err: any) {
      setErrorMsg(getFriendlyErrorMessage(err));
    } finally {
      setGoogleLoading(false);
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
        className="w-full max-w-md bg-neutral-900/90 rounded-2xl border border-[#262626] shadow-2xl p-6 sm:p-8 relative backdrop-blur-md flex flex-col gap-6"
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

        {/* Mode Switcher Tabs */}
        <div className="grid grid-cols-2 p-1 bg-neutral-950 rounded-xl border border-[#262626]">
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setErrorMsg(null);
            }}
            className={`py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer ${
              mode === 'login'
                ? 'bg-amber-500 text-neutral-950 shadow-md shadow-amber-500/20'
                : 'text-neutral-400 hover:text-white'
            }`}
            id="tab-login-btn"
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Masuk Akun</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setMode('register');
              setErrorMsg(null);
            }}
            className={`py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer ${
              mode === 'register'
                ? 'bg-amber-500 text-neutral-950 shadow-md shadow-amber-500/20'
                : 'text-neutral-400 hover:text-white'
            }`}
            id="tab-register-btn"
          >
            <UserIcon className="w-3.5 h-3.5" />
            <span>Daftar Akun Baru</span>
          </button>
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
        <form onSubmit={handleEmailSubmit} className="space-y-3.5">
          {mode === 'register' && (
            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1">
                Nama Lengkap / Panggilan
              </label>
              <div className="relative">
                <UserIcon className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Contoh: Wahyu Miftakhul"
                  className="w-full bg-neutral-950 border border-[#262626] focus:border-amber-400 rounded-xl py-2.5 pl-9 pr-3 text-xs text-white placeholder-neutral-600 focus:outline-none focus:ring-1 focus:ring-amber-400 transition-colors"
                  id="auth-name-input"
                />
              </div>
            </div>
          )}

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
                placeholder="nama@email.com"
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
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimal 6 karakter"
                className="w-full bg-neutral-950 border border-[#262626] focus:border-amber-400 rounded-xl py-2.5 pl-9 pr-3 text-xs text-white placeholder-neutral-600 focus:outline-none focus:ring-1 focus:ring-amber-400 transition-colors font-mono"
                id="auth-password-input"
              />
            </div>
          </div>

          {mode === 'register' && (
            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1">
                Ulangi Kata Sandi
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  minLength={6}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Ketik ulang kata sandi"
                  className="w-full bg-neutral-950 border border-[#262626] focus:border-amber-400 rounded-xl py-2.5 pl-9 pr-3 text-xs text-white placeholder-neutral-600 focus:outline-none focus:ring-1 focus:ring-amber-400 transition-colors font-mono"
                  id="auth-confirm-password-input"
                />
              </div>
            </div>
          )}

          {/* Submit Button */}
          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            type="submit"
            disabled={loading || googleLoading}
            className="w-full py-3 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-neutral-950 font-bold text-xs rounded-xl shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 cursor-pointer transition-all mt-4 disabled:opacity-50"
            id="auth-submit-btn"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-neutral-950 border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <span>{mode === 'register' ? 'Daftar & Lanjut ke Kuis Pengaman' : 'Masuk & Lanjut ke Kuis Pengaman'}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </motion.button>
        </form>

        {/* Divider */}
        <div className="relative flex items-center justify-center">
          <div className="border-t border-[#262626] w-full" />
          <span className="bg-neutral-900 px-3 text-[11px] text-neutral-500 uppercase font-mono tracking-wider absolute">
            atau
          </span>
        </div>

        {/* Google Sign-In */}
        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={loading || googleLoading}
          className="w-full py-2.5 bg-neutral-950 hover:bg-neutral-800 border border-[#262626] hover:border-neutral-700 text-neutral-200 text-xs font-semibold rounded-xl flex items-center justify-center gap-3 transition-colors cursor-pointer disabled:opacity-50"
          id="google-signin-btn"
        >
          {googleLoading ? (
            <div className="w-4 h-4 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#EA4335"
                  d="M12 5c1.6 0 3 .6 4.1 1.7l3.1-3.1C17.3 1.8 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.3 9 5 12 5z"
                />
                <path
                  fill="#4285F4"
                  d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5.1 3.7-8.8z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.6 14.8c-.3-.8-.4-1.8-.4-2.8s.2-1.9.4-2.8L1.9 6.3C.7 8.7 0 10.3 0 12s.7 3.3 1.9 5.7l3.7-2.9z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.3-6.4-5.2L1.9 16c1.8 3.7 5.6 6.3 10.1 6.3z"
                />
              </svg>
              <span>Masuk Cepat dengan Google</span>
            </>
          )}
        </button>

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
