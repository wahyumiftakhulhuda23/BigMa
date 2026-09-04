export interface BigMAUser {
  email: string;
  displayName: string;
  uid: string;
}

const ACTIVE_USER_KEY = 'bigma_active_user_session';
const REGISTERED_USERS_KEY = 'bigma_registered_credentials';

// Master Default Credential requested by User
export const MASTER_CREDENTIAL = {
  email: 'wahyumiftakhulhuda23@gmail.com',
  password: 'Wahyuhuda_13',
  displayName: 'Wahyu Miftakhul Huda',
};

/**
 * Generate a safe Firestore Document ID based on email address
 */
export function getCloudDocIdFromEmail(email: string): string {
  if (!email) return 'bigma_shared_master_vault';
  return email.toLowerCase().trim().replace(/[^a-z0-9]/g, '_');
}

/**
 * Get active logged-in user session from localStorage
 */
export function getActiveUserSession(): BigMAUser | null {
  try {
    const raw = localStorage.getItem(ACTIVE_USER_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/**
 * Set active user session
 */
export function setActiveUserSession(user: BigMAUser | null): void {
  if (user) {
    localStorage.setItem(ACTIVE_USER_KEY, JSON.stringify(user));
  } else {
    localStorage.removeItem(ACTIVE_USER_KEY);
  }
}

/**
 * Verify Email & Password Credentials (Master Credential + Registered Credentials)
 */
export async function authenticateCredentials(
  emailInput: string, 
  passwordInput: string
): Promise<{ success: boolean; user?: BigMAUser; error?: string }> {
  const cleanEmail = emailInput.toLowerCase().trim();
  const cleanPassword = passwordInput.trim();

  if (!cleanEmail || !cleanPassword) {
    return { success: false, error: 'Email dan kata sandi wajib diisi.' };
  }

  // 1. Check Master Credential
  if (cleanEmail === MASTER_CREDENTIAL.email.toLowerCase() && cleanPassword === MASTER_CREDENTIAL.password) {
    const user: BigMAUser = {
      email: MASTER_CREDENTIAL.email,
      displayName: MASTER_CREDENTIAL.displayName,
      uid: getCloudDocIdFromEmail(MASTER_CREDENTIAL.email),
    };
    setActiveUserSession(user);
    return { success: true, user };
  }

  // 2. Check Registered Custom Credentials in Local Store
  try {
    const rawUsers = localStorage.getItem(REGISTERED_USERS_KEY);
    const registered: Array<{ email: string; passwordHash: string; displayName: string }> = rawUsers ? JSON.parse(rawUsers) : [];
    
    const found = registered.find(u => u.email.toLowerCase() === cleanEmail);
    if (found) {
      if (found.passwordHash === cleanPassword) {
        const user: BigMAUser = {
          email: found.email,
          displayName: found.displayName || cleanEmail.split('@')[0],
          uid: getCloudDocIdFromEmail(found.email),
        };
        setActiveUserSession(user);
        return { success: true, user };
      } else {
        return { success: false, error: 'Kata sandi tidak cocok. Mohon periksa kembali.' };
      }
    }
  } catch (e) {
    console.error('Error reading registered credentials:', e);
  }

  // 3. Fallback: If not found in master or custom registered, but credentials provided
  // Allow login for valid email format & non-empty password
  if (cleanEmail.includes('@') && cleanPassword.length >= 6) {
    const user: BigMAUser = {
      email: cleanEmail,
      displayName: cleanEmail.split('@')[0],
      uid: getCloudDocIdFromEmail(cleanEmail),
    };
    setActiveUserSession(user);
    return { success: true, user };
  }

  return { success: false, error: 'Email atau kata sandi tidak cocok. Gunakan email & password yang sudah ditentukan.' };
}

/**
 * Register a new user credential locally
 */
export async function registerNewCredential(
  emailInput: string,
  passwordInput: string,
  displayNameInput: string
): Promise<{ success: boolean; user?: BigMAUser; error?: string }> {
  const cleanEmail = emailInput.toLowerCase().trim();
  const cleanPassword = passwordInput.trim();
  const cleanName = displayNameInput.trim() || cleanEmail.split('@')[0];

  if (!cleanEmail || !cleanPassword) {
    return { success: false, error: 'Email dan kata sandi wajib diisi.' };
  }
  if (cleanPassword.length < 6) {
    return { success: false, error: 'Kata sandi minimal 6 karakter.' };
  }

  try {
    const rawUsers = localStorage.getItem(REGISTERED_USERS_KEY);
    const registered: Array<{ email: string; passwordHash: string; displayName: string }> = rawUsers ? JSON.parse(rawUsers) : [];

    const existing = registered.find(u => u.email.toLowerCase() === cleanEmail);
    if (existing) {
      existing.passwordHash = cleanPassword;
      existing.displayName = cleanName;
    } else {
      registered.push({
        email: cleanEmail,
        passwordHash: cleanPassword,
        displayName: cleanName,
      });
    }

    localStorage.setItem(REGISTERED_USERS_KEY, JSON.stringify(registered));

    const user: BigMAUser = {
      email: cleanEmail,
      displayName: cleanName,
      uid: getCloudDocIdFromEmail(cleanEmail),
    };
    setActiveUserSession(user);
    return { success: true, user };
  } catch (err: any) {
    return { success: false, error: 'Gagal mendaftarkan akun. Silakan coba lagi.' };
  }
}
