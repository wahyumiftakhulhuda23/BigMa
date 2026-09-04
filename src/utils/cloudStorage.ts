import { db, doc, getDoc, setDoc, onSnapshot } from '../lib/firebase';
import { AppData, AppSettings, GmailAccount, PlatformAccount, AccountNote, RealtimeFinance, IncomeRecord, ProjectDeadline } from '../types';

const COLLECTION_NAME = 'userAppData';

// Clean data before storing in Firestore (ensure no undefined fields)
function sanitizeAppData(data: AppData): AppData {
  return {
    gmails: (data.gmails || []).map(g => ({
      ...g,
      phoneRecovery: g.phoneRecovery ?? '',
      notes: g.notes ?? '',
    })),
    platformAccounts: (data.platformAccounts || []).map(p => ({
      ...p,
      customPlatformName: p.customPlatformName ?? '',
      platformPassword: p.platformPassword ?? '',
      customCredentials: p.customCredentials ?? '',
      channelOrProfileUrl: p.channelOrProfileUrl ?? '',
      niche: p.niche ?? '',
      notes: p.notes ?? '',
    })),
    notes: (data.notes || []).map(n => ({
      ...n,
      reminderDate: n.reminderDate ?? '',
      reminderTime: n.reminderTime ?? '',
      reminderStatus: n.reminderStatus ?? 'Pending',
      tags: n.tags ?? [],
    })),
    realtimeFinances: (data.realtimeFinances || []).map(f => ({
      ...f,
      accountHolder: f.accountHolder ?? '',
      notes: f.notes ?? '',
    })),
    incomes: (data.incomes || []).map(i => ({
      ...i,
      referenceNo: i.referenceNo ?? '',
      notes: i.notes ?? '',
    })),
    deadlines: (data.deadlines || []).map(d => ({
      ...d,
      platformAccountId: d.platformAccountId ?? '',
      notes: d.notes ?? '',
      targetQuantity: d.targetQuantity ?? '',
    })),
    settings: {
      studioName: data.settings?.studioName || 'BigMA Studio',
      usdToIdrRate: data.settings?.usdToIdrRate || 16250,
      eurToIdrRate: data.settings?.eurToIdrRate || 17400,
    },
  };
}

/**
 * Save user app data to Firestore cloud document
 */
export async function saveUserAppDataToCloud(userId: string, data: AppData): Promise<boolean> {
  if (!userId) return false;
  try {
    const docRef = doc(db, COLLECTION_NAME, userId);
    const sanitized = sanitizeAppData(data);
    await setDoc(docRef, {
      ...sanitized,
      updatedAt: new Date().toISOString(),
    }, { merge: true });
    return true;
  } catch (error) {
    console.error('Error saving data to Firestore:', error);
    return false;
  }
}

/**
 * Load user app data from Firestore cloud document
 */
export async function loadUserAppDataFromCloud(userId: string): Promise<AppData | null> {
  if (!userId) return null;
  try {
    const docRef = doc(db, COLLECTION_NAME, userId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        gmails: data.gmails || [],
        platformAccounts: data.platformAccounts || [],
        notes: data.notes || [],
        realtimeFinances: data.realtimeFinances || [],
        incomes: data.incomes || [],
        deadlines: data.deadlines || [],
        settings: {
          studioName: data.settings?.studioName || 'BigMA Studio',
          usdToIdrRate: data.settings?.usdToIdrRate || 16250,
          eurToIdrRate: data.settings?.eurToIdrRate || 17400,
        },
      };
    }
    return null;
  } catch (error) {
    console.error('Error loading data from Firestore:', error);
    return null;
  }
}

/**
 * Subscribe in real-time to remote updates from other devices
 */
export function subscribeUserAppDataFromCloud(
  userId: string, 
  onUpdate: (data: AppData) => void
): () => void {
  if (!userId) return () => {};
  
  try {
    const docRef = doc(db, COLLECTION_NAME, userId);
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        onUpdate({
          gmails: data.gmails || [],
          platformAccounts: data.platformAccounts || [],
          notes: data.notes || [],
          realtimeFinances: data.realtimeFinances || [],
          incomes: data.incomes || [],
          deadlines: data.deadlines || [],
          settings: {
            studioName: data.settings?.studioName || 'BigMA Studio',
            usdToIdrRate: data.settings?.usdToIdrRate || 16250,
            eurToIdrRate: data.settings?.eurToIdrRate || 17400,
          },
        });
      }
    }, (error) => {
      console.warn('Firestore subscription warning:', error);
    });
    return unsubscribe;
  } catch (err) {
    console.error('Failed to subscribe to Firestore:', err);
    return () => {};
  }
}
