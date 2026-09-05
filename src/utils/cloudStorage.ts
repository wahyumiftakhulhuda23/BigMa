import { db, doc, getDoc, setDoc, onSnapshot } from '../lib/firebase';
import { AppData } from '../types';

export const MASTER_VAULT_DOC_ID = 'bigma_master_vault';
const COLLECTION_NAME = 'userAppData';

// Clean data before storing in Firestore (ensure no undefined fields)
export function sanitizeAppData(data: AppData): AppData {
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
    console.error('Error loading data from Cloud Firestore:', error);
    return null;
  }
}

/**
 * Subscribe in real-time to remote updates from other devices (HP, Laptop, PC)
 */
export function subscribeMasterAppDataFromCloud(
  onUpdate: (data: AppData) => void,
  docId: string = MASTER_VAULT_DOC_ID
): () => void {
  try {
    const docRef = doc(db, COLLECTION_NAME, docId);
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
    console.error('Failed to subscribe to Cloud Firestore:', err);
    return () => {};
  }
}

// Aliases for compatibility
export const saveUserAppDataToCloud = (userId: string, data: AppData) => saveMasterAppDataToCloud(data, userId || MASTER_VAULT_DOC_ID);
export const loadUserAppDataFromCloud = (userId: string) => loadMasterAppDataFromCloud(userId || MASTER_VAULT_DOC_ID);
export const subscribeUserAppDataFromCloud = (userId: string, onUpdate: (data: AppData) => void) => subscribeMasterAppDataFromCloud(onUpdate, userId || MASTER_VAULT_DOC_ID);
