import { db, doc, getDoc, setDoc, onSnapshot } from '../lib/firebase';
import { AppData, GmailAccount, PlatformAccount, AccountNote, RealtimeFinance, IncomeRecord, ProjectDeadline } from '../types';

export const MASTER_VAULT_DOC_ID = 'bigma_master_vault';
export const COLLECTION_NAME = 'userAppData';

// Clean and sanitize data before storing in Firestore (ensuring full type compliance & no undefined fields)
export function sanitizeAppData(data: Partial<AppData>): AppData {
  return {
    gmails: (data.gmails || []).map((g: Partial<GmailAccount>) => ({
      id: g.id || `gm_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      email: g.email || '',
      password: g.password || '',
      code2FA: g.code2FA ?? '',
      recoveryEmail: g.recoveryEmail ?? '',
      recoveryPassword: g.recoveryPassword ?? '',
      phoneRecovery: g.phoneRecovery ?? '',
      connectedAccountsNote: g.connectedAccountsNote ?? '',
      notes: g.notes ?? '',
      createdAt: g.createdAt || new Date().toISOString(),
      updatedAt: g.updatedAt || new Date().toISOString(),
    })),
    platformAccounts: (data.platformAccounts || []).map((p: Partial<PlatformAccount>) => ({
      id: p.id || `pl_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      gmailId: p.gmailId || '',
      platform: p.platform || 'YouTube',
      customPlatformName: p.customPlatformName ?? '',
      accountName: p.accountName || '',
      usernameOrHandle: p.usernameOrHandle || '',
      platformPassword: p.platformPassword ?? '',
      customCredentials: p.customCredentials ?? '',
      channelOrProfileUrl: p.channelOrProfileUrl ?? '',
      status: (p.status as any) || 'Aktif',
      niche: p.niche ?? '',
      notes: p.notes ?? '',
      createdAt: p.createdAt || new Date().toISOString(),
    })),
    notes: (data.notes || []).map((n: Partial<AccountNote>) => ({
      id: n.id || `nt_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      platformAccountId: n.platformAccountId || 'general',
      title: n.title || '',
      content: n.content || '',
      category: (n.category as any) || 'Umum',
      priority: (n.priority as any) || 'Sedang',
      hasReminder: !!n.hasReminder,
      reminderDate: n.reminderDate ?? '',
      reminderTime: n.reminderTime ?? '',
      reminderStatus: (n.reminderStatus as any) || 'Pending',
      tags: Array.isArray(n.tags) ? n.tags : [],
      createdAt: n.createdAt || new Date().toISOString(),
      updatedAt: n.updatedAt || new Date().toISOString(),
    })),
    realtimeFinances: (data.realtimeFinances || []).map((f: Partial<RealtimeFinance>) => ({
      id: f.id || `fn_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      platformAccountId: f.platformAccountId || '',
      availableBalance: Number(f.availableBalance) || 0,
      pendingEarnings: Number(f.pendingEarnings) || 0,
      currency: (f.currency as any) || 'USD',
      payoutThreshold: Number(f.payoutThreshold) || 100,
      paymentMethod: f.paymentMethod || 'Paypal',
      accountHolder: f.accountHolder ?? '',
      lastUpdated: f.lastUpdated || new Date().toISOString(),
      notes: f.notes ?? '',
    })),
    incomes: (data.incomes || []).map((i: Partial<IncomeRecord>) => ({
      id: i.id || `in_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      platformAccountId: i.platformAccountId || '',
      date: i.date || new Date().toISOString().split('T')[0],
      amount: Number(i.amount) || 0,
      currency: (i.currency as any) || 'USD',
      exchangeRate: Number(i.exchangeRate) || 16250,
      amountIdr: Number(i.amountIdr) || 0,
      paymentSource: i.paymentSource || 'Paypal',
      category: i.category || 'Royalty Microstock',
      referenceNo: i.referenceNo ?? '',
      notes: i.notes ?? '',
      createdAt: i.createdAt || new Date().toISOString(),
    })),
    deadlines: (data.deadlines || []).map((d: Partial<ProjectDeadline>) => ({
      id: d.id || `dl_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      title: d.title || '',
      platformAccountId: d.platformAccountId ?? '',
      dueDate: d.dueDate || new Date().toISOString().split('T')[0],
      priority: (d.priority as any) || 'Sedang',
      status: (d.status as any) || 'Belum Selesai',
      targetQuantity: d.targetQuantity ?? '',
      notes: d.notes ?? '',
      createdAt: d.createdAt || new Date().toISOString(),
    })),
    settings: {
      studioName: data.settings?.studioName || 'BigMA Studio',
      usdToIdrRate: Number(data.settings?.usdToIdrRate) || 16250,
      eurToIdrRate: Number(data.settings?.eurToIdrRate) || 17400,
    },
  };
}

/**
 * Save master vault app data to Firestore cloud document (synchronized across all devices)
 */
export async function saveMasterAppDataToCloud(data: AppData, docId: string = MASTER_VAULT_DOC_ID): Promise<boolean> {
  try {
    const docRef = doc(db, COLLECTION_NAME, docId);
    const sanitized = sanitizeAppData(data);
    await setDoc(docRef, {
      ...sanitized,
      updatedAt: new Date().toISOString(),
    }, { merge: true });
    return true;
  } catch (error) {
    console.error('Error saving data to Cloud Firestore:', error);
    return false;
  }
}

/**
 * Load master vault app data from Firestore cloud document
 */
export async function loadMasterAppDataFromCloud(docId: string = MASTER_VAULT_DOC_ID): Promise<AppData | null> {
  try {
    const docRef = doc(db, COLLECTION_NAME, docId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      return sanitizeAppData(data as any);
    }
    return null;
  } catch (error) {
    console.error('Error loading data from Cloud Firestore:', error);
    return null;
  }
}

/**
 * Subscribe in real-time to remote updates from other devices (HP, Laptop, PC)
 */
export function subscribeMasterAppDataFromCloud(
  onUpdate: (data: AppData) => void,
  onError?: (err: any) => void,
  docId: string = MASTER_VAULT_DOC_ID
): () => void {
  try {
    const docRef = doc(db, COLLECTION_NAME, docId);
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        onUpdate(sanitizeAppData(data as any));
      }
    }, (error) => {
      console.warn('Firestore subscription warning:', error);
      if (onError) onError(error);
    });
    return unsubscribe;
  } catch (err) {
    console.error('Failed to subscribe to Cloud Firestore:', err);
    if (onError) onError(err);
    return () => {};
  }
}

// Aliases for compatibility
export const saveUserAppDataToCloud = (userId: string, data: AppData) => saveMasterAppDataToCloud(data, userId || MASTER_VAULT_DOC_ID);
export const loadUserAppDataFromCloud = (userId: string) => loadMasterAppDataFromCloud(userId || MASTER_VAULT_DOC_ID);
export const subscribeUserAppDataFromCloud = (userId: string, onUpdate: (data: AppData) => void) => subscribeMasterAppDataFromCloud(onUpdate, undefined, userId || MASTER_VAULT_DOC_ID);
